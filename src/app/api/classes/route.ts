import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const classesRes = await db.execute('SELECT * FROM classes ORDER BY numeric_order ASC');
    const sectionsRes = await db.execute(`
      SELECT sec.*, c.name as class_name, t.full_name as teacher_name, t.staff_id,
             (SELECT COUNT(*) FROM students WHERE section_id = sec.id AND status = 'Active') as student_count
      FROM sections sec
      JOIN classes c ON sec.class_id = c.id
      LEFT JOIN teachers t ON sec.class_teacher_id = t.id
      ORDER BY c.numeric_order ASC, sec.name ASC
    `);

    const subjectsRes = await db.execute(`
      SELECT sub.*, c.name as class_name 
      FROM subjects sub
      JOIN classes c ON sub.class_id = c.id
      ORDER BY c.numeric_order ASC, sub.name ASC
    `);

    return NextResponse.json({
      classes: classesRes.rows,
      sections: sectionsRes.rows,
      subjects: subjectsRes.rows
    });
  } catch (error: any) {
    console.error('Classes fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const { sectionId, classTeacherId } = await req.json();
    const db = getDb();

    await db.execute({
      sql: 'UPDATE sections SET class_teacher_id = ? WHERE id = ?',
      args: [classTeacherId ? Number(classTeacherId) : null, Number(sectionId)]
    });

    await logAudit({
      user: auth.user,
      action: 'CLASS_TEACHER_ASSIGNED',
      module: 'Classes',
      targetId: String(sectionId),
      newValue: { sectionId, classTeacherId }
    });

    return NextResponse.json({ success: true, message: 'Class teacher assigned successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = PUT;