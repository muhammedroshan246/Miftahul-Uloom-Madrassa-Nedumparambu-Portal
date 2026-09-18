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

    // If regular STAFF, or Sadr explicitly in staff mode, restrict to assigned classes/sections (max 2)
    if ((isStaff && !isSadr) || (isSadr && mode === 'staff')) {
      const teacherId = user?.teacher_id;
      const tRes = await db.execute({
        sql: `
          SELECT t.id, t.full_name, 
                 t.assigned_class_id, t.assigned_wing, t.assigned_section_id,
                 c1.name as class_name_1, s1.name as section_name_1,
                 t.assigned_class_id_2, t.assigned_wing_2, t.assigned_section_id_2,
                 c2.name as class_name_2, s2.name as section_name_2
          FROM teachers t
          LEFT JOIN classes c1 ON c1.id = t.assigned_class_id
          LEFT JOIN sections s1 ON s1.id = t.assigned_section_id
          LEFT JOIN classes c2 ON c2.id = t.assigned_class_id_2
          LEFT JOIN sections s2 ON s2.id = t.assigned_section_id_2
          WHERE t.id = ? OR t.user_id = ?
          LIMIT 1
        `,
        args: [teacherId || 0, user?.id || 0]
      });

      if (tRes.rows.length > 0) {
        const tInfo = tRes.rows[0];
        const assignedList: Array<{ classId: number; className: string; wing: string; sectionId: number }> = [];
        const classIds: number[] = [];
        const sectionIds: number[] = [];

        if (tInfo.assigned_class_id && tInfo.assigned_section_id) {
          const cId = Number(tInfo.assigned_class_id);
          const sId = Number(tInfo.assigned_section_id);
          classIds.push(cId);
          sectionIds.push(sId);
          assignedList.push({
            classId: cId,
            className: String(tInfo.class_name_1 || ''),
            wing: String(tInfo.assigned_wing || 'Boys'),
            sectionId: sId
          });
        }

        if (tInfo.assigned_class_id_2 && tInfo.assigned_section_id_2) {
          const cId2 = Number(tInfo.assigned_class_id_2);
          const sId2 = Number(tInfo.assigned_section_id_2);
          if (!classIds.includes(cId2)) classIds.push(cId2);
          if (!sectionIds.includes(sId2)) sectionIds.push(sId2);
          assignedList.push({
            classId: cId2,
            className: String(tInfo.class_name_2 || ''),
            wing: String(tInfo.assigned_wing_2 || 'Boys'),
            sectionId: sId2
          });
        }

        if (classIds.length > 0 && sectionIds.length > 0) {
          const classPlaceholders = classIds.map(() => '?').join(',');
          const secPlaceholders = sectionIds.map(() => '?').join(',');

          const [classesRes, sectionsRes, subjectsRes] = await Promise.all([
            db.execute({
              sql: `SELECT * FROM classes WHERE id IN (${classPlaceholders}) ORDER BY numeric_order ASC`,
              args: classIds
            }),
            db.execute({
              sql: `
                SELECT sec.*, c.name as class_name, t.full_name as teacher_name, t.staff_id,
                       (SELECT COUNT(*) FROM students WHERE section_id = sec.id AND status = 'Active') as student_count
                FROM sections sec
                JOIN classes c ON sec.class_id = c.id
                LEFT JOIN teachers t ON sec.class_teacher_id = t.id
                WHERE sec.id IN (${secPlaceholders})
              `,
              args: sectionIds
            }),
            db.execute({
              sql: `
                SELECT sub.*, c.name as class_name 
                FROM subjects sub
                JOIN classes c ON sub.class_id = c.id
                WHERE sub.class_id IN (${classPlaceholders})
                ORDER BY c.numeric_order ASC, sub.name ASC
              `,
              args: classIds
            })
          ]);

          return NextResponse.json({
            classes: classesRes.rows,
            sections: sectionsRes.rows,
            subjects: subjectsRes.rows,
            isStaff: true,
            assignedClassList: assignedList,
            assignedClass: assignedList[0] ? { id: assignedList[0].classId, name: assignedList[0].className } : null,
            assignedSection: assignedList[0] ? { id: assignedList[0].sectionId, name: assignedList[0].wing, wing: assignedList[0].wing } : null
          });
        }
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