import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const res = await db.execute(`
      SELECT e.*, 
             (SELECT COUNT(DISTINCT subject_id) FROM exam_subjects WHERE exam_id = e.id) as subjects_count,
             (SELECT COUNT(*) FROM marks WHERE exam_id = e.id) as marks_entered_count
      FROM exams e
      ORDER BY e.start_date DESC
    `);
    return NextResponse.json({ exams: res.rows });
  } catch (error: any) {
    console.error('Exams GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch exams' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const data = await req.json();
    const { name, examType, academicYearId, startDate, endDate, status } = data;

    if (!name) {
      return NextResponse.json({ error: 'Exam Name is required' }, { status: 400 });
    }

    const db = getDb();
    const type = examType || 'Terminal';
    const yearId = academicYearId ? Number(academicYearId) : 3;

    const res = await db.execute({
      sql: `
        INSERT INTO exams (academic_year_id, name, exam_type, start_date, end_date, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [yearId, name.trim(), type, startDate || null, endDate || null, status || 'Published']
    });

    const newExamId = Number(res.lastInsertRowid);

    // Link all active subjects into exam_subjects for this new exam
    const subjects = await db.execute('SELECT id, class_id, max_marks, pass_marks FROM subjects WHERE is_active = 1');
    for (const sub of subjects.rows) {
      await db.execute({
        sql: `
          INSERT INTO exam_subjects (exam_id, subject_id, class_id, max_marks, pass_marks)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(exam_id, subject_id, class_id) DO NOTHING
        `,
        args: [newExamId, sub.id, sub.class_id, sub.max_marks || 100, sub.pass_marks || 40]
      });
    }

    await logAudit({
      user: auth.user,
      action: 'EXAM_CREATED',
      module: 'Examinations',
      targetId: String(newExamId),
      newValue: { name, examType: type, startDate, endDate }
    });

    return NextResponse.json({
      success: true,
      message: `Exam '${name}' created successfully!`,
      exam: { id: newExamId, name, exam_type: type, start_date: startDate, end_date: endDate }
    });
  } catch (error: any) {
    console.error('Exam creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create exam' }, { status: 500 });
  }
}
