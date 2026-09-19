import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const classIdParam = searchParams.get('classId');
    const genderParam = searchParams.get('gender') || searchParams.get('wing');
    const monthParam = searchParams.get('month');
    const statusParam = searchParams.get('status');
    const searchParam = searchParams.get('search') || '';

    const db = getDb();

    // 1. Student / Parent Direct View
    if (auth.user.role === 'STUDENT' || (studentId && auth.user.role === 'PARENT')) {
      const targetStudentId = auth.user.role === 'STUDENT' ? auth.user.student_id : Number(studentId);
      const res = await db.execute({
        sql: `
          SELECT f.*, s.full_name as student_name, s.admission_no, c.name as class_name, sec.name as section_name
          FROM fees f
          JOIN students s ON f.student_id = s.id
          JOIN classes c ON s.class_id = c.id
          JOIN sections sec ON s.section_id = sec.id
          WHERE f.student_id = ?
          ORDER BY f.id ASC
        `,
        args: [targetStudentId]
      });

      const summaryRes = await db.execute({
        sql: `
          SELECT 
            COUNT(*) as total_records,
            SUM(amount) as total_amount,
            SUM(paid_amount) as total_paid,
            SUM(CASE WHEN status = 'Pending' THEN amount ELSE (amount - paid_amount) END) as total_pending
          FROM fees WHERE student_id = ?
        `,
        args: [targetStudentId]
      });

      return NextResponse.json({
        fees: res.rows,
        summary: summaryRes.rows[0]
      });
    }

    // 2. Load Institutional Fee Settings (Never Hardcoded)
    const settingsRes = await db.execute(`
      SELECT key, value FROM website_settings 
      WHERE key IN ('standard_monthly_fee', 'fee_currency')
    `);
    let standardMonthlyFee = 100;
    let feeCurrency = '₹';
    for (const row of settingsRes.rows) {
      if (row.key === 'standard_monthly_fee') standardMonthlyFee = Number(row.value) || 100;
      if (row.key === 'fee_currency') feeCurrency = String(row.value) || '₹';
    }

    // 3. Load Available Classes
    const classesRes = await db.execute('SELECT id, name, display_order, numeric_order FROM classes ORDER BY numeric_order ASC');
    const classes = classesRes.rows;

    // 4. Staff Permission Handling
    let allowedSectionIds: number[] = [];
    if (auth.user.role === 'STAFF') {
      const teacherId = auth.user.teacher_id;
      if (!teacherId) return NextResponse.json({ error: 'Faculty teacher profile not found' }, { status: 403 });

      const permRes = await db.execute({
        sql: 'SELECT section_id, can_manage_fees FROM staff_permissions WHERE teacher_id = ?',
        args: [teacherId]
      });
      allowedSectionIds = permRes.rows
        .filter((r: any) => Number(r.can_manage_fees) === 1)
        .map((r: any) => Number(r.section_id));

      if (allowedSectionIds.length === 0) {
        return NextResponse.json({ 
          students: [], 
          metrics: {}, 
          error: 'Access denied: You do not have fee management permissions for any section.' 
        }, { status: 403 });
      }
    }

    // Determine target month (e.g. "September 2026")
    const targetMonth = (monthParam && monthParam !== 'All') ? monthParam.trim() : 'September 2026';

    // 5. Query Active Students + Left Join Fees for Selected Month (Excel-Style Register)
    let classId = classIdParam && classIdParam !== 'All' ? Number(classIdParam) : (classes[0] ? Number(classes[0].id) : 25);
    let gender = genderParam ? genderParam.trim() : 'Boys';

    // Role check if staff: ensure class matches assigned classes
    if (auth.user.role === 'STAFF') {
      const allowedClassRes = await db.execute({
        sql: 'SELECT DISTINCT class_id FROM sections WHERE id IN (' + allowedSectionIds.map(() => '?').join(',') + ')',
        args: allowedSectionIds
      });
      const allowedClassIds = allowedClassRes.rows.map((r: any) => Number(r.class_id));

      if (classIdParam && classIdParam !== 'All') {
        if (!allowedClassIds.includes(Number(classIdParam))) {
          return NextResponse.json({ 
            error: 'Access denied: You are only authorized to access fees for your assigned class.' 
          }, { status: 403 });
        }
        classId = Number(classIdParam);
      } else {
        classId = allowedClassIds[0] || classId;
      }

      if (genderParam && genderParam !== 'All') {
        const secCheck = await db.execute({
          sql: 'SELECT id FROM sections WHERE class_id = ? AND (name = ? OR gender = ?) LIMIT 1',
          args: [classId, gender, gender]
        });
        const secId = secCheck.rows[0]?.id ? Number(secCheck.rows[0].id) : null;
        if (!secId || !allowedSectionIds.includes(secId)) {
          return NextResponse.json({ 
            error: 'Access denied: You are only authorized to access fees for your assigned class section.' 
          }, { status: 403 });
        }
      }
    }

    let rosterSql: string;
    let rosterArgs: any[];

    if (gender === 'All') {
      rosterSql = `
        SELECT 
          s.id as student_id,
          s.roll_no,
          s.full_name as student_name,
          s.admission_no,
          s.gender,
          s.class_id,
          s.section_id,
          c.name as class_name,
          sec.name as section_name,
          p.primary_phone,
          f.id as fee_id,
          COALESCE(f.month, ?) as month,
          COALESCE(f.amount, ?) as amount,
          COALESCE(f.status, 'Pending') as status,
          COALESCE(f.paid_amount, 0) as paid_amount,
          (COALESCE(f.amount, ?) - COALESCE(f.paid_amount, 0)) as balance,
          f.payment_date,
          f.payment_mode,
          f.payment_reference,
          f.receipt_no,
          f.updated_at
        FROM students s
        JOIN classes c ON s.class_id = c.id
        JOIN sections sec ON s.section_id = sec.id
        LEFT JOIN parents p ON s.parent_id = p.id
        LEFT JOIN fees f ON f.student_id = s.id AND f.month = ?
        WHERE s.class_id = ? AND s.status = 'Active'
        ORDER BY s.gender ASC, s.roll_no ASC
      `;
      rosterArgs = [targetMonth, standardMonthlyFee, standardMonthlyFee, targetMonth, classId];
    } else {
      rosterSql = `
        SELECT 
          s.id as student_id,
          s.roll_no,
          s.full_name as student_name,
          s.admission_no,
          s.gender,
          s.class_id,
          s.section_id,
          c.name as class_name,
          sec.name as section_name,
          p.primary_phone,
          f.id as fee_id,
          COALESCE(f.month, ?) as month,
          COALESCE(f.amount, ?) as amount,
          COALESCE(f.status, 'Pending') as status,
          COALESCE(f.paid_amount, 0) as paid_amount,
          (COALESCE(f.amount, ?) - COALESCE(f.paid_amount, 0)) as balance,
          f.payment_date,
          f.payment_mode,
          f.payment_reference,
          f.receipt_no,
          f.updated_at
        FROM students s
        JOIN classes c ON s.class_id = c.id
        JOIN sections sec ON s.section_id = sec.id
        LEFT JOIN parents p ON s.parent_id = p.id
        LEFT JOIN fees f ON f.student_id = s.id AND f.month = ?
        WHERE s.class_id = ? AND sec.name = ? AND s.status = 'Active'
        ORDER BY s.roll_no ASC
      `;
      rosterArgs = [targetMonth, standardMonthlyFee, standardMonthlyFee, targetMonth, classId, gender];
    }

    const rosterRes = await db.execute({
      sql: rosterSql,
      args: rosterArgs
    });

    let students = rosterRes.rows.map((r: any) => ({
      student_id: r.student_id,
      roll_no: Number(r.roll_no),
      student_name: r.student_name,
      admission_no: r.admission_no,
      gender: r.gender,
      class_id: r.class_id,
      section_id: r.section_id,
      class_name: r.class_name,
      section_name: r.section_name,
      phone: r.primary_phone || '',
      fee_id: r.fee_id ? Number(r.fee_id) : null,
      month: r.month,
      amount: Number(r.amount),
      status: r.status, // 'Paid', 'Pending' (Unpaid), 'Partially Paid'
      paid_amount: Number(r.paid_amount),
      balance: Math.max(0, Number(r.amount) - Number(r.paid_amount)),
      payment_date: r.payment_date || null,
      payment_mode: r.payment_mode || 'Cash',
      payment_reference: r.payment_reference || '',
      receipt_no: r.receipt_no || null,
      updated_at: r.updated_at || null
    }));

    // Calculate Class + Wing Metrics (before in-memory search for accurate totals)
    let totalStudents = students.length;
    let paidCount = 0;
    let unpaidCount = 0;
    let partialCount = 0;
    let totalExpected = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;

    students.forEach((s) => {
      totalExpected += s.amount;
      totalCollected += s.paid_amount;
      totalOutstanding += s.balance;

      if (s.status === 'Paid') paidCount++;
      else if (s.status === 'Partially Paid') partialCount++;
      else unpaidCount++;
    });

    // Apply In-Memory Filters (Search and Status)
    if (searchParam) {
      const q = searchParam.toLowerCase().trim();
      students = students.filter(s => 
        s.student_name.toLowerCase().includes(q) ||
        s.admission_no.toLowerCase().includes(q) ||
        String(s.roll_no) === q
      );
    }

    if (statusParam && statusParam !== 'All') {
      if (statusParam === 'Paid') {
        students = students.filter(s => s.status === 'Paid');
      } else if (statusParam === 'Pending' || statusParam === 'Unpaid') {
        students = students.filter(s => s.status === 'Pending');
      } else if (statusParam === 'Partially Paid' || statusParam === 'Partial') {
        students = students.filter(s => s.status === 'Partially Paid');
      }
    }

    // Overall Madrassa month metrics
    const overallRes = await db.execute({
      sql: `
        SELECT 
          COUNT(*) as total_records,
          SUM(amount) as total_amount,
          SUM(paid_amount) as total_collected,
          SUM(CASE WHEN status = 'Pending' THEN amount ELSE (amount - paid_amount) END) as total_pending
        FROM fees WHERE month = ?
      `,
      args: [targetMonth]
    });

    const canEdit = ['SUPER_ADMIN', 'OFFICE_ADMIN', 'SADR'].includes(auth.user.role) || (auth.user.role === 'STAFF' && allowedSectionIds.length > 0);

    return NextResponse.json({
      students,
      selectedClassId: classId,
      selectedGender: gender,
      selectedMonth: targetMonth,
      metrics: {
        totalStudents,
        paidCount,
        unpaidCount,
        partialCount,
        totalExpected,
        totalCollected,
        totalOutstanding
      },
      overallMetrics: overallRes.rows[0] || {},
      settings: {
        standardMonthlyFee,
        feeCurrency
      },
      classes,
      canEdit
    });
  } catch (error: any) {
    console.error('Fees GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error fetching fees' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN', 'SADR', 'STAFF']);
  if ('status' in auth) return auth;

  try {
    const data = await req.json();
    const { 
      feeId, 
      studentId, 
      month, 
      status, 
      paidAmount, 
      amount, 
      paymentDate, 
      paymentMode, 
      paymentReference 
    } = data;

    if (!studentId && !feeId) {
      return NextResponse.json({ error: 'studentId or feeId is required' }, { status: 400 });
    }

    const db = getDb();

    // 1. Identify target student
    let targetStudentId = Number(studentId);
    let existingFee: any = null;

    if (feeId) {
      const fRes = await db.execute({ sql: 'SELECT * FROM fees WHERE id = ?', args: [Number(feeId)] });
      if (fRes.rows.length > 0) {
        existingFee = fRes.rows[0];
        targetStudentId = Number(existingFee.student_id);
      }
    } else if (studentId && month) {
      const fRes = await db.execute({ 
        sql: 'SELECT * FROM fees WHERE student_id = ? AND month = ?', 
        args: [Number(studentId), month.trim()] 
      });
      if (fRes.rows.length > 0) {
        existingFee = fRes.rows[0];
      }
    }

    // 2. Verify student exists and check staff permissions
    const studentRes = await db.execute({ 
      sql: 'SELECT id, section_id, full_name, admission_no FROM students WHERE id = ?', 
      args: [targetStudentId] 
    });
    if (studentRes.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    const student = studentRes.rows[0];

    if (auth.user.role === 'STAFF') {
      const permCheck = await db.execute({
        sql: 'SELECT 1 FROM staff_permissions WHERE teacher_id = ? AND section_id = ? AND can_manage_fees = 1',
        args: [auth.user.teacher_id, Number(student.section_id)]
      });
      if (permCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Access denied: You are not authorized to manage fees for this section' }, { status: 403 });
      }
    }

    // 3. Resolve Amount & Status
    const targetMonth = month ? month.trim() : (existingFee ? existingFee.month : 'September 2026');

    let feeAmount = Number(amount);
    if (!feeAmount || isNaN(feeAmount)) {
      if (existingFee && Number(existingFee.amount) > 0) {
        feeAmount = Number(existingFee.amount);
      } else {
        const sRes = await db.execute("SELECT value FROM website_settings WHERE key = 'standard_monthly_fee'");
        feeAmount = Number(sRes.rows[0]?.value || 100);
      }
    }

    const newStatus = status || 'Paid';
    let finalPaid = 0;
    if (newStatus === 'Paid') {
      finalPaid = paidAmount !== undefined ? Number(paidAmount) : feeAmount;
    } else if (newStatus === 'Partially Paid') {
      finalPaid = Number(paidAmount) || Math.floor(feeAmount / 2);
    } else {
      finalPaid = 0;
    }

    let finalDate = paymentDate !== undefined ? paymentDate : (existingFee?.payment_date || null);
    if (newStatus === 'Paid' && !finalDate) {
      finalDate = new Date().toISOString().split('T')[0];
    } else if (newStatus === 'Pending') {
      finalDate = null;
    }

    const safeMode = ['Cash', 'UPI', 'Bank Transfer', 'Online'].includes(paymentMode) ? paymentMode : 'Cash';
    const receiptNo = newStatus === 'Paid' 
      ? (existingFee?.receipt_no || `REC-${targetMonth.replace(/\s+/g, '')}-${String(targetStudentId).padStart(4, '0')}`) 
      : null;

    // 4. Atomic Upsert directly into Database
    await db.execute({
      sql: `
        INSERT INTO fees (
          student_id, academic_year_id, month, amount, status, paid_amount,
          payment_date, payment_mode, payment_reference, receipt_no, collected_by_user_id
        ) VALUES (?, 3, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(student_id, month) DO UPDATE SET
          amount = excluded.amount,
          status = excluded.status,
          paid_amount = excluded.paid_amount,
          payment_date = excluded.payment_date,
          payment_mode = excluded.payment_mode,
          payment_reference = excluded.payment_reference,
          receipt_no = COALESCE(fees.receipt_no, excluded.receipt_no),
          collected_by_user_id = excluded.collected_by_user_id,
          updated_at = CURRENT_TIMESTAMP
      `,
      args: [
        targetStudentId,
        targetMonth,
        feeAmount,
        newStatus,
        finalPaid,
        finalDate,
        newStatus === 'Paid' ? safeMode : null,
        paymentReference || null,
        receiptNo,
        auth.user.id
      ]
    });

    // 5. Fetch confirmed saved record from Database
    const savedRes = await db.execute({
      sql: 'SELECT * FROM fees WHERE student_id = ? AND month = ?',
      args: [targetStudentId, targetMonth]
    });
    const savedFee = savedRes.rows[0];

    // 6. Log Audit
    await logAudit({
      user: auth.user,
      action: 'FEE_RECORD_UPDATED',
      module: 'Fees',
      targetId: `Student:${targetStudentId}:Month:${targetMonth}`,
      previousValue: existingFee ? { status: existingFee.status, paidAmount: existingFee.paid_amount } : null,
      newValue: { status: newStatus, paidAmount: finalPaid, paymentDate: finalDate, amount: feeAmount }
    });

    return NextResponse.json({
      success: true,
      message: `Fee marked as ${newStatus} for ${student.full_name}`,
      fee: savedFee
    });
  } catch (error: any) {
    console.error('Fee update PUT error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update fee record' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN', 'SADR', 'STAFF']);
  if ('status' in auth) return auth;

  try {
    const body = await req.json();
    const { action } = body;
    const db = getDb();

    // ACTION 1: Bulk Fee Update (Mark All Paid / Mark All Unpaid)
    if (action === 'bulk_update') {
      const { classId, gender, month, bulkAction, paymentDate, paymentMode } = body;
      if (!classId || !gender || !month || !bulkAction) {
        return NextResponse.json({ error: 'classId, gender, month, and bulkAction are required' }, { status: 400 });
      }

      if (auth.user.role === 'STAFF') {
        if (gender.trim() === 'All') {
          return NextResponse.json({ error: 'Access denied: Staff can only perform bulk actions on their assigned wing' }, { status: 403 });
        }
        const secCheck = await db.execute({
          sql: 'SELECT id FROM sections WHERE class_id = ? AND name = ? LIMIT 1',
          args: [Number(classId), gender.trim()]
        });
        const secId = secCheck.rows[0]?.id;
        if (!secId) return NextResponse.json({ error: 'Section not found' }, { status: 404 });

        const permCheck = await db.execute({
          sql: 'SELECT 1 FROM staff_permissions WHERE teacher_id = ? AND section_id = ? AND can_manage_fees = 1',
          args: [auth.user.teacher_id, Number(secId)]
        });
        if (permCheck.rows.length === 0) {
          return NextResponse.json({ error: 'Access denied: You cannot manage fees for this section' }, { status: 403 });
        }
      }

      // Read standard fee
      const sRes = await db.execute("SELECT value FROM website_settings WHERE key = 'standard_monthly_fee'");
      const standardFee = Number(sRes.rows[0]?.value || 100);

      // Fetch all active students in class + wing
      const studentsRes = gender.trim() === 'All' 
        ? await db.execute({
            sql: `
              SELECT s.id, s.roll_no, s.full_name, s.admission_no 
              FROM students s
              WHERE s.class_id = ? AND s.status = 'Active'
              ORDER BY s.gender ASC, s.roll_no ASC
            `,
            args: [Number(classId)]
          })
        : await db.execute({
            sql: `
              SELECT s.id, s.roll_no, s.full_name, s.admission_no 
              FROM students s
              JOIN sections sec ON s.section_id = sec.id
              WHERE s.class_id = ? AND sec.name = ? AND s.status = 'Active'
              ORDER BY s.roll_no ASC
            `,
            args: [Number(classId), gender.trim()]
          });

      const students = studentsRes.rows;
      if (students.length === 0) {
        return NextResponse.json({ error: 'No active students found in the selected Class and Wing' }, { status: 404 });
      }

      let updatedCount = 0;
      const today = paymentDate || new Date().toISOString().split('T')[0];
      const mode = paymentMode || 'Cash';

      for (const st of students) {
        const sId = Number(st.id);

        if (bulkAction === 'mark_all_paid') {
          const receiptNo = `REC-${month.replace(/\s+/g, '')}-${String(sId).padStart(4, '0')}`;
          await db.execute({
            sql: `
              INSERT INTO fees (
                student_id, academic_year_id, month, amount, status, paid_amount,
                payment_date, payment_mode, receipt_no, collected_by_user_id
              ) VALUES (?, 3, ?, ?, 'Paid', ?, ?, ?, ?, ?)
              ON CONFLICT(student_id, month) DO UPDATE SET
                status = 'Paid',
                paid_amount = excluded.amount,
                payment_date = excluded.payment_date,
                payment_mode = excluded.payment_mode,
                receipt_no = COALESCE(fees.receipt_no, excluded.receipt_no),
                collected_by_user_id = excluded.collected_by_user_id,
                updated_at = CURRENT_TIMESTAMP
            `,
            args: [sId, month.trim(), standardFee, standardFee, today, mode, receiptNo, auth.user.id]
          });
          updatedCount++;
        } else if (bulkAction === 'mark_all_unpaid') {
          await db.execute({
            sql: `
              INSERT INTO fees (
                student_id, academic_year_id, month, amount, status, paid_amount,
                payment_date, payment_mode, collected_by_user_id
              ) VALUES (?, 3, ?, ?, 'Pending', 0, NULL, NULL, ?)
              ON CONFLICT(student_id, month) DO UPDATE SET
                status = 'Pending',
                paid_amount = 0,
                payment_date = NULL,
                payment_mode = NULL,
                collected_by_user_id = excluded.collected_by_user_id,
                updated_at = CURRENT_TIMESTAMP
            `,
            args: [sId, month.trim(), standardFee, auth.user.id]
          });
          updatedCount++;
        }
      }

      await logAudit({
        user: auth.user,
        action: 'BULK_FEE_ACTION',
        module: 'Fees',
        targetId: `Class:${classId}:Wing:${gender}:Month:${month}`,
        newValue: { bulkAction, updatedCount, month }
      });

      return NextResponse.json({
        success: true,
        message: `Successfully marked ${updatedCount} students as ${bulkAction === 'mark_all_paid' ? 'PAID' : 'UNPAID'} for ${month}!`,
        updatedCount
      });
    }

    // ACTION 2: Update Institutional Fee Settings (Standard Monthly Fee & Currency)
    if (action === 'update_settings') {
      if (!['SUPER_ADMIN', 'OFFICE_ADMIN', 'SADR'].includes(auth.user.role)) {
        return NextResponse.json({ error: 'Access denied: Only Office Admin or Sadr can change fee settings' }, { status: 403 });
      }

      const { standardMonthlyFee, feeCurrency } = body;
      if (standardMonthlyFee !== undefined) {
        const val = Number(standardMonthlyFee);
        if (isNaN(val) || val < 0) {
          return NextResponse.json({ error: 'Standard monthly fee must be a valid positive number' }, { status: 400 });
        }
        await db.execute({
          sql: `INSERT INTO website_settings (key, value, updated_at) VALUES ('standard_monthly_fee', ?, CURRENT_TIMESTAMP)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
          args: [String(val)]
        });
      }

      if (feeCurrency !== undefined && feeCurrency.trim()) {
        await db.execute({
          sql: `INSERT INTO website_settings (key, value, updated_at) VALUES ('fee_currency', ?, CURRENT_TIMESTAMP)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
          args: [feeCurrency.trim()]
        });
      }

      await logAudit({
        user: auth.user,
        action: 'FEE_SETTINGS_UPDATED',
        module: 'Fees',
        targetId: 'website_settings',
        newValue: { standardMonthlyFee, feeCurrency }
      });

      return NextResponse.json({
        success: true,
        message: 'Institutional Fee Settings updated successfully!'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Fees POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error processing fee request' }, { status: 500 });
  }
}
