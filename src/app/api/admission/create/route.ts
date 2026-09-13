
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth, hashPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { MONTHS, MONTHLY_FEE_AMOUNT } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const data = await req.json();
    const {
      fullName,
      dob,
      gender, // 'Boys' or 'Girls'
      className, // 'Class 1' to 'Class 10', '+1', '+2'
      fatherName,
      motherName,
      guardianName,
      primaryPhone,
      altPhone,
      address,
      emergencyContact,
      photoUrl,
      customAdmissionNo,
      customRollNo
    } = data;

    if (!fullName || !gender || !className || !primaryPhone) {
      return NextResponse.json({ error: 'Full name, gender, class, and primary phone are required' }, { status: 400 });
    }

    const db = getDb();

    // 1. Resolve Academic Year
    const ayRes = await db.execute('SELECT id, name FROM academic_years WHERE is_current = 1 LIMIT 1');
    const academicYearId = Number(ayRes.rows[0]?.id || 1);

    // 2. Resolve Class and Section automatically based on Gender
    const classRes = await db.execute({
      sql: 'SELECT id FROM classes WHERE name = ? LIMIT 1',
      args: [className]
    });
    if (classRes.rows.length === 0) {
      return NextResponse.json({ error: `Invalid class name: ${className}` }, { status: 400 });
    }
    const classId = Number(classRes.rows[0].id);

    // Section automatically matches gender: Class X Boys or Class X Girls
    const secRes = await db.execute({
      sql: 'SELECT id FROM sections WHERE class_id = ? AND name = ? LIMIT 1',
      args: [classId, gender]
    });
    if (secRes.rows.length === 0) {
      return NextResponse.json({ error: 'Section not found for class and gender' }, { status: 400 });
    }
    const sectionId = Number(secRes.rows[0].id);

    // 3. Generate Admission Number if not provided
    let admissionNo = customAdmissionNo ? customAdmissionNo.trim() : '';
    if (!admissionNo) {
      const countRes = await db.execute('SELECT COUNT(*) as c FROM students');
      const nextSeq = Number(countRes.rows[0].c) + 1;
      admissionNo = `MU2026-${String(nextSeq).padStart(4, '0')}`;
    }

    // 4. Calculate Roll Number or Validate Custom Roll Number
    let rollNo = customRollNo ? Number(customRollNo) : 0;
    if (rollNo > 0) {
      const existingRoll = await db.execute({
        sql: 'SELECT id, full_name FROM students WHERE section_id = ? AND roll_no = ? LIMIT 1',
        args: [sectionId, rollNo]
      });
      if (existingRoll.rows.length > 0) {
        return NextResponse.json({
          error: `Roll Number ${rollNo} is already assigned to ${existingRoll.rows[0].full_name} in ${className} (${gender}). Please choose a different roll number.`
        }, { status: 400 });
      }
    } else {
      const rollRes = await db.execute({
        sql: 'SELECT MAX(roll_no) as max_roll FROM students WHERE section_id = ?',
        args: [sectionId]
      });
      rollNo = Number(rollRes.rows[0]?.max_roll || 0) + 1;
    }

    // 5. Generate secure temporary password
    const studentUsername = admissionNo;
    const tempPassword = 'MU' + Math.floor(100000 + Math.random() * 900000);
    const passwordHash = await hashPassword(tempPassword);

    // 6. Create Parent Record if doesn't exist
    const cleanPhone = primaryPhone.trim();
    let parentId: number;
    const existingParentRes = await db.execute({
      sql: 'SELECT id FROM parents WHERE primary_phone = ? LIMIT 1',
      args: [cleanPhone]
    });

    if (existingParentRes.rows.length > 0) {
      parentId = Number(existingParentRes.rows[0].id);
    } else {
      const parentUsername = `P-${cleanPhone}`;
      const pUserRes = await db.execute({
        sql: 'INSERT INTO users (username, password_hash, role, full_name, phone) VALUES (?, ?, ?, ?, ?)',
        args: [parentUsername, passwordHash, 'PARENT', fatherName || guardianName || 'Parent', cleanPhone]
      });
      const pUserId = Number(pUserRes.lastInsertRowid);
      const pRes = await db.execute({
        sql: 'INSERT INTO parents (user_id, father_name, mother_name, guardian_name, primary_phone, alt_phone, address, emergency_contact) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [pUserId, fatherName || null, motherName || null, guardianName || null, cleanPhone, altPhone || null, address || null, emergencyContact || cleanPhone]
      });
      parentId = Number(pRes.lastInsertRowid);
    }

    // 7. Create Student User Account
    const sUserRes = await db.execute({
      sql: 'INSERT INTO users (username, password_hash, role, full_name, email, phone, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [
        studentUsername,
        passwordHash,
        'STUDENT',
        fullName.trim(),
        `${studentUsername.toLowerCase()}@student.mifthahululoom.edu.in`,
        cleanPhone,
        photoUrl || null
      ]
    });
    const sUserId = Number(sUserRes.lastInsertRowid);

    // 8. Create Student Database Record
    const sRes = await db.execute({
      sql: `
        INSERT INTO students (
          user_id, admission_no, roll_no, full_name, dob, gender, 
          class_id, section_id, photo_url, admission_date, status, 
          academic_year_id, parent_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'), 'Active', ?, ?)
      `,
      args: [
        sUserId,
        admissionNo,
        rollNo,
        fullName.trim(),
        dob || null,
        gender,
        classId,
        sectionId,
        photoUrl || null,
        academicYearId,
        parentId
      ]
    });
    const studentId = Number(sRes.lastInsertRowid);

    // 9. Automatically generate 12 Monthly Fee Records (Rs. 100 per month)
    for (const month of MONTHS) {
      await db.execute({
        sql: `
          INSERT INTO fees (student_id, academic_year_id, month, amount, status, paid_amount)
          VALUES (?, ?, ?, ?, 'Pending', 0)
        `,
        args: [studentId, academicYearId, month, MONTHLY_FEE_AMOUNT]
      });
    }

    // 10. Audit Log
    await logAudit({
      user: auth.user,
      action: 'STUDENT_ADMISSION_COMPLETED',
      module: 'Admissions',
      targetId: String(studentId),
      newValue: {
        admissionNo,
        fullName,
        className,
        gender,
        section: `${className} ${gender}`,
        rollNo,
        phone: cleanPhone,
        tempPassword
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Admission completed successfully and student account activated!',
      student: {
        id: studentId,
        admissionNo,
        rollNo,
        fullName,
        gender,
        className,
        section: `${className} ${gender}`,
        username: studentUsername,
        temporaryPassword: tempPassword,
        parentPhone: cleanPhone
      }
    });
  } catch (error: any) {
    console.error('Admission error:', error);
    return NextResponse.json({ error: error.message || 'Failed to complete admission' }, { status: 500 });
  }
}
