import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

function calculateGrade(marks: number, max: number = 100): string {
  const pct = max > 0 ? (marks / max) * 100 : 0;
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

    // Student / Parent View-Only
    if (auth.user.role === 'STUDENT' || (studentId && auth.user.role !== 'STAFF')) {
      const targetId = auth.user.role === 'STUDENT' ? auth.user.student_id : Number(studentId);
      
      const sInfoRes = await db.execute({
        sql: `
          SELECT s.id, s.full_name, s.admission_no, s.roll_no, s.gender,
                 c.name as class_name, sec.name as section_name
          FROM students s
          JOIN classes c ON s.class_id = c.id
          JOIN sections sec ON s.section_id = sec.id
          WHERE s.id = ?
        `,
        args: [targetId]
      });
      const studentInfo = sInfoRes.rows[0] || {};

      let sqlQuery = `
        SELECT m.*, sub.name as subject_name, sub.code as subject_code,
               e.name as exam_name, e.exam_type,
               COALESCE(es.max_marks, sub.max_marks, 100) as max_marks,
               COALESCE(es.pass_marks, sub.pass_marks, 40) as pass_marks
        FROM marks m
        JOIN subjects sub ON m.subject_id = sub.id
        JOIN exams e ON m.exam_id = e.id
        LEFT JOIN exam_subjects es ON es.exam_id = m.exam_id AND es.subject_id = m.subject_id
        WHERE m.student_id = ?
      `;
      const args: any[] = [targetId];

      if (examId) {
        sqlQuery += ' AND m.exam_id = ?';
        args.push(Number(examId));
      }

      sqlQuery += ' ORDER BY e.start_date DESC, sub.name ASC';

      const res = await db.execute({ sql: sqlQuery, args });

      const marksList = res.rows.map((m: any) => {
        const maxM = Number(m.max_marks) || 100;
        const obtM = Number(m.marks_obtained) || 0;
        const pct = maxM > 0 ? ((obtM / maxM) * 100).toFixed(1) : '0';
        return {
          ...m,
          max_marks: maxM,
          marks_obtained: obtM,
          percentage: pct
        };
      });

      const totalObtained = marksList.reduce((acc: number, m: any) => acc + m.marks_obtained, 0);
      const totalMax = marksList.reduce((acc: number, m: any) => acc + m.max_marks, 0);
      const overallPercentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : '0';
      const allPassed = marksList.length > 0 && marksList.every((m: any) => m.is_pass === 1);

      return NextResponse.json({
        student: studentInfo,
        marks: marksList,
        totalObtained,
        totalMax,
        overallPercentage,
        isAllPassed: allPassed
      });
    }

    // Teacher authorization: verify section permission
    let targetSectionId = sectionId;
    if (auth.user.role === 'STAFF') {
      const teacherId = auth.user.teacher_id;
      const permRes = await db.execute({
        sql: 'SELECT section_id FROM staff_permissions WHERE teacher_id = ? AND can_manage_marks = 1',
        args: [teacherId]
      });
      const allowedSectionIds = permRes.rows.map((r: any) => Number(r.section_id));

      if (allowedSectionIds.length === 0) {
        return NextResponse.json({ 
          error: 'Access denied: You are not authorized to manage marks for any section' 
        }, { status: 403 });
      }

      if (!targetSectionId) {
        targetSectionId = String(allowedSectionIds[0]);
      } else if (!allowedSectionIds.includes(Number(targetSectionId))) {
        return NextResponse.json({ 
          error: 'Access denied: You are not authorized to manage marks for this class section' 
        }, { status: 403 });
      }
    }

    if (!examId || !targetSectionId || !subjectId) {
      return NextResponse.json({ error: 'examId, sectionId, and subjectId are required for marks sheet' }, { status: 400 });
    }

    const subRes = await db.execute({
      sql: 'SELECT id, name, code, class_id, max_marks, pass_marks FROM subjects WHERE id = ?',
      args: [Number(subjectId)]
    });
    const subMeta: any = subRes.rows[0] || {};

    const examSubjectRes = await db.execute({
      sql: 'SELECT max_marks, pass_marks FROM exam_subjects WHERE exam_id = ? AND subject_id = ?',
      args: [Number(examId), Number(subjectId)]
    });
    const examSubjectRow: any = examSubjectRes.rows[0];
    const maxMarks = examSubjectRow?.max_marks || subMeta.max_marks || 100;
    const passMarks = examSubjectRow?.pass_marks || subMeta.pass_marks || 40;

    const res = await db.execute({
      sql: `
        SELECT 
          s.id as student_id, s.admission_no, s.roll_no, s.full_name, s.gender, s.photo_url,
          m.id as mark_id, m.marks_obtained, m.grade, m.is_pass, m.remarks, m.status as mark_status,
          ? as max_marks, ? as pass_marks
        FROM students s
        LEFT JOIN marks m ON m.student_id = s.id AND m.exam_id = ? AND m.subject_id = ?
        WHERE s.section_id = ? AND COALESCE(s.status, 'Active') = 'Active'
        ORDER BY s.roll_no ASC
      `,
      args: [maxMarks, passMarks, Number(examId), Number(subjectId), Number(targetSectionId)]
    });

    return NextResponse.json({
      examId: Number(examId),
      sectionId: Number(targetSectionId),
      subjectId: Number(subjectId),
      subjectName: subMeta.name,
      maxMarks,
      passMarks,
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

    if (!examId || !subjectId || !sectionId || !Array.isArray(records)) {
      return NextResponse.json({ error: 'examId, subjectId, sectionId, and records are required' }, { status: 400 });
    }

    const db = getDb();
    const markStatus = status || 'Approved';

    // Teacher authorization: verify section permission
    if (auth.user.role === 'STAFF') {
      const teacherId = auth.user.teacher_id;
      const permCheck = await db.execute({
        sql: 'SELECT 1 FROM staff_permissions WHERE teacher_id = ? AND section_id = ? AND can_manage_marks = 1',
        args: [teacherId, Number(sectionId)]
      });
      if (permCheck.rows.length === 0) {
        return NextResponse.json({ 
          error: 'Access denied: You are not authorized to edit marks for this class section' 
        }, { status: 403 });
      }
    }

    const subRes = await db.execute({
      sql: 'SELECT max_marks, pass_marks, name FROM subjects WHERE id = ?',
      args: [Number(subjectId)]
    });
    const subMeta: any = subRes.rows[0] || {};
    const configuredMaxMarks = Number(subMeta.max_marks) || 100;
    const configuredPassMarks = Number(subMeta.pass_marks) || 40;

    for (const r of records) {
      if (r.student_id === undefined || r.marks_obtained === undefined || r.marks_obtained === '') continue;
      const mVal = Number(r.marks_obtained);
      const rowMax = Number(r.max_marks) || configuredMaxMarks;

      if (isNaN(mVal) || mVal < 0) {
        return NextResponse.json({
          error: `Invalid mark ${r.marks_obtained}. Mark cannot be less than 0.`
        }, { status: 400 });
      }

      if (mVal > rowMax) {
        return NextResponse.json({
          error: `Invalid mark ${mVal}. Mark cannot exceed the subject Total Mark of ${rowMax}.`
        }, { status: 400 });
      }
    }

    for (const r of records) {
      if (r.student_id === undefined || r.marks_obtained === undefined || r.marks_obtained === '') continue;

      const marksVal = Number(r.marks_obtained);
      const rowMax = Number(r.max_marks) || configuredMaxMarks;
      const rowPass = Number(r.pass_marks) || configuredPassMarks;
      const grade = r.grade || calculateGrade(marksVal, rowMax);
      const isPass = marksVal >= rowPass ? 1 : 0;

      await db.execute({
        sql: `
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
        `,
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
      targetId: `Exam:${examId}:Sub:${subjectId}:Sec:${sectionId}`,
      newValue: { count: records.length, status: markStatus }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Marks for ${records.length} students recorded successfully (Total Mark: ${configuredMaxMarks})!` 
    });
  } catch (error: any) {
    console.error('Marks save error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save marks' }, { status: 500 });
  }
}
