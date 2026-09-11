
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'students';
    const classId = searchParams.get('classId');
    const gender = searchParams.get('gender');
    const format = searchParams.get('format'); // 'csv' or 'json'

    const db = getDb();

    if (type === 'students') {
      let query = `
        SELECT s.admission_no, s.roll_no, s.full_name, s.gender, s.dob,
               c.name as class_name, sec.name as section_name,
               p.father_name, p.primary_phone, p.address, s.status
        FROM students s
        JOIN classes c ON s.class_id = c.id
        JOIN sections sec ON s.section_id = sec.id
        LEFT JOIN parents p ON s.parent_id = p.id
        WHERE 1=1
      `;
      const args: any[] = [];
      if (classId && classId !== 'All') { query += ' AND s.class_id = ?'; args.push(Number(classId)); }
      if (gender && gender !== 'All') { query += ' AND s.gender = ?'; args.push(gender); }
      query += ' ORDER BY c.numeric_order ASC, sec.name ASC, s.roll_no ASC';

      const res = await db.execute({ sql: query, args });

      if (format === 'csv') {
        const headers = ['Admission No', 'Roll No', 'Full Name', 'Gender', 'Class', 'Section', 'Father Name', 'Phone', 'Address', 'Status'];
        const csvRows = [headers.join(',')];
        for (const r of res.rows) {
          csvRows.push([
            `"${r.admission_no || ''}"`,
            r.roll_no,
            `"${r.full_name || ''}"`,
            r.gender,
            `"${r.class_name || ''}"`,
            r.section_name,
            `"${r.father_name || ''}"`,
            `"${r.primary_phone || ''}"`,
            `"${(String(r.address || '')).replace(/"/g, '""')}"`,
            r.status
          ].join(','));
        }
        return new NextResponse(csvRows.join('\n'), {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="students_report_${Date.now()}.csv"`
          }
        });
      }

      return NextResponse.json({ type: 'students', rows: res.rows });
    }

    if (type === 'fees') {
      const res = await db.execute(`
        SELECT f.month, f.amount, f.status, f.paid_amount, f.payment_date, f.payment_mode, f.receipt_no,
               s.admission_no, s.full_name, s.roll_no, c.name as class_name, sec.name as section_name, p.primary_phone
        FROM fees f
        JOIN students s ON f.student_id = s.id
        JOIN classes c ON s.class_id = c.id
        JOIN sections sec ON s.section_id = sec.id
        LEFT JOIN parents p ON s.parent_id = p.id
        ORDER BY c.numeric_order ASC, sec.name ASC, s.roll_no ASC, f.id ASC
      `);

      if (format === 'csv') {
        const headers = ['Admission No', 'Student Name', 'Class', 'Section', 'Month', 'Amount', 'Status', 'Paid Amount', 'Payment Date', 'Payment Mode', 'Receipt No', 'Phone'];
        const csvRows = [headers.join(',')];
        for (const r of res.rows) {
          csvRows.push([
            `"${r.admission_no || ''}"`,
            `"${r.full_name || ''}"`,
            `"${r.class_name || ''}"`,
            r.section_name,
            `"${r.month || ''}"`,
            r.amount,
            r.status,
            r.paid_amount,
            r.payment_date || '',
            r.payment_mode || '',
            `"${r.receipt_no || ''}"`,
            `"${r.primary_phone || ''}"`
          ].join(','));
        }
        return new NextResponse(csvRows.join('\n'), {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="fee_report_${Date.now()}.csv"`
          }
        });
      }

      return NextResponse.json({ type: 'fees', rows: res.rows });
    }

    if (type === 'attendance') {
      const res = await db.execute(`
        SELECT s.admission_no, s.full_name, c.name as class_name, sec.name as section_name,
               COUNT(a.id) as total_recorded_days,
               SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_days,
               SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absent_days,
               SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) as late_days
        FROM students s
        JOIN classes c ON s.class_id = c.id
        JOIN sections sec ON s.section_id = sec.id
        LEFT JOIN attendance a ON a.student_id = s.id
        GROUP BY s.id
        ORDER BY c.numeric_order ASC, sec.name ASC, s.roll_no ASC
      `);

      if (format === 'csv') {
        const headers = ['Admission No', 'Student Name', 'Class', 'Section', 'Total Days', 'Present Days', 'Absent Days', 'Late Days', 'Attendance %'];
        const csvRows = [headers.join(',')];
        for (const r of res.rows) {
          const tot = Number(r.total_recorded_days || 0);
          const pres = Number(r.present_days || 0);
          const pct = tot > 0 ? ((pres / tot) * 100).toFixed(1) + '%' : 'N/A';
          csvRows.push([
            `"${r.admission_no || ''}"`,
            `"${r.full_name || ''}"`,
            `"${r.class_name || ''}"`,
            r.section_name,
            tot,
            pres,
            Number(r.absent_days || 0),
            Number(r.late_days || 0),
            pct
          ].join(','));
        }
        return new NextResponse(csvRows.join('\n'), {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="attendance_report_${Date.now()}.csv"`
          }
        });
      }

      return NextResponse.json({ type: 'attendance', rows: res.rows });
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
