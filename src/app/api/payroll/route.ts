import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN', 'STAFF']);
  if ('status' in auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const teacherId = searchParams.get('teacherId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const db = getDb();

    let query = `
      SELECT 
        sal.id,
        sal.teacher_id,
        sal.academic_year_id,
        sal.month,
        sal.basic_salary,
        sal.allowance,
        sal.deduction,
        COALESCE(sal.other_adjustment, 0) as other_adjustment,
        sal.net_salary,
        sal.status,
        sal.payment_date,
        sal.payment_mode,
        sal.payment_reference,
        sal.notes,
        sal.updated_at,
        t.staff_id,
        t.full_name as teacher_name,
        t.designation,
        t.photo_url,
        t.phone as teacher_phone,
        t.qualification,
        t.is_active as teacher_active
      FROM salaries sal
      JOIN teachers t ON sal.teacher_id = t.id
      WHERE 1=1
    `;
    const args: any[] = [];

    // Role check: Staff can ONLY view their own salary information
    if (auth.user.role === 'STAFF') {
      if (!auth.user.teacher_id) {
        return NextResponse.json({ salaries: [], totals: {}, canEdit: false });
      }
      query += ' AND sal.teacher_id = ?';
      args.push(auth.user.teacher_id);
    } else {
      if (teacherId && teacherId !== 'All') {
        query += ' AND sal.teacher_id = ?';
        args.push(Number(teacherId));
      }
    }

    if (month && month !== 'All') {
      query += ' AND sal.month = ?';
      args.push(month);
    }

    if (status && status !== 'All') {
      query += ' AND sal.status = ?';
      args.push(status);
    }

    if (search) {
      const q = `%${search.trim()}%`;
      query += ' AND (t.full_name LIKE ? OR t.staff_id LIKE ? OR sal.payment_reference LIKE ?)';
      args.push(q, q, q);
    }

    query += ' ORDER BY sal.id DESC';

    const res = await db.execute({ sql: query, args });
    const salaries = res.rows;

    // Calculate totals
    let totalBasic = 0;
    let totalAllowances = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let totalPaid = 0;
    let totalPending = 0;

    salaries.forEach((s: any) => {
      const basic = Number(s.basic_salary || 0);
      const allow = Number(s.allowance || 0);
      const ded = Number(s.deduction || 0);
      const net = Number(s.net_salary || 0);
      totalBasic += basic;
      totalAllowances += allow;
      totalDeductions += ded;
      totalNet += net;

      if (s.status === 'Paid') {
        totalPaid += net;
      } else {
        totalPending += net;
      }
    });

    const monthsRes = await db.execute('SELECT DISTINCT month FROM salaries ORDER BY id DESC');
    const availableMonths = monthsRes.rows.map((r: any) => r.month);

    return NextResponse.json({
      salaries,
      canEdit: ['SUPER_ADMIN', 'OFFICE_ADMIN'].includes(auth.user.role),
      totals: {
        totalBasic,
        totalAllowances,
        totalDeductions,
        totalNet,
        totalPaid,
        totalPending,
        count: salaries.length
      },
      availableMonths
    });
  } catch (err: any) {
    console.error('Payroll GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // SECURITY: ONLY Office Admin / Super Admin can create salary records
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const data = await req.json();
    const { action, month, teacherId, basicSalary, allowance, deduction, otherAdjustment, status, paymentDate, paymentMode, notes } = data;
    const db = getDb();

    // 1. Batch Generate Month Payroll for All Active Faculty
    if (action === 'generate_month') {
      if (!month) return NextResponse.json({ error: 'Month is required' }, { status: 400 });

      const teachers = await db.execute('SELECT id, staff_id, full_name, designation FROM teachers WHERE is_active = 1');
      let createdCount = 0;

      for (const t of teachers.rows) {
        const lastSal = await db.execute({
          sql: 'SELECT basic_salary, allowance, deduction, other_adjustment FROM salaries WHERE teacher_id = ? ORDER BY id DESC LIMIT 1',
          args: [t.id]
        });

        const basic = Number(lastSal.rows[0]?.basic_salary || 18000);
        const allow = Number(lastSal.rows[0]?.allowance || 1500);
        const ded = Number(lastSal.rows[0]?.deduction || 500);
        const adj = Number(lastSal.rows[0]?.other_adjustment || 0);
        const net = basic + allow + adj - ded;

        await db.execute({
          sql: `
            INSERT INTO salaries 
            (teacher_id, academic_year_id, month, basic_salary, allowance, deduction, other_adjustment, net_salary, status, notes)
            VALUES (?, 3, ?, ?, ?, ?, ?, ?, 'Pending', ?)
            ON CONFLICT(teacher_id, month) DO UPDATE SET
              basic_salary = excluded.basic_salary,
              allowance = excluded.allowance,
              deduction = excluded.deduction,
              other_adjustment = excluded.other_adjustment,
              net_salary = excluded.net_salary,
              updated_at = CURRENT_TIMESTAMP
          `,
          args: [t.id, month, basic, allow, ded, adj, net, `Monthly payroll for ${t.full_name}`]
        });
        createdCount++;
      }

      await logAudit({
        user: auth.user,
        action: 'PAYROLL_MONTH_GENERATED',
        module: 'Payroll',
        targetId: month,
        newValue: { month, generatedFor: createdCount }
      });

      return NextResponse.json({
        success: true,
        message: `Payroll for ${month} generated successfully for ${createdCount} teachers!`
      });
    }

    // 2. Individual Salary Record Add / Update
    if (!teacherId || !month) {
      return NextResponse.json({ error: 'Teacher ID and month are required' }, { status: 400 });
    }

    const basic = Number(basicSalary) || 0;
    const allow = Number(allowance) || 0;
    const ded = Number(deduction) || 0;
    const adj = Number(otherAdjustment) || 0;
    const net = basic + allow + adj - ded; // Automatically calculated

    const finalStatus = status || 'Pending';
    const payDate = finalStatus === 'Paid' ? (paymentDate || new Date().toISOString().split('T')[0]) : null;

    await db.execute({
      sql: `
        INSERT INTO salaries 
        (teacher_id, academic_year_id, month, basic_salary, allowance, deduction, other_adjustment, net_salary, status, payment_date, payment_mode, notes)
        VALUES (?, 3, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(teacher_id, month) DO UPDATE SET
          basic_salary = excluded.basic_salary,
          allowance = excluded.allowance,
          deduction = excluded.deduction,
          other_adjustment = excluded.other_adjustment,
          net_salary = excluded.net_salary,
          status = excluded.status,
          payment_date = excluded.payment_date,
          payment_mode = excluded.payment_mode,
          notes = excluded.notes,
          updated_at = CURRENT_TIMESTAMP
      `,
      args: [
        Number(teacherId), month, basic, allow, ded, adj, net, finalStatus, payDate, paymentMode || 'Bank Transfer', notes || null
      ]
    });

    await logAudit({
      user: auth.user,
      action: 'SALARY_RECORD_SAVED',
      module: 'Payroll',
      targetId: `Teacher:${teacherId}:Month:${month}`,
      newValue: { teacherId, month, basic, allow, ded, adj, net, status: finalStatus, paymentDate: payDate }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Salary record for ${month} saved successfully! (Net Salary: ₹${net.toLocaleString()})` 
    });
  } catch (err: any) {
    console.error('Payroll POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  // SECURITY: ONLY Office Admin / Super Admin can edit salary records
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const data = await req.json();
    const {
      id: rawId,
      salaryId,
      basicSalary,
      allowance,
      deduction,
      otherAdjustment,
      status,
      paymentDate,
      paymentMode,
      paymentReference,
      notes
    } = data;

    const id = rawId || salaryId;
    if (!id) return NextResponse.json({ error: 'Salary record ID required' }, { status: 400 });

    const db = getDb();
    const oldRes = await db.execute({ sql: 'SELECT * FROM salaries WHERE id = ?', args: [Number(id)] });
    if (oldRes.rows.length === 0) return NextResponse.json({ error: 'Salary record not found' }, { status: 404 });
    const old = oldRes.rows[0];

    const basic = basicSalary !== undefined ? Number(basicSalary) : Number(old.basic_salary);
    const allow = allowance !== undefined ? Number(allowance) : Number(old.allowance);
    const ded = deduction !== undefined ? Number(deduction) : Number(old.deduction);
    const adj = otherAdjustment !== undefined ? Number(otherAdjustment) : Number(old.other_adjustment || 0);
    const net = basic + allow + adj - ded; // Automatically calculated

    const finalStatus = status || String(old.status);
    let finalPayDate = paymentDate !== undefined ? paymentDate : old.payment_date;
    if (finalStatus === 'Paid' && !finalPayDate) {
      finalPayDate = new Date().toISOString().split('T')[0];
    }

    await db.execute({
      sql: `
        UPDATE salaries
        SET basic_salary = ?,
            allowance = ?,
            deduction = ?,
            other_adjustment = ?,
            net_salary = ?,
            status = ?,
            payment_date = ?,
            payment_mode = COALESCE(?, payment_mode),
            payment_reference = COALESCE(?, payment_reference),
            notes = COALESCE(?, notes),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [
        basic,
        allow,
        ded,
        adj,
        net,
        finalStatus,
        finalPayDate || null,
        paymentMode || null,
        paymentReference || null,
        notes || null,
        Number(id)
      ]
    });

    await logAudit({
      user: auth.user,
      action: 'SALARY_RECORD_UPDATED',
      module: 'Payroll',
      targetId: String(id),
      previousValue: old,
      newValue: { basic, allow, ded, adj, net, status: finalStatus, paymentDate: finalPayDate }
    });

    return NextResponse.json({
      success: true,
      message: `Salary record updated successfully! Net Salary: ₹${net.toLocaleString()}`
    });
  } catch (err: any) {
    console.error('Payroll PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
