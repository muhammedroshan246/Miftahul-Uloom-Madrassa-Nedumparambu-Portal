const fs = require('fs');
const path = require('path');
function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

// 1. /api/admission/create
ensureDir('src/app/api/admission/create');
fs.writeFileSync('src/app/api/admission/create/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth, hashPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { MONTHS, MONTHLY_FEE_AMOUNT } from '@/lib/constants';

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
      return NextResponse.json({ error: \`Invalid class name: \${className}\` }, { status: 400 });
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
      admissionNo = \`MU2026-\${String(nextSeq).padStart(4, '0')}\`;
    }

    // 4. Calculate Roll Number if not provided
    let rollNo = customRollNo ? Number(customRollNo) : 0;
    if (!rollNo) {
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
      const parentUsername = \`P-\${cleanPhone}\`;
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
        \`\${studentUsername.toLowerCase()}@student.mifthahululoom.edu.in\`,
        cleanPhone,
        photoUrl || null
      ]
    });
    const sUserId = Number(sUserRes.lastInsertRowid);

    // 8. Create Student Database Record
    const sRes = await db.execute({
      sql: \`
        INSERT INTO students (
          user_id, admission_no, roll_no, full_name, dob, gender, 
          class_id, section_id, photo_url, admission_date, status, 
          academic_year_id, parent_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'), 'Active', ?, ?)
      \`,
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
        sql: \`
          INSERT INTO fees (student_id, academic_year_id, month, amount, status, paid_amount)
          VALUES (?, ?, ?, ?, 'Pending', 0)
        \`,
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
        section: \`\${className} \${gender}\`,
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
        section: \`\${className} \${gender}\`,
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
`);

// 2. /api/students
ensureDir('src/app/api/students');
fs.writeFileSync('src/app/api/students/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN', 'STAFF']);
  if ('status' in auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const classId = searchParams.get('classId');
    const gender = searchParams.get('gender');
    const status = searchParams.get('status') || 'Active';
    const limit = Number(searchParams.get('limit')) || 100;
    const page = Number(searchParams.get('page')) || 1;
    const offset = (page - 1) * limit;

    const db = getDb();
    let query = \`
      SELECT s.*, c.name as class_name, sec.name as section_name,
             p.father_name, p.mother_name, p.primary_phone, p.address,
             u.username
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN parents p ON s.parent_id = p.id
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    \`;
    const args: any[] = [];

    if (status && status !== 'All') {
      query += ' AND s.status = ?';
      args.push(status);
    }
    if (classId && classId !== 'All') {
      query += ' AND s.class_id = ?';
      args.push(Number(classId));
    }
    if (gender && gender !== 'All') {
      query += ' AND s.gender = ?';
      args.push(gender);
    }
    if (search) {
      const q = \`%\${search.trim()}%\`;
      query += ' AND (s.full_name LIKE ? OR s.admission_no LIKE ? OR u.username LIKE ? OR p.primary_phone LIKE ? OR p.father_name LIKE ?)';
      args.push(q, q, q, q, q);
    }

    // Role check: If teacher, only list students in their assigned sections
    if (auth.user.role === 'STAFF' && auth.user.teacher_id) {
      query += \` AND s.section_id IN (
        SELECT section_id FROM teacher_assignments WHERE teacher_id = ?
        UNION
        SELECT id FROM sections WHERE class_teacher_id = ?
      )\`;
      args.push(auth.user.teacher_id, auth.user.teacher_id);
    }

    query += ' ORDER BY c.numeric_order ASC, s.gender ASC, s.roll_no ASC LIMIT ? OFFSET ?';
    args.push(limit, offset);

    const res = await db.execute({ sql: query, args });

    return NextResponse.json({
      students: res.rows,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('Students fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}
`);

// 3. /api/students/[id]
ensureDir('src/app/api/students/[id]');
fs.writeFileSync('src/app/api/students/[id]/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth, hashPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

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
    sql: \`
      SELECT s.*, c.name as class_name, sec.name as section_name,
             p.father_name, p.mother_name, p.guardian_name, p.primary_phone, p.alt_phone, p.address, p.emergency_contact,
             u.username, u.is_active as user_active
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN parents p ON s.parent_id = p.id
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    \`,
    args: [studentId]
  });

  if (sRes.rows.length === 0) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  const student = sRes.rows[0];

  // Attendance stats
  const attRes = await db.execute({
    sql: \`
      SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_days
      FROM attendance WHERE student_id = ?
    \`,
    args: [studentId]
  });

  // Fees stats
  const feeRes = await db.execute({
    sql: \`
      SELECT 
        COUNT(*) as total_months,
        SUM(amount) as total_amount,
        SUM(paid_amount) as total_paid,
        SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END) as total_pending
      FROM fees WHERE student_id = ?
    \`,
    args: [studentId]
  });

  // Recent Marks
  const marksRes = await db.execute({
    sql: \`
      SELECT m.*, sub.name as subject_name, sub.code as subject_code, e.name as exam_name
      FROM marks m
      JOIN subjects sub ON m.subject_id = sub.id
      JOIN exams e ON m.exam_id = e.id
      WHERE m.student_id = ?
      ORDER BY e.start_date DESC, sub.name ASC
    \`,
    args: [studentId]
  });

  // Achievements
  const achRes = await db.execute({
    sql: 'SELECT * FROM achievements WHERE student_id = ? ORDER BY date DESC',
    args: [studentId]
  });

  return NextResponse.json({
    student,
    attendanceStats: attRes.rows[0],
    feeStats: feeRes.rows[0],
    marks: marksRes.rows,
    achievements: achRes.rows
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
    status,
    fatherName,
    motherName,
    primaryPhone,
    address,
    resetPassword
  } = data;

  const oldRes = await db.execute({ sql: 'SELECT * FROM students WHERE id = ?', args: [studentId] });
  if (oldRes.rows.length === 0) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  const old = oldRes.rows[0];

  // Resolve section if class or gender changed
  let targetSectionId = old.section_id;
  if (classId || gender) {
    const cid = classId ? Number(classId) : Number(old.class_id);
    const gen = gender || String(old.gender);
    const secRes = await db.execute({
      sql: 'SELECT id FROM sections WHERE class_id = ? AND name = ? LIMIT 1',
      args: [cid, gen]
    });
    if (secRes.rows.length > 0) targetSectionId = Number(secRes.rows[0].id);
  }

  await db.execute({
    sql: \`
      UPDATE students 
      SET full_name = COALESCE(?, full_name),
          dob = COALESCE(?, dob),
          gender = COALESCE(?, gender),
          class_id = COALESCE(?, class_id),
          section_id = ?,
          roll_no = COALESCE(?, roll_no),
          status = COALESCE(?, status)
      WHERE id = ?
    \`,
    args: [
      fullName || null,
      dob || null,
      gender || null,
      classId ? Number(classId) : null,
      targetSectionId,
      rollNo ? Number(rollNo) : null,
      status || null,
      studentId
    ]
  });

  // Update user full name
  if (fullName) {
    await db.execute({
      sql: 'UPDATE users SET full_name = ? WHERE id = ?',
      args: [fullName, old.user_id]
    });
  }

  // Update parent
  if (old.parent_id && (fatherName || motherName || primaryPhone || address)) {
    await db.execute({
      sql: \`
        UPDATE parents
        SET father_name = COALESCE(?, father_name),
            mother_name = COALESCE(?, mother_name),
            primary_phone = COALESCE(?, primary_phone),
            address = COALESCE(?, address)
        WHERE id = ?
      \`,
      args: [fatherName || null, motherName || null, primaryPhone || null, address || null, old.parent_id]
    });
  }

  // Password reset if requested
  let newPassPlain: string | null = null;
  if (resetPassword) {
    newPassPlain = 'MU' + Math.floor(100000 + Math.random() * 900000);
    const passHash = await hashPassword(newPassPlain);
    await db.execute({
      sql: 'UPDATE users SET password_hash = ? WHERE id = ?',
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
`);

// 4. /api/classes
ensureDir('src/app/api/classes');
fs.writeFileSync('src/app/api/classes/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const classesRes = await db.execute('SELECT * FROM classes ORDER BY numeric_order ASC');
    const sectionsRes = await db.execute(\`
      SELECT sec.*, c.name as class_name, t.full_name as teacher_name, t.staff_id,
             (SELECT COUNT(*) FROM students WHERE section_id = sec.id AND status = 'Active') as student_count
      FROM sections sec
      JOIN classes c ON sec.class_id = c.id
      LEFT JOIN teachers t ON sec.class_teacher_id = t.id
      ORDER BY c.numeric_order ASC, sec.name ASC
    \`);

    const subjectsRes = await db.execute(\`
      SELECT sub.*, c.name as class_name 
      FROM subjects sub
      JOIN classes c ON sub.class_id = c.id
      ORDER BY c.numeric_order ASC, sub.name ASC
    \`);

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
`);

// 5. /api/teachers
ensureDir('src/app/api/teachers');
fs.writeFileSync('src/app/api/teachers/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth, hashPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const db = getDb();
    const tRes = await db.execute(\`
      SELECT t.*, u.username, u.is_active as user_active,
             (SELECT COUNT(*) FROM teacher_assignments WHERE teacher_id = t.id) as assigned_subjects_count,
             (SELECT COUNT(*) FROM sections WHERE class_teacher_id = t.id) as is_class_teacher_count
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.full_name ASC
    \`);

    const assignmentsRes = await db.execute(\`
      SELECT ta.*, t.full_name as teacher_name, c.name as class_name, sec.name as section_name, sub.name as subject_name
      FROM teacher_assignments ta
      JOIN teachers t ON ta.teacher_id = t.id
      JOIN sections sec ON ta.section_id = sec.id
      JOIN classes c ON sec.class_id = c.id
      JOIN subjects sub ON ta.subject_id = sub.id
    \`);

    return NextResponse.json({
      teachers: tRes.rows,
      assignments: assignmentsRes.rows
    });
  } catch (error: any) {
    console.error('Teachers query error:', error);
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const data = await req.json();
    const { fullName, username, gender, phone, email, qualification, designation, initialPassword, assignedSections } = data;

    if (!fullName || !username) {
      return NextResponse.json({ error: 'Full name and username are required' }, { status: 400 });
    }

    const db = getDb();
    const tempPassword = initialPassword || 'madrassa123';
    const passwordHash = await hashPassword(tempPassword);

    const uRes = await db.execute({
      sql: 'INSERT INTO users (username, password_hash, role, full_name, email, phone) VALUES (?, ?, ?, ?, ?, ?)',
      args: [username.trim(), passwordHash, 'STAFF', fullName.trim(), email || null, phone || null]
    });
    const uId = Number(uRes.lastInsertRowid);

    const staffCount = await db.execute('SELECT COUNT(*) as c FROM teachers');
    const staffId = \`STAFF-00\${Number(staffCount.rows[0].c) + 1}\`;

    const tRes = await db.execute({
      sql: 'INSERT INTO teachers (user_id, staff_id, full_name, gender, phone, email, qualification, designation, joining_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, date("now"))',
      args: [uId, staffId, fullName.trim(), gender || 'Male', phone || null, email || null, qualification || null, designation || 'Teacher']
    });
    const teacherId = Number(tRes.lastInsertRowid);

    // Save assignments if any
    if (Array.isArray(assignedSections)) {
      for (const a of assignedSections) {
        if (a.sectionId && a.subjectId) {
          await db.execute({
            sql: 'INSERT OR IGNORE INTO teacher_assignments (teacher_id, section_id, subject_id) VALUES (?, ?, ?)',
            args: [teacherId, Number(a.sectionId), Number(a.subjectId)]
          });
        }
      }
    }

    await logAudit({
      user: auth.user,
      action: 'TEACHER_CREATED',
      module: 'Faculty',
      targetId: String(teacherId),
      newValue: { fullName, staffId, username }
    });

    return NextResponse.json({
      success: true,
      message: 'Teacher added successfully',
      teacherId,
      staffId
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create teacher' }, { status: 500 });
  }
}
`);

console.log('Admission, students, classes, and teachers APIs created!');
