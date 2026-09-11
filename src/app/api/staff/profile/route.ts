import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['STAFF', 'SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  const db = getDb();
  let teacherId = auth.user.teacher_id;

  if (!teacherId && (auth.user.role === 'SUPER_ADMIN' || auth.user.role === 'OFFICE_ADMIN')) {
    const { searchParams } = new URL(req.url);
    teacherId = Number(searchParams.get('teacherId')) || 1;
  }

  if (!teacherId) {
    return NextResponse.json({ error: 'No teacher account linked' }, { status: 400 });
  }

  const tRes = await db.execute({
    sql: `
      SELECT t.*, u.username, u.email as user_email, u.phone as user_phone, u.avatar_url
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `,
    args: [teacherId]
  });

  if (tRes.rows.length === 0) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  }

  const assignments = await db.execute({
    sql: `
      SELECT ta.*, c.name as class_name, sec.name as section_name, sub.name as subject_name, sub.code as subject_code
      FROM teacher_assignments ta
      JOIN sections sec ON ta.section_id = sec.id
      JOIN classes c ON sec.class_id = c.id
      JOIN subjects sub ON ta.subject_id = sub.id
      WHERE ta.teacher_id = ?
    `,
    args: [teacherId]
  });

  const classTeacherSections = await db.execute({
    sql: `
      SELECT sec.id, sec.name as section_name, c.name as class_name
      FROM sections sec
      JOIN classes c ON sec.class_id = c.id
      WHERE sec.class_teacher_id = ?
    `,
    args: [teacherId]
  });

  return NextResponse.json({
    teacher: tRes.rows[0],
    assignments: assignments.rows,
    classTeacherSections: classTeacherSections.rows
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['STAFF', 'SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const db = getDb();
    let teacherId = auth.user.teacher_id;
    const data = await req.json();

    if (!teacherId && (auth.user.role === 'SUPER_ADMIN' || auth.user.role === 'OFFICE_ADMIN')) {
      teacherId = Number(data.teacherId);
    }

    if (!teacherId) {
      return NextResponse.json({ error: 'No teacher ID linked' }, { status: 400 });
    }

    const {
      phone,
      email,
      qualification,
      designation,
      photoUrl,
      address,
      bio,
      showPhonePublicly
    } = data;

    const tOld = await db.execute({ sql: 'SELECT * FROM teachers WHERE id = ?', args: [teacherId] });
    if (tOld.rows.length === 0) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    const old = tOld.rows[0];

    await db.execute({
      sql: `
        UPDATE teachers
        SET phone = COALESCE(?, phone),
            email = COALESCE(?, email),
            qualification = COALESCE(?, qualification),
            designation = COALESCE(?, designation),
            photo_url = COALESCE(?, photo_url),
            show_phone_publicly = COALESCE(?, show_phone_publicly)
        WHERE id = ?
      `,
      args: [
        phone || null,
        email || null,
        qualification || null,
        designation || null,
        photoUrl || null,
        showPhonePublicly !== undefined ? (showPhonePublicly ? 1 : 0) : null,
        teacherId
      ]
    });

    await db.execute({
      sql: `
        UPDATE users
        SET phone = COALESCE(?, phone),
            email = COALESCE(?, email),
            avatar_url = COALESCE(?, avatar_url)
        WHERE id = ?
      `,
      args: [phone || null, email || null, photoUrl || null, old.user_id]
    });

    await logAudit({
      user: auth.user,
      action: 'STAFF_SELF_PROFILE_UPDATE',
      module: 'StaffPortal',
      targetId: String(teacherId),
      newValue: { teacherName: old.full_name, phone, email, qualification }
    });

    return NextResponse.json({
      success: true,
      message: 'Usthad profile updated successfully!'
    });
  } catch (error: any) {
    console.error('Staff profile update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 });
  }
}
