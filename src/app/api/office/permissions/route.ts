import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN', 'STAFF']);
  if ('status' in auth) return auth;

  try {
    const db = getDb();

    // If STAFF, return only own permissions
    if (auth.user.role === 'STAFF') {
      const teacherId = auth.user.teacher_id;
      if (!teacherId) return NextResponse.json({ permissions: [] });

      const res = await db.execute({
        sql: `
          SELECT p.*, s.name as section_name, c.name as class_name, c.numeric_order
          FROM staff_permissions p
          JOIN sections s ON p.section_id = s.id
          JOIN classes c ON s.class_id = c.id
          WHERE p.teacher_id = ?
          ORDER BY c.numeric_order ASC, s.name ASC
        `,
        args: [teacherId]
      });

      return NextResponse.json({ permissions: res.rows });
    }

    // Office Admin: return all teachers with their assigned sections and permissions
    const teachersRes = await db.execute(`
      SELECT id, staff_id, full_name, designation, phone, is_active, assigned_classes
      FROM teachers
      ORDER BY staff_id ASC
    `);

    const permissionsRes = await db.execute(`
      SELECT p.*, s.name as section_name, c.name as class_name, c.numeric_order, t.full_name as teacher_name, t.staff_id
      FROM staff_permissions p
      JOIN sections s ON p.section_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN teachers t ON p.teacher_id = t.id
      ORDER BY t.staff_id ASC, c.numeric_order ASC, s.name ASC
    `);

    const sectionsRes = await db.execute(`
      SELECT s.id, s.name, s.class_id, c.name as class_name, c.numeric_order
      FROM sections s
      JOIN classes c ON s.class_id = c.id
      ORDER BY c.numeric_order ASC, s.name ASC
    `);

    return NextResponse.json({
      teachers: teachersRes.rows,
      permissions: permissionsRes.rows,
      sections: sectionsRes.rows
    });
  } catch (error: any) {
    console.error('Permissions GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch permissions' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const data = await req.json();
    const { teacherId, sectionId, isClassTeacher, canManageAttendance, canManageMarks, canManageFees } = data;

    if (!teacherId || !sectionId) {
      return NextResponse.json({ error: 'teacherId and sectionId are required' }, { status: 400 });
    }

    const db = getDb();

    await db.execute({
      sql: `
        INSERT INTO staff_permissions (teacher_id, section_id, is_class_teacher, can_manage_attendance, can_manage_marks, can_manage_fees)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(teacher_id, section_id) DO UPDATE SET
          is_class_teacher = excluded.is_class_teacher,
          can_manage_attendance = excluded.can_manage_attendance,
          can_manage_marks = excluded.can_manage_marks,
          can_manage_fees = excluded.can_manage_fees,
          updated_at = CURRENT_TIMESTAMP
      `,
      args: [
        Number(teacherId),
        Number(sectionId),
        isClassTeacher ? 1 : 0,
        canManageAttendance ? 1 : 0,
        canManageMarks ? 1 : 0,
        canManageFees ? 1 : 0
      ]
    });

    // Update section class_teacher_id if isClassTeacher is true
    if (isClassTeacher) {
      await db.execute({
        sql: 'UPDATE sections SET class_teacher_id = ? WHERE id = ?',
        args: [Number(teacherId), Number(sectionId)]
      });
    }

    await logAudit({
      user: auth.user,
      action: 'STAFF_PERMISSIONS_UPDATED',
      module: 'StaffManagement',
      targetId: `Teacher:${teacherId}:Section:${sectionId}`,
      newValue: { teacherId, sectionId, isClassTeacher, canManageAttendance, canManageMarks, canManageFees }
    });

    return NextResponse.json({
      success: true,
      message: 'Staff permissions updated successfully'
    });
  } catch (error: any) {
    console.error('Permissions PUT error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update permissions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return PUT(req);
}
