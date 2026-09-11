import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    let classId = searchParams.get('classId');
    let sectionId = searchParams.get('sectionId');
    const month = searchParams.get('month');
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';

    const db = getDb();

    // Student / Parent direct view
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
            SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END) as total_pending
          FROM fees WHERE student_id = ?
        `,
        args: [targetStudentId]
      });

      return NextResponse.json({
        fees: res.rows,
        summary: summaryRes.rows[0]
      });
    }

    // Teacher authorization: filter to authorized sections only
    let allowedSectionIds: number[] = [];
    if (auth.user.role === 'STAFF') {
      const teacherId = auth.user.teacher_id;
      if (!teacherId) return NextResponse.json({ fees: [], metrics: {} });

      const permRes = await db.execute({
        sql: 'SELECT section_id FROM staff_permissions WHERE teacher_id = ? AND can_manage_fees = 1',
        args: [teacherId]
      });
      allowedSectionIds = permRes.rows.map((r: any) => Number(r.section_id));

      if (allowedSectionIds.length === 0) {
        return NextResponse.json({ fees: [], metrics: {}, error: 'Access denied: No fees permissions assigned' }, { status: 403 });
      }

      if (sectionId && sectionId !== 'All' && !allowedSectionIds.includes(Number(sectionId))) {
        return NextResponse.json({ error: 'Access denied: You are not authorized to view fees for this class section' }, { status: 403 });
      }
    }

    let query = `
      SELECT f.*, s.full_name as student_name, s.admission_no, s.roll_no, s.gender,
             c.name as class_name, sec.name as section_name, p.primary_phone
      FROM fees f
      JOIN students s ON f.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN parents p ON s.parent_id = p.id
      WHERE 1=1
    `;
    const args: any[] = [];

    if (auth.user.role === 'STAFF') {
      if (sectionId && sectionId !== 'All') {
        query += ' AND s.section_id = ?';
        args.push(Number(sectionId));
      } else {
        query += ` AND s.section_id IN (${allowedSectionIds.join(',')})`;
      }
    } else {
      if (classId && classId !== 'All') {
        query += ' AND s.class_id = ?';
        args.push(Number(classId));
      }
      if (sectionId && sectionId !== 'All') {
        query += ' AND s.section_id = ?';
        args.push(Number(sectionId));
      }
    }

    if (month && month !== 'All') {
      query += ' AND f.month = ?';
      args.push(month);
    }
    if (status && status !== 'All') {
      query += ' AND f.status = ?';
      args.push(status);
    }
    if (search) {
      query += ' AND (s.full_name LIKE ? OR s.admission_no LIKE ? OR p.primary_phone LIKE ?)';
      args.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY c.numeric_order ASC, sec.name ASC, s.roll_no ASC LIMIT 300';

    const feesRes = await db.execute({ sql: query, args });

    const metricsRes = await db.execute(`
      SELECT 
        COUNT(*) as total_records,
        SUM(amount) as total_amount,
        SUM(paid_amount) as total_collected,
        SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END) as total_pending
      FROM fees
    `);

    return NextResponse.json({
      fees: feesRes.rows,
      metrics: metricsRes.rows[0],
      canConfigureStandardAmount: ['SUPER_ADMIN', 'OFFICE_ADMIN'].includes(auth.user.role)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN', 'STAFF']);
  if ('status' in auth) return auth;

  try {
    const { feeId, status, paymentMode, paymentReference, paymentDate, paidAmount, amount } = await req.json();

    if (!feeId) return NextResponse.json({ error: 'feeId is required' }, { status: 400 });

    const db = getDb();
    const oldRes = await db.execute({ 
      sql: 'SELECT f.*, s.section_id FROM fees f JOIN students s ON f.student_id = s.id WHERE f.id = ?', 
      args: [Number(feeId)] 
    });
    if (oldRes.rows.length === 0) return NextResponse.json({ error: 'Fee record not found' }, { status: 404 });
    const old = oldRes.rows[0];

    // Teacher authorization: ensure authorized to manage fees for student's section
    if (auth.user.role === 'STAFF') {
      const teacherId = auth.user.teacher_id;
      const permCheck = await db.execute({
        sql: 'SELECT 1 FROM staff_permissions WHERE teacher_id = ? AND section_id = ? AND can_manage_fees = 1',
        args: [teacherId, Number(old.section_id)]
      });
      if (permCheck.rows.length === 0) {
        return NextResponse.json({ 
          error: 'Access denied: You are not authorized to manage fees for this student/section' 
        }, { status: 403 });
      }

      // Teachers CANNOT change standard monthly fee amount
      if (amount !== undefined && Number(amount) !== Number(old.amount)) {
        return NextResponse.json({ 
          error: 'Access denied: Only Office Admin can change standard monthly fee amounts' 
        }, { status: 403 });
      }
    }

    const newStatus = status || 'Paid';
    const feeAmount = ['SUPER_ADMIN', 'OFFICE_ADMIN'].includes(auth.user.role) && amount !== undefined 
      ? Number(amount) 
      : Number(old.amount || 100);
    const actualPaid = newStatus === 'Paid' ? (paidAmount !== undefined ? Number(paidAmount) : feeAmount) : 0;
    const receiptNo = newStatus === 'Paid' ? (old.receipt_no || `REC-2026-${String(feeId).padStart(5, '0')}`) : null;
    const pDate = newStatus === 'Paid' ? (paymentDate || new Date().toISOString().split('T')[0]) : null;
    const safeMode = ['Cash', 'UPI', 'Bank Transfer', 'Online'].includes(paymentMode) ? paymentMode : 'Cash';

    await db.execute({
      sql: `
        UPDATE fees 
        SET amount = ?,
            status = ?,
            paid_amount = ?,
            payment_mode = ?,
            payment_reference = ?,
            payment_date = ?,
            receipt_no = ?,
            collected_by_user_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [
        feeAmount,
        newStatus,
        actualPaid,
        newStatus === 'Paid' ? safeMode : null,
        newStatus === 'Paid' ? (paymentReference || null) : null,
        pDate,
        receiptNo,
        auth.user.id,
        Number(feeId)
      ]
    });

    await logAudit({
      user: auth.user,
      action: 'FEE_PAYMENT_RECORDED',
      module: 'Fees',
      targetId: String(feeId),
      previousValue: { status: old.status, paidAmount: old.paid_amount },
      newValue: { status: newStatus, paidAmount: actualPaid, receiptNo, paymentMode: safeMode, collectedBy: auth.user.full_name }
    });

    return NextResponse.json({
      success: true,
      message: `Fee marked as ${newStatus}`,
      receiptNo,
      fee: {
        id: feeId,
        status: newStatus,
        paid_amount: actualPaid,
        receipt_no: receiptNo,
        payment_mode: safeMode,
        payment_date: pDate
      }
    });
  } catch (error: any) {
    console.error('Fee update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update fee record' }, { status: 500 });
  }
}
