const fs = require('fs');
const path = require('path');
function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

// 1. /api/attendance
ensureDir('src/app/api/attendance');
fs.writeFileSync('src/app/api/attendance/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const sectionId = searchParams.get('sectionId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const studentId = searchParams.get('studentId');
    const month = searchParams.get('month'); // e.g. '2026-08'

    const db = getDb();

    // If Student or Parent, only show own data
    if (auth.user.role === 'STUDENT') {
      const sId = auth.user.student_id;
      const res = await db.execute({
        sql: \`
          SELECT a.*, c.name as class_name, sec.name as section_name
          FROM attendance a
          JOIN sections sec ON a.section_id = sec.id
          JOIN classes c ON sec.class_id = c.id
          WHERE a.student_id = ? \${month ? "AND strftime('%Y-%m', a.date) = ?" : ''}
          ORDER BY a.date DESC
        \`,
        args: month ? [sId, month] : [sId]
      });
      return NextResponse.json({ attendance: res.rows });
    }

    if (studentId) {
      const res = await db.execute({
        sql: \`
          SELECT a.*, c.name as class_name, sec.name as section_name
          FROM attendance a
          JOIN sections sec ON a.section_id = sec.id
          JOIN classes c ON sec.class_id = c.id
          WHERE a.student_id = ?
          ORDER BY a.date DESC
        \`,
        args: [Number(studentId)]
      });
      return NextResponse.json({ attendance: res.rows });
    }

    if (!sectionId) {
      // Overall school attendance for date
      const overallRes = await db.execute({
        sql: \`
          SELECT 
            COUNT(*) as total_marked,
            SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_count,
            SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
            SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) as late_count
          FROM attendance a
          WHERE a.date = ?
        \`,
        args: [date]
      });

      const sectionSummaries = await db.execute({
        sql: \`
          SELECT 
            sec.id as section_id, sec.name as section_name, c.name as class_name,
            (SELECT COUNT(*) FROM students WHERE section_id = sec.id AND status = 'Active') as total_students,
            SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_count,
            SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
            SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) as late_count
          FROM sections sec
          JOIN classes c ON sec.class_id = c.id
          LEFT JOIN attendance a ON a.section_id = sec.id AND a.date = ?
          GROUP BY sec.id
          ORDER BY c.numeric_order ASC, sec.name ASC
        \`,
        args: [date]
      });

      return NextResponse.json({
        date,
        overall: overallRes.rows[0],
        sections: sectionSummaries.rows
      });
    }

    // Class Section Roster with Attendance for specific Date
    const sRes = await db.execute({
      sql: \`
        SELECT 
          s.id as student_id, s.admission_no, s.roll_no, s.full_name, s.gender, s.photo_url,
          a.id as attendance_id, COALESCE(a.status, 'Present') as status, a.remarks
        FROM students s
        LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ?
        WHERE s.section_id = ? AND s.status = 'Active'
        ORDER BY s.roll_no ASC
      \`,
      args: [date, Number(sectionId)]
    });

    return NextResponse.json({
      sectionId: Number(sectionId),
      date,
      students: sRes.rows
    });
  } catch (error: any) {
    console.error('Attendance GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN', 'STAFF']);
  if ('status' in auth) return auth;

  try {
    const { sectionId, date, records } = await req.json();

    if (!sectionId || !date || !Array.isArray(records)) {
      return NextResponse.json({ error: 'sectionId, date, and records array required' }, { status: 400 });
    }

    const db = getDb();

    // Teacher authorization: ensure assigned to this section or class teacher
    if (auth.user.role === 'STAFF' && auth.user.teacher_id) {
      const authCheck = await db.execute({
        sql: \`
          SELECT 1 FROM teacher_assignments WHERE teacher_id = ? AND section_id = ?
          UNION
          SELECT 1 FROM sections WHERE id = ? AND class_teacher_id = ?
        \`,
        args: [auth.user.teacher_id, Number(sectionId), Number(sectionId), auth.user.teacher_id]
      });
      if (authCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Unauthorized: You are not assigned to this class section' }, { status: 403 });
      }
    }

    for (const r of records) {
      if (!r.student_id || !r.status) continue;

      await db.execute({
        sql: \`
          INSERT INTO attendance (student_id, section_id, date, status, remarks, marked_by_user_id, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(student_id, date) DO UPDATE SET
            status = excluded.status,
            remarks = excluded.remarks,
            marked_by_user_id = excluded.marked_by_user_id,
            updated_at = CURRENT_TIMESTAMP
        \`,
        args: [
          Number(r.student_id),
          Number(sectionId),
          date,
          r.status,
          r.remarks || null,
          auth.user.id
        ]
      });
    }

    await logAudit({
      user: auth.user,
      action: 'ATTENDANCE_MARKED',
      module: 'Attendance',
      targetId: String(sectionId),
      newValue: { date, count: records.length }
    });

    return NextResponse.json({ success: true, message: 'Attendance recorded successfully!' });
  } catch (error: any) {
    console.error('Attendance POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save attendance' }, { status: 500 });
  }
}
`);

// 2. /api/exams
ensureDir('src/app/api/exams');
fs.writeFileSync('src/app/api/exams/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const examsRes = await db.execute(\`
      SELECT e.*, ay.name as academic_year_name,
             (SELECT COUNT(*) FROM marks WHERE exam_id = e.id) as marks_count
      FROM exams e
      LEFT JOIN academic_years ay ON e.academic_year_id = ay.id
      ORDER BY e.start_date DESC
    \`);

    const examSubjectsRes = await db.execute(\`
      SELECT es.*, sub.name as subject_name, sub.code as subject_code, c.name as class_name
      FROM exam_subjects es
      JOIN subjects sub ON es.subject_id = sub.id
      JOIN classes c ON es.class_id = c.id
    \`);

    return NextResponse.json({
      exams: examsRes.rows,
      examSubjects: examSubjectsRes.rows
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const { name, startDate, endDate, academicYearId, subjects } = await req.json();
    if (!name) return NextResponse.json({ error: 'Exam name is required' }, { status: 400 });

    const db = getDb();
    const ayId = academicYearId || 1;

    const res = await db.execute({
      sql: 'INSERT INTO exams (name, start_date, end_date, academic_year_id, status) VALUES (?, ?, ?, ?, ?)',
      args: [name.trim(), startDate || null, endDate || null, Number(ayId), 'Published']
    });
    const examId = Number(res.lastInsertRowid);

    // Setup exam subjects
    if (Array.isArray(subjects) && subjects.length > 0) {
      for (const s of subjects) {
        if (s.subjectId && s.classId) {
          await db.execute({
            sql: 'INSERT INTO exam_subjects (exam_id, subject_id, class_id, max_marks, pass_marks) VALUES (?, ?, ?, ?, ?)',
            args: [examId, Number(s.subjectId), Number(s.classId), Number(s.maxMarks || 100), Number(s.passMarks || 40)]
          });
        }
      }
    } else {
      // Auto-populate for all classes and subjects
      const allSubs = await db.execute('SELECT id, class_id FROM subjects');
      for (const sub of allSubs.rows) {
        await db.execute({
          sql: 'INSERT OR IGNORE INTO exam_subjects (exam_id, subject_id, class_id, max_marks, pass_marks) VALUES (?, ?, ?, 100, 40)',
          args: [examId, Number(sub.id), Number(sub.class_id)]
        });
      }
    }

    await logAudit({
      user: auth.user,
      action: 'EXAM_CREATED',
      module: 'Examinations',
      targetId: String(examId),
      newValue: { name, startDate, endDate }
    });

    return NextResponse.json({ success: true, message: 'Examination created successfully', examId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`);

// 3. /api/marks
ensureDir('src/app/api/marks');
fs.writeFileSync('src/app/api/marks/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

function calculateGrade(marks: number, max: number = 100): string {
  const pct = (marks / max) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C+';
  if (pct >= 40) return 'C';
  return 'F';
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get('examId');
    const sectionId = searchParams.get('sectionId');
    const subjectId = searchParams.get('subjectId');
    const studentId = searchParams.get('studentId');

    const db = getDb();

    // Student / Parent direct view
    if (auth.user.role === 'STUDENT' || studentId) {
      const targetId = auth.user.role === 'STUDENT' ? auth.user.student_id : Number(studentId);
      const res = await db.execute({
        sql: \`
          SELECT m.*, sub.name as subject_name, sub.code as subject_code,
                 e.name as exam_name, es.max_marks, es.pass_marks
          FROM marks m
          JOIN subjects sub ON m.subject_id = sub.id
          JOIN exams e ON m.exam_id = e.id
          LEFT JOIN exam_subjects es ON es.exam_id = m.exam_id AND es.subject_id = m.subject_id
          WHERE m.student_id = ? \${examId ? 'AND m.exam_id = ?' : ''}
          ORDER BY e.start_date DESC, sub.name ASC
        \`,
        args: examId ? [targetId, Number(examId)] : [targetId]
      });
      return NextResponse.json({ marks: res.rows });
    }

    if (!examId || !sectionId || !subjectId) {
      return NextResponse.json({ error: 'examId, sectionId, and subjectId are required for marks sheet' }, { status: 400 });
    }

    // Roster of students with their existing marks
    const res = await db.execute({
      sql: \`
        SELECT 
          s.id as student_id, s.admission_no, s.roll_no, s.full_name, s.gender, s.photo_url,
          m.id as mark_id, m.marks_obtained, m.grade, m.is_pass, m.remarks, m.status as mark_status,
          COALESCE(es.max_marks, 100) as max_marks, COALESCE(es.pass_marks, 40) as pass_marks
        FROM students s
        LEFT JOIN marks m ON m.student_id = s.id AND m.exam_id = ? AND m.subject_id = ?
        LEFT JOIN exam_subjects es ON es.exam_id = ? AND es.subject_id = ? AND es.class_id = s.class_id
        WHERE s.section_id = ? AND s.status = 'Active'
        ORDER BY s.roll_no ASC
      \`,
      args: [Number(examId), Number(subjectId), Number(examId), Number(subjectId), Number(sectionId)]
    });

    return NextResponse.json({
      examId: Number(examId),
      sectionId: Number(sectionId),
      subjectId: Number(subjectId),
      students: res.rows
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN', 'STAFF']);
  if ('status' in auth) return auth;

  try {
    const { examId, subjectId, sectionId, status, records } = await req.json();

    if (!examId || !subjectId || !Array.isArray(records)) {
      return NextResponse.json({ error: 'examId, subjectId, and records are required' }, { status: 400 });
    }

    const db = getDb();
    const markStatus = status || 'Approved'; // 'Draft', 'Submitted', 'Approved'

    for (const r of records) {
      if (r.student_id === undefined || r.marks_obtained === undefined || r.marks_obtained === '') continue;

      const marksVal = Number(r.marks_obtained);
      const grade = r.grade || calculateGrade(marksVal, Number(r.max_marks || 100));
      const passMarks = Number(r.pass_marks || 40);
      const isPass = marksVal >= passMarks ? 1 : 0;

      await db.execute({
        sql: \`
          INSERT INTO marks (exam_id, subject_id, student_id, marks_obtained, grade, is_pass, remarks, entered_by_user_id, status, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(exam_id, subject_id, student_id) DO UPDATE SET
            marks_obtained = excluded.marks_obtained,
            grade = excluded.grade,
            is_pass = excluded.is_pass,
            remarks = excluded.remarks,
            entered_by_user_id = excluded.entered_by_user_id,
            status = excluded.status,
            updated_at = CURRENT_TIMESTAMP
        \`,
        args: [
          Number(examId),
          Number(subjectId),
          Number(r.student_id),
          marksVal,
          grade,
          isPass,
          r.remarks || null,
          auth.user.id,
          markStatus
        ]
      });
    }

    await logAudit({
      user: auth.user,
      action: 'MARKS_SAVED',
      module: 'Examinations',
      targetId: \`Exam:\${examId}_Sub:\${subjectId}\`,
      newValue: { examId, subjectId, status: markStatus, count: records.length }
    });

    return NextResponse.json({ success: true, message: \`Marks saved successfully with status \${markStatus}!\` });
  } catch (error: any) {
    console.error('Marks save error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save marks' }, { status: 500 });
  }
}
`);

// 4. /api/fees (Rs. 100/mo)
ensureDir('src/app/api/fees');
fs.writeFileSync('src/app/api/fees/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');
    const month = searchParams.get('month');
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';

    const db = getDb();

    // Student / Parent direct view
    if (auth.user.role === 'STUDENT' || (studentId && auth.user.role === 'PARENT')) {
      const targetStudentId = auth.user.role === 'STUDENT' ? auth.user.student_id : Number(studentId);
      const res = await db.execute({
        sql: \`
          SELECT f.*, s.full_name as student_name, s.admission_no, c.name as class_name, sec.name as section_name
          FROM fees f
          JOIN students s ON f.student_id = s.id
          JOIN classes c ON s.class_id = c.id
          JOIN sections sec ON s.section_id = sec.id
          WHERE f.student_id = ?
          ORDER BY f.id ASC
        \`,
        args: [targetStudentId]
      });

      const summaryRes = await db.execute({
        sql: \`
          SELECT 
            COUNT(*) as total_records,
            SUM(amount) as total_amount,
            SUM(paid_amount) as total_paid,
            SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END) as total_pending
          FROM fees WHERE student_id = ?
        \`,
        args: [targetStudentId]
      });

      return NextResponse.json({
        fees: res.rows,
        summary: summaryRes.rows[0]
      });
    }

    // Office / Staff Admin Filter
    let query = \`
      SELECT f.*, s.full_name as student_name, s.admission_no, s.roll_no, s.gender,
             c.name as class_name, sec.name as section_name, p.primary_phone
      FROM fees f
      JOIN students s ON f.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN parents p ON s.parent_id = p.id
      WHERE 1=1
    \`;
    const args: any[] = [];

    if (month && month !== 'All') {
      query += ' AND f.month = ?';
      args.push(month);
    }
    if (status && status !== 'All') {
      query += ' AND f.status = ?';
      args.push(status);
    }
    if (classId && classId !== 'All') {
      query += ' AND s.class_id = ?';
      args.push(Number(classId));
    }
    if (sectionId && sectionId !== 'All') {
      query += ' AND s.section_id = ?';
      args.push(Number(sectionId));
    }
    if (search) {
      query += ' AND (s.full_name LIKE ? OR s.admission_no LIKE ? OR p.primary_phone LIKE ?)';
      args.push(\`%\${search}%\`, \`%\${search}%\`, \`%\${search}%\`);
    }

    query += ' ORDER BY c.numeric_order ASC, sec.name ASC, s.roll_no ASC LIMIT 300';

    const feesRes = await db.execute({ sql: query, args });

    // Collection totals
    const metricsRes = await db.execute(\`
      SELECT 
        COUNT(*) as total_records,
        SUM(amount) as total_amount,
        SUM(paid_amount) as total_collected,
        SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END) as total_pending
      FROM fees
    \`);

    return NextResponse.json({
      fees: feesRes.rows,
      metrics: metricsRes.rows[0]
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN', 'STAFF']);
  if ('status' in auth) return auth;

  try {
    const { feeId, status, paymentMode, paymentReference, paymentDate, paidAmount } = await req.json();

    if (!feeId) return NextResponse.json({ error: 'feeId is required' }, { status: 400 });

    const db = getDb();
    const oldRes = await db.execute({ sql: 'SELECT * FROM fees WHERE id = ?', args: [Number(feeId)] });
    if (oldRes.rows.length === 0) return NextResponse.json({ error: 'Fee record not found' }, { status: 404 });
    const old = oldRes.rows[0];

    const newStatus = status || 'Paid';
    const amount = Number(old.amount || 100);
    const actualPaid = newStatus === 'Paid' ? (paidAmount !== undefined ? Number(paidAmount) : amount) : 0;
    const receiptNo = newStatus === 'Paid' ? (old.receipt_no || \`REC-2026-\${String(feeId).padStart(5, '0')}\`) : null;
    const pDate = newStatus === 'Paid' ? (paymentDate || new Date().toISOString().split('T')[0]) : null;

    await db.execute({
      sql: \`
        UPDATE fees 
        SET status = ?,
            paid_amount = ?,
            payment_mode = ?,
            payment_reference = ?,
            payment_date = ?,
            receipt_no = ?,
            collected_by_user_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      \`,
      args: [
        newStatus,
        actualPaid,
        newStatus === 'Paid' ? (paymentMode || 'Cash') : null,
        newStatus === 'Paid' ? (paymentReference || null) : null,
        pDate,
        receiptNo,
        auth.user.id,
        Number(feeId)
      ]
    });

    await logAudit({
      user: auth.user,
      action: 'FEE_STATUS_UPDATED',
      module: 'Fees',
      targetId: String(feeId),
      previousValue: { status: old.status, paidAmount: old.paid_amount },
      newValue: { status: newStatus, paidAmount: actualPaid, receiptNo, paymentMode }
    });

    return NextResponse.json({
      success: true,
      message: \`Fee marked as \${newStatus}\`,
      receiptNo
    });
  } catch (error: any) {
    console.error('Fee update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update fee record' }, { status: 500 });
  }
}
`);

console.log('Attendance, exams, marks, and fees APIs generated!');
