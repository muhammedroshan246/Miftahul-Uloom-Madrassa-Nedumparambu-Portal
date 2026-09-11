import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['STUDENT', 'PARENT', 'SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  const db = getDb();
  let studentId = auth.user.student_id;

  if (!studentId && (auth.user.role === 'SUPER_ADMIN' || auth.user.role === 'OFFICE_ADMIN')) {
    const { searchParams } = new URL(req.url);
    studentId = Number(searchParams.get('studentId')) || 1;
  }

  if (!studentId) {
    return NextResponse.json({ error: 'No student account linked' }, { status: 400 });
  }

  const sRes = await db.execute({
    sql: `
      SELECT s.*, c.name as class_name, sec.name as section_name,
             p.father_name, p.mother_name, p.guardian_name, p.primary_phone, p.alt_phone, p.address, p.emergency_contact,
             u.username, u.email as user_email, u.phone as user_phone, u.avatar_url
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN parents p ON s.parent_id = p.id
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `,
    args: [studentId]
  });

  if (sRes.rows.length === 0) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  return NextResponse.json({ profile: sRes.rows[0] });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['STUDENT', 'PARENT', 'SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const db = getDb();
    let studentId = auth.user.student_id;

    const data = await req.json();
    if (!studentId && (auth.user.role === 'SUPER_ADMIN' || auth.user.role === 'OFFICE_ADMIN')) {
      studentId = Number(data.studentId);
    }

    if (!studentId) {
      return NextResponse.json({ error: 'No student ID linked' }, { status: 400 });
    }

    const {
      dob,
      bloodGroup,
      photoUrl,
      fatherName,
      motherName,
      guardianName,
      primaryPhone,
      altPhone,
      address,
      emergencyContact,
      notes
    } = data;

    const sOld = await db.execute({ sql: 'SELECT * FROM students WHERE id = ?', args: [studentId] });
    if (sOld.rows.length === 0) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    const old = sOld.rows[0];

    // Update student personal details
    await db.execute({
      sql: `
        UPDATE students 
        SET dob = COALESCE(?, dob),
            photo_url = COALESCE(?, photo_url)
        WHERE id = ?
      `,
      args: [dob || null, photoUrl || null, studentId]
    });

    if (photoUrl) {
      await db.execute({
        sql: 'UPDATE users SET avatar_url = ? WHERE id = ?',
        args: [photoUrl, old.user_id]
      });
    }

    // Update parent / family record
    let parentId = old.parent_id;
    if (!parentId) {
      // Create new parent record if absent
      const pNew = await db.execute({
        sql: `
          INSERT INTO parents (user_id, father_name, mother_name, guardian_name, primary_phone, alt_phone, address, emergency_contact)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [old.user_id, fatherName || null, motherName || null, guardianName || null, primaryPhone || null, altPhone || null, address || null, emergencyContact || null]
      });
      parentId = Number(pNew.lastInsertRowid);
      await db.execute({ sql: 'UPDATE students SET parent_id = ? WHERE id = ?', args: [parentId, studentId] });
    } else {
      await db.execute({
        sql: `
          UPDATE parents
          SET father_name = COALESCE(?, father_name),
              mother_name = COALESCE(?, mother_name),
              guardian_name = COALESCE(?, guardian_name),
              primary_phone = COALESCE(?, primary_phone),
              alt_phone = COALESCE(?, alt_phone),
              address = COALESCE(?, address),
              emergency_contact = COALESCE(?, emergency_contact)
          WHERE id = ?
        `,
        args: [
          fatherName || null,
          motherName || null,
          guardianName || null,
          primaryPhone || null,
          altPhone || null,
          address || null,
          emergencyContact || null,
          parentId
        ]
      });
    }

    await logAudit({
      user: auth.user,
      action: 'STUDENT_SELF_PROFILE_UPDATE',
      module: 'StudentPortal',
      targetId: String(studentId),
      newValue: { studentName: old.full_name, fatherName, primaryPhone, address }
    });

    return NextResponse.json({
      success: true,
      message: 'Student and family profile updated successfully!'
    });
  } catch (error: any) {
    console.error('Student profile update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 });
  }
}
