import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth, getSessionUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode');

    // Check authenticated user
    const user = await getSessionUser(req);
    const isStaff = user?.role === 'STAFF';
    const isSadr = user?.role === 'SADR' || user?.username === 'sadr' || user?.username === 'jabir.baqavi';

    // If regular STAFF, or Sadr explicitly in staff mode, restrict to assigned class/section
    if ((isStaff && !isSadr) || (isSadr && mode === 'staff')) {
      const teacherId = user?.teacher_id;
      const tRes = await db.execute({
        sql: `
          SELECT t.id, t.full_name, t.assigned_class_id, t.assigned_wing, t.assigned_section_id,
                 c.name as class_name, s.name as section_name
          FROM teachers t
          LEFT JOIN classes c ON c.id = t.assigned_class_id
          LEFT JOIN sections s ON s.id = t.assigned_section_id
          WHERE t.id = ? OR t.user_id = ?
          LIMIT 1
        `,
        args: [teacherId || 0, user?.id || 0]
      });

      if (tRes.rows.length > 0 && tRes.rows[0].assigned_class_id) {
        const tInfo = tRes.rows[0];
        const classId = Number(tInfo.assigned_class_id);
        const sectionId = Number(tInfo.assigned_section_id);

        const [classesRes, sectionsRes, subjectsRes] = await Promise.all([
          db.execute({
            sql: 'SELECT * FROM classes WHERE id = ?',
            args: [classId]
          }),
          db.execute({
            sql: `
              SELECT sec.*, c.name as class_name, t.full_name as teacher_name, t.staff_id,
                     (SELECT COUNT(*) FROM students WHERE section_id = sec.id AND status = 'Active') as student_count
              FROM sections sec
              JOIN classes c ON sec.class_id = c.id
              LEFT JOIN teachers t ON sec.class_teacher_id = t.id
              WHERE sec.id = ?
            `,
            args: [sectionId]
          }),
          db.execute({
            sql: `
              SELECT sub.*, c.name as class_name 
              FROM subjects sub
              JOIN classes c ON sub.class_id = c.id
              WHERE sub.class_id = ?
              ORDER BY sub.name ASC
            `,
            args: [classId]
          })
        ]);

        return NextResponse.json({
          classes: classesRes.rows,
          sections: sectionsRes.rows,
          subjects: subjectsRes.rows,
          isStaff: true,
          assignedClass: { id: classId, name: tInfo.class_name },
          assignedSection: { id: sectionId, name: tInfo.section_name, wing: tInfo.assigned_wing }
        });
      }
    }

    // Default: Office Admin / Sadr / Super Admin gets ALL classes and sections
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
      subjects: subjectsRes.rows,
      isStaff: false
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