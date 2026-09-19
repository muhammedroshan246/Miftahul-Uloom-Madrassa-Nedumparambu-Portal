import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth, hashPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { generateSecure6DigitPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get('teacherId');

    const db = getDb();

    if (teacherId) {
      const tRes = await db.execute({
        sql: `
          SELECT t.*, u.username, u.is_active as user_active
          FROM teachers t
          JOIN users u ON t.user_id = u.id
          WHERE t.id = ?
        `,
        args: [Number(teacherId)]
      });

      if (tRes.rows.length === 0) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      const teacher = tRes.rows[0];

      const ctRes = await db.execute({
        sql: 'SELECT sec.id, sec.name as section_name, c.name as class_name FROM sections sec JOIN classes c ON sec.class_id = c.id WHERE sec.class_teacher_id = ?',
        args: [Number(teacherId)]
      });

      const assRes = await db.execute({
        sql: `
          SELECT ta.*, c.name as class_name, sec.name as section_name, sub.name as subject_name
          FROM teacher_assignments ta
          JOIN sections sec ON ta.section_id = sec.id
          JOIN classes c ON sec.class_id = c.id
          JOIN subjects sub ON ta.subject_id = sub.id
          WHERE ta.teacher_id = ?
        `,
        args: [Number(teacherId)]
      });

      const salRes = await db.execute({
        sql: 'SELECT * FROM salaries WHERE teacher_id = ? ORDER BY id DESC',
        args: [Number(teacherId)]
      });

      return NextResponse.json({
        teacher,
        classTeacherOf: ctRes.rows,
        assignments: assRes.rows,
        salaryHistory: salRes.rows
      });
    }

    const tRes = await db.execute(`
      SELECT t.*, u.username, u.is_active as user_active,
             c1.name as assigned_class_name_1, sec1.name as assigned_wing_1,
             c2.name as assigned_class_name_2, sec2.name as assigned_wing_2,
             (SELECT COUNT(*) FROM teacher_assignments WHERE teacher_id = t.id) as assigned_subjects_count,
             (SELECT COUNT(*) FROM sections WHERE class_teacher_id = t.id) as is_class_teacher_count
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN classes c1 ON c1.id = t.assigned_class_id
      LEFT JOIN sections sec1 ON sec1.id = t.assigned_section_id
      LEFT JOIN classes c2 ON c2.id = t.assigned_class_id_2
      LEFT JOIN sections sec2 ON sec2.id = t.assigned_section_id_2
      ORDER BY t.staff_id ASC
    `);

    const assignmentsRes = await db.execute(`
      SELECT ta.*, t.full_name as teacher_name, c.name as class_name, sec.name as section_name, sub.name as subject_name
      FROM teacher_assignments ta
      JOIN teachers t ON ta.teacher_id = t.id
      JOIN sections sec ON ta.section_id = sec.id
      JOIN classes c ON sec.class_id = c.id
      JOIN subjects sub ON ta.subject_id = sub.id
    `);

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
    const { 
      action, 
      classTeacherAssignment, 
      fullName, 
      username, 
      gender, 
      phone, 
      email, 
      qualification, 
      designation, 
      initialPassword, 
      assignedClasses, 
      showPhonePublicly,
      photoUrl 
    } = data;
    
    const db = getDb();

    // 1. Class Teacher Assignment Action
    if (action === 'assign_class_teacher') {
      const { sectionId, teacherId } = classTeacherAssignment || {};
      if (!sectionId) return NextResponse.json({ error: 'Section ID required' }, { status: 400 });

      await db.execute({
        sql: 'UPDATE sections SET class_teacher_id = ? WHERE id = ?',
        args: [teacherId ? Number(teacherId) : null, Number(sectionId)]
      });

      await logAudit({
        user: auth.user,
        action: 'CLASS_TEACHER_ASSIGNED',
        module: 'Faculty',
        targetId: `Section:${sectionId}`,
        newValue: { sectionId, teacherId }
      });

      return NextResponse.json({ success: true, message: 'Class Teacher assigned successfully' });
    }

    // 2. Add New Teacher
    if (!fullName || !username) {
      return NextResponse.json({ error: 'Full name and username are required' }, { status: 400 });
    }

    // Check duplicate username
    const safeUsername = username.trim().toLowerCase();
    const dupUser = await db.execute({
      sql: 'SELECT id FROM users WHERE username = ?',
      args: [safeUsername]
    });
    if (dupUser.rows.length > 0) {
      return NextResponse.json({ error: `Username '${safeUsername}' is already taken. Please choose another.` }, { status: 400 });
    }

    // Generate unique 6-digit numeric password
    const plain6DigitPass = initialPassword && /^\d{6}$/.test(initialPassword) 
      ? initialPassword 
      : generateSecure6DigitPassword();
    const passwordHash = await hashPassword(plain6DigitPass);

    // Insert user account
    const uRes = await db.execute({
      sql: 'INSERT INTO users (username, password_hash, role, full_name, email, phone, avatar_url, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
      args: [safeUsername, passwordHash, 'STAFF', fullName.trim(), email || null, phone || null, photoUrl || null]
    });
    const uId = Number(uRes.lastInsertRowid);

    const staffCount = await db.execute('SELECT COUNT(*) as c FROM teachers');
    const staffId = `TCH-00${Number(staffCount.rows[0].c) + 1}`;

    const tRes = await db.execute({
      sql: 'INSERT INTO teachers (user_id, staff_id, full_name, gender, phone, email, qualification, designation, photo_url, assigned_classes, show_phone_publicly, joining_date, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE, 1)',
      args: [
        uId, 
        staffId, 
        fullName.trim(), 
        gender || 'Male', 
        phone || null, 
        email || null, 
        qualification || null, 
        designation || 'Usthad', 
        photoUrl || null,
        assignedClasses || null,
        showPhonePublicly ? 1 : 0
      ]
    });
    const teacherId = Number(tRes.lastInsertRowid);

    // Baseline salary voucher
    const ayRes = await db.execute('SELECT id FROM academic_years WHERE is_current = 1 LIMIT 1');
    const academicYearId = Number(ayRes.rows[0]?.id || 3);
    await db.execute({
      sql: `
        INSERT OR IGNORE INTO salaries 
        (teacher_id, academic_year_id, month, basic_salary, allowance, deduction, net_salary, status, notes)
        VALUES (?, ?, 'September 2026', 18000, 1500, 0, 19500, 'Pending', 'Initial payroll record')
      `,
      args: [teacherId, academicYearId]
    });

    await logAudit({
      user: auth.user,
      action: 'TEACHER_CREATED',
      module: 'Faculty',
      targetId: String(teacherId),
      newValue: { fullName, staffId, username: safeUsername, assignedClasses }
    });

    return NextResponse.json({
      success: true,
      message: 'Teacher created successfully with secure 6-digit credentials',
      teacher: { 
        id: teacherId, 
        staffId, 
        fullName: fullName.trim(), 
        username: safeUsername,
        plainPassword: plain6DigitPass,
        assignedClasses,
        phone
      }
    });
  } catch (error: any) {
    console.error('Teacher create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const data = await req.json();
    const { 
      id, 
      action,
      fullName, 
      gender, 
      phone, 
      email, 
      qualification, 
      designation, 
      assignedClasses,
      showPhonePublicly,
      photoUrl, 
      resetPassword,
      customPassword, 
      isActive 
    } = data;
    
    if (!id) return NextResponse.json({ error: 'Teacher ID required' }, { status: 400 });

    const db = getDb();
    const oldRes = await db.execute({
      sql: 'SELECT t.*, u.username FROM teachers t JOIN users u ON t.user_id = u.id WHERE t.id = ?',
      args: [Number(id)]
    });
    if (oldRes.rows.length === 0) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    const old = oldRes.rows[0];

    // 1. Explicit 6-digit password reset
    if (action === 'reset_password' || resetPassword) {
      const new6DigitPass = customPassword && /^\d{6}$/.test(customPassword)
        ? customPassword
        : generateSecure6DigitPassword();
      const newHash = await hashPassword(new6DigitPass);

      await db.execute({
        sql: 'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        args: [newHash, Number(old.user_id)]
      });

      await logAudit({
        user: auth.user,
        action: 'TEACHER_PASSWORD_RESET',
        module: 'Faculty',
        targetId: String(id),
        newValue: { teacherName: old.full_name, username: old.username, action: 'Reset 6-digit password' }
      });

      return NextResponse.json({
        success: true,
        message: '6-digit password reset successfully. Old password immediately invalidated.',
        newPassword: new6DigitPass,
        teacher: {
          id: old.id,
          staffId: old.staff_id,
          fullName: old.full_name,
          username: old.username,
          plainPassword: new6DigitPass
        }
      });
    }

    // 2. Regular Teacher Update
    await db.execute({
      sql: `
        UPDATE teachers 
        SET full_name = COALESCE(?, full_name),
            gender = COALESCE(?, gender),
            phone = COALESCE(?, phone),
            email = COALESCE(?, email),
            qualification = COALESCE(?, qualification),
            designation = COALESCE(?, designation),
            assigned_classes = COALESCE(?, assigned_classes),
            show_phone_publicly = COALESCE(?, show_phone_publicly),
            photo_url = COALESCE(?, photo_url),
            is_active = COALESCE(?, is_active)
        WHERE id = ?
      `,
      args: [
        fullName ? fullName.trim() : null,
        gender || null,
        phone || null,
        email || null,
        qualification || null,
        designation || null,
        assignedClasses !== undefined ? assignedClasses : null,
        showPhonePublicly !== undefined ? (showPhonePublicly ? 1 : 0) : null,
        photoUrl || null,
        isActive !== undefined ? (isActive ? 1 : 0) : null,
        Number(id)
      ]
    });

    // 2. Class Assignments Update (Max 2 classes per teacher)
    const { assignment1, assignment2, class1Id: directClass1Id, class2Id: directClass2Id } = data;
    if (assignment1 !== undefined || directClass1Id !== undefined || directClass2Id !== undefined) {
      let class1Id: number | null = null;
      if (directClass1Id !== undefined) {
        class1Id = directClass1Id && directClass1Id !== 'None' ? Number(directClass1Id) : null;
      } else if (assignment1 && assignment1.classId) {
        class1Id = Number(assignment1.classId);
      }

      let class2Id: number | null = null;
      if (directClass2Id !== undefined) {
        class2Id = directClass2Id && directClass2Id !== 'None' ? Number(directClass2Id) : null;
      } else if (assignment2 && assignment2.classId) {
        class2Id = Number(assignment2.classId);
      }

      if (class1Id && class2Id && class1Id === class2Id) {
        class2Id = null;
      }

      // Fetch class names for display text
      let displayAssignedClasses = '';
      if (class1Id) {
        const c1 = await db.execute({ sql: 'SELECT name FROM classes WHERE id = ?', args: [class1Id] });
        displayAssignedClasses += c1.rows[0]?.name || `Class ${class1Id}`;
      }
      if (class2Id) {
        const c2 = await db.execute({ sql: 'SELECT name FROM classes WHERE id = ?', args: [class2Id] });
        if (displayAssignedClasses) displayAssignedClasses += ', ';
        displayAssignedClasses += c2.rows[0]?.name || `Class ${class2Id}`;
      }

      await db.execute({
        sql: `
          UPDATE teachers
          SET assigned_class_id = ?, assigned_class_id_2 = ?,
              assigned_classes = COALESCE(NULLIF(?, ''), assigned_classes)
          WHERE id = ?
        `,
        args: [class1Id, class2Id, displayAssignedClasses, Number(id)]
      });

      // Synchronize staff_permissions: all sections of assigned classes
      await db.execute({ sql: 'DELETE FROM staff_permissions WHERE teacher_id = ?', args: [Number(id)] });

      const assignedClassIds = [class1Id, class2Id].filter(Boolean) as number[];
      const newSecs: number[] = [];

      if (assignedClassIds.length > 0) {
        const cPlaceholders = assignedClassIds.map(() => '?').join(',');
        const secRes = await db.execute({
          sql: `SELECT id FROM sections WHERE class_id IN (${cPlaceholders})`,
          args: assignedClassIds
        });
        for (const r of secRes.rows) {
          newSecs.push(Number(r.id));
        }
      }

      for (const sId of newSecs) {
        await db.execute({
          sql: `
            INSERT INTO staff_permissions 
            (teacher_id, section_id, is_class_teacher, can_manage_attendance, can_manage_marks, can_manage_fees)
            VALUES (?, ?, 1, 1, 1, 1)
          `,
          args: [Number(id), sId]
        });
      }

      // Update sections.class_teacher_id
      if (newSecs.length > 0) {
        const secInPlaceholders = newSecs.map(() => '?').join(',');
        await db.execute({
          sql: `UPDATE sections SET class_teacher_id = NULL WHERE class_teacher_id = ? AND id NOT IN (${secInPlaceholders})`,
          args: [Number(id), ...newSecs]
        });
        for (const sId of newSecs) {
          await db.execute({
            sql: 'UPDATE sections SET class_teacher_id = ? WHERE id = ?',
            args: [Number(id), sId]
          });
        }
      } else {
        await db.execute({
          sql: 'UPDATE sections SET class_teacher_id = NULL WHERE class_teacher_id = ?',
          args: [Number(id)]
        });
      }
    }

    if (fullName || phone || email || isActive !== undefined) {
      await db.execute({
        sql: `
          UPDATE users 
          SET full_name = COALESCE(?, full_name),
              phone = COALESCE(?, phone),
              email = COALESCE(?, email),
              is_active = COALESCE(?, is_active)
          WHERE id = ?
        `,
        args: [
          fullName ? fullName.trim() : null,
          phone || null,
          email || null,
          isActive !== undefined ? (isActive ? 1 : 0) : null,
          Number(old.user_id)
        ]
      });
    }

    await logAudit({
      user: auth.user,
      action: 'TEACHER_UPDATED',
      module: 'Faculty',
      targetId: String(id),
      previousValue: old,
      newValue: { fullName, phone, designation, assignedClasses, isActive }
    });

    return NextResponse.json({ success: true, message: 'Teacher updated successfully' });
  } catch (error: any) {
    console.error('Teacher update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action') || 'deactivate'; // 'deactivate' | 'restore'
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const db = getDb();
    const tRes = await db.execute({ sql: 'SELECT * FROM teachers WHERE id = ?', args: [Number(id)] });
    if (tRes.rows.length === 0) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    const teacher = tRes.rows[0];

    if (action === 'restore') {
      await db.execute({ sql: 'UPDATE teachers SET is_active = 1 WHERE id = ?', args: [Number(id)] });
      await db.execute({ sql: 'UPDATE users SET is_active = 1 WHERE id = ?', args: [Number(teacher.user_id)] });

      await logAudit({
        user: auth.user,
        action: 'TEACHER_RESTORED',
        module: 'Faculty',
        targetId: String(id),
        newValue: { fullName: teacher.full_name, is_active: 1 }
      });

      return NextResponse.json({ success: true, message: `Teacher ${teacher.full_name} restored to active status` });
    }

    // Default: Deactivate
    await db.execute({ sql: 'UPDATE teachers SET is_active = 0 WHERE id = ?', args: [Number(id)] });
    await db.execute({ sql: 'UPDATE users SET is_active = 0 WHERE id = ?', args: [Number(teacher.user_id)] });

    await logAudit({
      user: auth.user,
      action: 'TEACHER_DEACTIVATED',
      module: 'Faculty',
      targetId: String(id),
      previousValue: { is_active: 1 },
      newValue: { fullName: teacher.full_name, is_active: 0 }
    });

    return NextResponse.json({ success: true, message: `Teacher ${teacher.full_name} deactivated successfully` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
