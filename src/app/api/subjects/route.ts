import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const status = searchParams.get('status'); // 'active' | 'all'
    const search = searchParams.get('search');

    const db = getDb();
    let query = `
      SELECT sub.*, c.name as class_name, c.numeric_order
      FROM subjects sub
      JOIN classes c ON sub.class_id = c.id
      WHERE 1=1
    `;
    const args: any[] = [];

    if (classId) {
      query += ' AND sub.class_id = ?';
      args.push(Number(classId));
    }

    if (status !== 'all') {
      query += ' AND COALESCE(sub.is_active, 1) = 1';
    }

    if (search) {
      query += ' AND (sub.name LIKE ? OR sub.code LIKE ?)';
      args.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY c.numeric_order ASC, sub.name ASC';

    const res = await db.execute({ sql: query, args });
    return NextResponse.json({ subjects: res.rows });
  } catch (error: any) {
    console.error('Subjects GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch subjects' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const data = await req.json();
    const { name, code, classId, maxMarks, passMarks, isActive } = data;

    if (!name || !classId) {
      return NextResponse.json({ error: 'Subject Name and Academic Class are required' }, { status: 400 });
    }

    const db = getDb();
    const totalMarkNum = Number(maxMarks) || 100;
    const passMarkNum = passMarks !== undefined && passMarks !== '' ? Number(passMarks) : Math.round(totalMarkNum * 0.4);
    const activeInt = isActive !== undefined ? (isActive ? 1 : 0) : 1;

    const res = await db.execute({
      sql: `
        INSERT INTO subjects (name, code, class_id, max_marks, pass_marks, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [name.trim(), code ? code.trim().toUpperCase() : null, Number(classId), totalMarkNum, passMarkNum, activeInt]
    });

    const newSubjectId = Number(res.lastInsertRowid);

    // Automatically link to existing exams in exam_subjects
    const exams = await db.execute('SELECT id FROM exams');
    for (const ex of exams.rows) {
      await db.execute({
        sql: `
          INSERT INTO exam_subjects (exam_id, subject_id, class_id, max_marks, pass_marks)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(exam_id, subject_id, class_id) DO NOTHING
        `,
        args: [ex.id, newSubjectId, Number(classId), totalMarkNum, passMarkNum]
      });
    }

    await logAudit({
      user: auth.user,
      action: 'SUBJECT_CREATED',
      module: 'Academics',
      targetId: String(newSubjectId),
      newValue: { name, code, classId, maxMarks: totalMarkNum, passMarks: passMarkNum }
    });

    return NextResponse.json({
      success: true,
      message: `Subject '${name}' created successfully with Total Mark: ${totalMarkNum}!`,
      subject: { id: newSubjectId, name, code, class_id: classId, max_marks: totalMarkNum, pass_marks: passMarkNum, is_active: activeInt }
    });
  } catch (error: any) {
    console.error('Subject creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create subject' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const data = await req.json();
    const { id, name, code, classId, maxMarks, passMarks, isActive } = data;

    if (!id || !name || !classId) {
      return NextResponse.json({ error: 'Subject ID, Name, and Class are required' }, { status: 400 });
    }

    const db = getDb();
    const totalMarkNum = Number(maxMarks) || 100;
    const passMarkNum = passMarks !== undefined && passMarks !== '' ? Number(passMarks) : Math.round(totalMarkNum * 0.4);
    const activeInt = isActive !== undefined ? (isActive ? 1 : 0) : 1;

    await db.execute({
      sql: `
        UPDATE subjects 
        SET name = ?, code = ?, class_id = ?, max_marks = ?, pass_marks = ?, is_active = ?
        WHERE id = ?
      `,
      args: [name.trim(), code ? code.trim().toUpperCase() : null, Number(classId), totalMarkNum, passMarkNum, activeInt, Number(id)]
    });

    // Also update max_marks and pass_marks in exam_subjects
    await db.execute({
      sql: 'UPDATE exam_subjects SET max_marks = ?, pass_marks = ? WHERE subject_id = ?',
      args: [totalMarkNum, passMarkNum, Number(id)]
    });

    await logAudit({
      user: auth.user,
      action: 'SUBJECT_UPDATED',
      module: 'Academics',
      targetId: String(id),
      newValue: { name, code, classId, maxMarks: totalMarkNum, passMarks: passMarkNum, isActive: activeInt }
    });

    return NextResponse.json({
      success: true,
      message: `Subject '${name}' updated successfully!`
    });
  } catch (error: any) {
    console.error('Subject update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update subject' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 });

    const db = getDb();

    // Soft deactivation to protect historical marks
    await db.execute({
      sql: 'UPDATE subjects SET is_active = 0 WHERE id = ?',
      args: [Number(id)]
    });

    await logAudit({
      user: auth.user,
      action: 'SUBJECT_DEACTIVATED',
      module: 'Academics',
      targetId: String(id),
      newValue: { is_active: 0 }
    });

    return NextResponse.json({
      success: true,
      message: 'Subject deactivated. Historical marks preserved.'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to deactivate subject' }, { status: 500 });
  }
}
