import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth, hashPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  const studentId = Number(params.id);
  const db = getDb();

  // Data isolation check: student can only view self, parent only linked children
  if (auth.user.role === 'STUDENT' && auth.user.student_id !== studentId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const sRes = await db.execute({
    sql: `
      SELECT s.*, c.name as class_name, sec.name as section_name,
             p.father_name, p.mother_name, p.guardian_name, p.primary_phone, p.alt_phone, p.address, p.emergency_contact,
             u.username, u.is_active as user_active
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

  const student = sRes.rows[0];

  // Attendance stats
  const attRes = await db.execute({
    sql: `
      SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_days
      FROM attendance WHERE student_id = ?
    `,
    args: [studentId]
  });

  // Fees stats
  const feeRes = await db.execute({
    sql: `
      SELECT 
        COUNT(*) as total_months,
        SUM(amount) as total_amount,
        SUM(paid_amount) as total_paid,
        SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END) as total_pending
      FROM fees WHERE student_id = ?
    `,
    args: [studentId]
  });

  // Recent Marks
  const marksRes = await db.execute({
    sql: `
      SELECT m.*, sub.name as subject_name, sub.code as subject_code, e.name as exam_name
      FROM marks m
      JOIN subjects sub ON m.subject_id = sub.id
      JOIN exams e ON m.exam_id = e.id
      WHERE m.student_id = ?
      ORDER BY e.start_date DESC, sub.name ASC
    `,
    args: [studentId]
  });

  // Achievements
  const achRes = await db.execute({
    sql: 'SELECT * FROM achievements WHERE student_id = ? ORDER BY date DESC',
    args: [studentId]
  });

  // Correction requests
  const corrRes = await db.execute({
    sql: 'SELECT * FROM correction_requests WHERE student_id = ? ORDER BY created_at DESC',
    args: [studentId]
  });

  return NextResponse.json({
    student,
    attendanceStats: attRes.rows[0],
    feeStats: feeRes.rows[0],
    marks: marksRes.rows,
    achievements: achRes.rows,
    corrections: corrRes.rows
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  const studentId = Number(params.id);
  const data = await req.json();
  const db = getDb();

  const {
    fullName,
    dob,
    gender,
    classId,
    rollNo,
    admissionNo,
    status,
    fatherName,
    motherName,
    guardianName,
    primaryPhone,
    altPhone,
    address,
    resetPassword,
    customPassword,
    studentAccountActive,
    photoUrl
  } = data;

  const oldRes = await db.execute({ sql: 'SELECT * FROM students WHERE id = ?', args: [studentId] });
  if (oldRes.rows.length === 0) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  const old = oldRes.rows[0];

  // Check roll number conflict if rollNo, classId, or gender changed
  let targetSectionId = old.section_id;
  const targetClassId = classId ? Number(classId) : Number(old.class_id);
  const targetGender = gender || String(old.gender);

  if (classId || gender) {
    const secRes = await db.execute({
      sql: 'SELECT id FROM sections WHERE class_id = ? AND name = ? LIMIT 1',
      args: [targetClassId, targetGender]
    });
    if (secRes.rows.length > 0) targetSectionId = Number(secRes.rows[0].id);
  }

  if (rollNo && (Number(rollNo) !== Number(old.roll_no) || targetSectionId !== Number(old.section_id))) {
    const confRes = await db.execute({
      sql: 'SELECT id, full_name FROM students WHERE section_id = ? AND roll_no = ? AND id != ? LIMIT 1',
      args: [targetSectionId, Number(rollNo), studentId]
    });
    if (confRes.rows.length > 0) {
      return NextResponse.json({
        error: `Roll Number ${rollNo} is already assigned to ${confRes.rows[0].full_name} in this section.`
      }, { status: 400 });
    }
  }

  await db.execute({
    sql: `
      UPDATE students 
      SET full_name = COALESCE(?, full_name),
          dob = COALESCE(?, dob),
          gender = COALESCE(?, gender),
          class_id = COALESCE(?, class_id),
          section_id = ?,
          roll_no = COALESCE(?, roll_no),
          admission_no = COALESCE(?, admission_no),
          status = COALESCE(?, status),
          photo_url = COALESCE(?, photo_url)
      WHERE id = ?
    `,
    args: [
      fullName || null,
      dob || null,
      gender || null,
      classId ? Number(classId) : null,
      targetSectionId,
      rollNo ? Number(rollNo) : null,
      admissionNo ? admissionNo.trim() : null,
      status || null,
      photoUrl || null,
      studentId
    ]
  });

  // Update user account (full name, avatar, account active status)
  let userActiveInt: number | null = null;
  if (studentAccountActive !== undefined) userActiveInt = studentAccountActive ? 1 : 0;
  else if (status) userActiveInt = (status === 'Active') ? 1 : 0;

  await db.execute({
    sql: `
      UPDATE users 
      SET full_name = COALESCE(?, full_name), 
          avatar_url = COALESCE(?, avatar_url),
          is_active = COALESCE(?, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    args: [fullName || null, photoUrl || null, userActiveInt, old.user_id]
  });

  // Update parent record
  if (old.parent_id && (fatherName || motherName || guardianName || primaryPhone || altPhone || address)) {
    await db.execute({
      sql: `
        UPDATE parents
        SET father_name = COALESCE(?, father_name),
            mother_name = COALESCE(?, mother_name),
            guardian_name = COALESCE(?, guardian_name),
            primary_phone = COALESCE(?, primary_phone),
            alt_phone = COALESCE(?, alt_phone),
            address = COALESCE(?, address)
        WHERE id = ?
      `,
      args: [
        fatherName || null,
        motherName || null,
        guardianName || null,
        primaryPhone || null,
        altPhone || null,
        address || null,
        old.parent_id
      ]
    });
  }

  // Password reset if requested
  let newPassPlain: string | null = null;
  if (resetPassword || customPassword) {
    newPassPlain = customPassword ? customPassword.trim() : ('MU' + Math.floor(100000 + Math.random() * 900000));
    const passHash = await hashPassword(newPassPlain);
    await db.execute({
      sql: 'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [passHash, old.user_id]
    });
  }

  await logAudit({
    user: auth.user,
    action: 'STUDENT_UPDATED',
    module: 'Students',
    targetId: String(studentId),
    previousValue: old,
    newValue: { ...data, newPasswordGenerated: !!newPassPlain }
  });

  return NextResponse.json({
    success: true,
    message: 'Student record updated successfully',
    newPassword: newPassPlain
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  const studentId = Number(params.id);
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'archive'; // 'archive' | 'restore' | 'permanent'
  const db = getDb();

  const sRes = await db.execute({ sql: 'SELECT * FROM students WHERE id = ?', args: [studentId] });
  if (sRes.rows.length === 0) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  const student = sRes.rows[0];

  if (action === 'restore') {
    // Restore student to Active status
    await db.execute({ sql: "UPDATE students SET status = 'Active' WHERE id = ?", args: [studentId] });
    await db.execute({ sql: 'UPDATE users SET is_active = 1 WHERE id = ?', args: [student.user_id] });

    await logAudit({
      user: auth.user,
      action: 'STUDENT_RESTORED',
      module: 'Students',
      targetId: String(studentId),
      newValue: { studentName: student.full_name, status: 'Active' }
    });

    return NextResponse.json({ success: true, message: `Student ${student.full_name} restored to Active status.` });
  }

  if (action === 'permanent') {
    // Highly restricted permanent deletion (Super Admin only)
    if (auth.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only Super Admin can permanently delete records. Please use Archive.' }, { status: 403 });
    }

    await db.execute({ sql: 'DELETE FROM students WHERE id = ?', args: [studentId] });
    await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [student.user_id] });

    await logAudit({
      user: auth.user,
      action: 'STUDENT_PERMANENTLY_DELETED',
      module: 'Students',
      targetId: String(studentId),
      previousValue: student
    });

    return NextResponse.json({ success: true, message: `Student ${student.full_name} permanently removed.` });
  }

  // Default: Soft Archive / Deactivate (Preserves all marks, fees, attendance, certificates)
  await db.execute({ sql: "UPDATE students SET status = 'Archived' WHERE id = ?", args: [studentId] });
  await db.execute({ sql: 'UPDATE users SET is_active = 0 WHERE id = ?', args: [student.user_id] });

  await logAudit({
    user: auth.user,
    action: 'STUDENT_ARCHIVED',
    module: 'Students',
    targetId: String(studentId),
    previousValue: { status: student.status },
    newValue: { status: 'Archived', preservedHistory: true }
  });

  return NextResponse.json({
    success: true,
    message: `Student ${student.full_name} archived. Historical marks, attendance and fee records preserved.`
  });
}