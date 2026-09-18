import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    let sectionId = searchParams.get('sectionId');
    const classId = searchParams.get('classId');
    const className = searchParams.get('className');
    const gender = searchParams.get('gender') || searchParams.get('section');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const view = searchParams.get('view');
    const month = searchParams.get('month') || date.substring(0, 7);
    const studentId = searchParams.get('studentId');

    const db = getDb();

    // ==========================================
    // 1. STUDENT / PARENT VIEW-ONLY ATTENDANCE
    // ==========================================
    if (auth.user.role === 'STUDENT' || studentId) {
      const targetStudentId = auth.user.role === 'STUDENT' ? auth.user.student_id : Number(studentId);
      
      const sInfoRes = await db.execute({
        sql: `
          SELECT s.id, s.full_name, s.admission_no, s.roll_no, s.gender, s.section_id,
                 c.name as class_name, sec.name as section_name
          FROM students s
          JOIN classes c ON s.class_id = c.id
          JOIN sections sec ON s.section_id = sec.id
          WHERE s.id = ?
        `,
        args: [targetStudentId]
      });

      if (sInfoRes.rows.length === 0) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      if (auth.user.role === 'STAFF') {
        const permCheck = await db.execute({
          sql: 'SELECT 1 FROM staff_permissions WHERE teacher_id = ? AND section_id = ? AND can_manage_attendance = 1',
          args: [auth.user.teacher_id, Number(sInfoRes.rows[0].section_id)]
        });
        if (permCheck.rows.length === 0) {
          return NextResponse.json({ error: 'Access denied: You are only authorized to view attendance for your assigned class section' }, { status: 403 });
        }
      }
      const studentInfo = sInfoRes.rows[0];

      const attRes = await db.execute({
        sql: `
          SELECT a.date, a.status, a.remarks,
                 strftime('%w', a.date) as day_of_week
          FROM attendance a
          WHERE a.student_id = ? AND strftime('%Y-%m', a.date) = ?
          ORDER BY a.date ASC
        `,
        args: [targetStudentId, month]
      });

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dailyRecords = attRes.rows.map((r: any) => ({
        date: r.date,
        dayName: dayNames[Number(r.day_of_week)] || '',
        status: r.status,
        remarks: r.remarks
      }));

      const totalWorkingDays = attRes.rows.length;
      const presentCount = attRes.rows.filter((r: any) => r.status === 'Present').length;
      const absentCount = attRes.rows.filter((r: any) => r.status === 'Absent').length;
      const lateCount = attRes.rows.filter((r: any) => r.status === 'Late').length;
      const percentage = totalWorkingDays > 0 ? ((presentCount / totalWorkingDays) * 100).toFixed(1) : '100.0';

      return NextResponse.json({
        student: studentInfo,
        month,
        totalWorkingDays,
        presentCount,
        absentCount,
        lateCount,
        percentage,
        records: dailyRecords
      });
    }

    // ==========================================
    // 2. RESOLVE SECTION ID IF CLASS + GENDER GIVEN
    // ==========================================
    if (!sectionId && (classId || className) && gender) {
      let secRes;
      if (classId) {
        secRes = await db.execute({
          sql: 'SELECT id FROM sections WHERE class_id = ? AND (LOWER(name) = LOWER(?) OR LOWER(gender) = LOWER(?)) LIMIT 1',
          args: [Number(classId), gender, gender]
        });
      } else if (className) {
        secRes = await db.execute({
          sql: `
            SELECT s.id FROM sections s
            JOIN classes c ON s.class_id = c.id
            WHERE LOWER(c.name) = LOWER(?) AND (LOWER(s.name) = LOWER(?) OR LOWER(s.gender) = LOWER(?))
            LIMIT 1
          `,
          args: [className, gender, gender]
        });
      }
      if (secRes && secRes.rows.length > 0) {
        sectionId = String(secRes.rows[0].id);
      }
    }

    // ==========================================
    // 3. TEACHER SECTION AUTHORIZATION CHECK
    // ==========================================
    if (auth.user.role === 'STAFF') {
      const teacherId = auth.user.teacher_id;
      if (!teacherId) {
        return NextResponse.json({ error: 'Access denied: No staff profile linked' }, { status: 403 });
      }

      // Fetch teacher's permitted sections for attendance
      const permRes = await db.execute({
        sql: `
          SELECT section_id FROM staff_permissions 
          WHERE teacher_id = ? AND can_manage_attendance = 1
        `,
        args: [teacherId]
      });
      const allowedSectionIds = permRes.rows.map((r: any) => Number(r.section_id));

      if (allowedSectionIds.length === 0) {
        return NextResponse.json({ 
          error: 'Access denied: You are not assigned as a Class Teacher with attendance permissions',
          students: [],
          totalStudents: 0
        }, { status: 403 });
      }

      // If no sectionId specified, default to first authorized section
      if (!sectionId) {
        sectionId = String(allowedSectionIds[0]);
      } else if (!allowedSectionIds.includes(Number(sectionId))) {
        return NextResponse.json({ 
          error: 'Access denied: You are only authorized to manage attendance for your assigned class section' 
        }, { status: 403 });
      }
    }

    // If still no sectionId and user is Office Admin, return overall matrix
    if (!sectionId) {
      const overallRes = await db.execute({
        sql: `
          SELECT 
            COUNT(*) as total_marked,
            SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_count,
            SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
            SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) as late_count
          FROM attendance a
          WHERE a.date = ?
        `,
        args: [date]
      });

      const sectionSummaries = await db.execute({
        sql: `
          SELECT 
            sec.id as section_id, sec.name as section_name, c.name as class_name, c.numeric_order,
            t.full_name as teacher_name,
            (SELECT COUNT(*) FROM students WHERE section_id = sec.id AND COALESCE(status, 'Active') = 'Active') as total_students,
            SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_count,
            SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
            SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) as late_count
          FROM sections sec
          JOIN classes c ON sec.class_id = c.id
          LEFT JOIN teachers t ON sec.class_teacher_id = t.id
          LEFT JOIN attendance a ON a.section_id = sec.id AND a.date = ?
          GROUP BY sec.id
          ORDER BY c.numeric_order ASC, sec.name ASC
        `,
        args: [date]
      });

      return NextResponse.json({
        date,
        overall: overallRes.rows[0] || {},
        sections: sectionSummaries.rows
      });
    }

    // Section Metadata
    const secMeta = await db.execute({
      sql: `
        SELECT sec.id, sec.name as section_name, c.name as class_name, c.id as class_id, t.full_name as teacher_name
        FROM sections sec
        JOIN classes c ON sec.class_id = c.id
        LEFT JOIN teachers t ON sec.class_teacher_id = t.id
        WHERE sec.id = ?
      `,
      args: [Number(sectionId)]
    });
    const meta = secMeta.rows[0] || {};

    // Monthly View
    if (view === 'monthly') {
      const [yearStr, monthStr] = month.split('-');
      const yearNum = Number(yearStr);
      const monthNum = Number(monthStr);
      const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

      const stRes = await db.execute({
        sql: `
          SELECT id as student_id, admission_no, roll_no, full_name, gender, photo_url
          FROM students
          WHERE section_id = ? AND COALESCE(status, 'Active') = 'Active'
          ORDER BY roll_no ASC
        `,
        args: [Number(sectionId)]
      });

      const monthAttRes = await db.execute({
        sql: `
          SELECT student_id, date, status, strftime('%d', date) as day_num
          FROM attendance
          WHERE section_id = ? AND strftime('%Y-%m', date) = ?
        `,
        args: [Number(sectionId), month]
      });

      const attMap: Record<number, Record<number, string>> = {};
      const datesRecordedSet = new Set<string>();

      monthAttRes.rows.forEach((r: any) => {
        const sId = Number(r.student_id);
        const day = Number(r.day_num);
        if (!attMap[sId]) attMap[sId] = {};
        attMap[sId][day] = r.status;
        datesRecordedSet.add(r.date);
      });

      const totalWorkingDays = datesRecordedSet.size;

      const monthlyRoster = stRes.rows.map((s: any) => {
        const sId = Number(s.student_id);
        const studentDays = attMap[sId] || {};
        
        let pCount = 0;
        let aCount = 0;
        let lCount = 0;

        for (let d = 1; d <= daysInMonth; d++) {
          const st = studentDays[d];
          if (st === 'Present') pCount++;
          else if (st === 'Absent') aCount++;
          else if (st === 'Late') lCount++;
        }

        const totalStudentMarked = pCount + aCount + lCount;
        const pct = totalStudentMarked > 0 ? ((pCount / totalStudentMarked) * 100).toFixed(1) : '-';

        return {
          student_id: s.student_id,
          admission_no: s.admission_no,
          roll_no: s.roll_no,
          full_name: s.full_name,
          dailyMap: studentDays,
          presentCount: pCount,
          absentCount: aCount,
          lateCount: lCount,
          percentage: pct
        };
      });

      return NextResponse.json({
        view: 'monthly',
        sectionId: Number(sectionId),
        sectionName: meta.section_name || '',
        className: meta.class_name || '',
        classId: meta.class_id || null,
        teacherName: meta.teacher_name || '',
        month,
        daysInMonth,
        totalWorkingDays,
        students: monthlyRoster
      });
    }

    // Daily View
    const sRes = await db.execute({
      sql: `
        SELECT 
          s.id as student_id, s.admission_no, s.roll_no, s.full_name, s.gender, s.photo_url,
          a.id as attendance_id, COALESCE(a.status, 'Present') as status, a.remarks
        FROM students s
        LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ?
        WHERE s.section_id = ? AND COALESCE(s.status, 'Active') = 'Active'
        ORDER BY s.roll_no ASC
      `,
      args: [date, Number(sectionId)]
    });

    return NextResponse.json({
      view: 'daily',
      sectionId: Number(sectionId),
      sectionName: meta.section_name || '',
      className: meta.class_name || '',
      classId: meta.class_id || null,
      teacherName: meta.teacher_name || '',
      date,
      totalStudents: sRes.rows.length,
      students: sRes.rows
    });
  } catch (error: any) {
    console.error('Attendance GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN', 'STAFF']);
  if ('status' in auth) return auth;

  try {
    const { sectionId, date, records } = await req.json();

    if (!sectionId || !date || !Array.isArray(records)) {
      return NextResponse.json({ error: 'sectionId, date, and records array required' }, { status: 400 });
    }

    const db = getDb();

    // Teacher authorization: ensure assigned to this exact section with attendance permission
    if (auth.user.role === 'STAFF') {
      const teacherId = auth.user.teacher_id;
      const permCheck = await db.execute({
        sql: `
          SELECT 1 FROM staff_permissions 
          WHERE teacher_id = ? AND section_id = ? AND can_manage_attendance = 1
        `,
        args: [teacherId, Number(sectionId)]
      });

      if (permCheck.rows.length === 0) {
        return NextResponse.json({ 
          error: 'Access denied: You are not authorized to edit attendance for this class section' 
        }, { status: 403 });
      }
    }

    for (const r of records) {
      if (!r.student_id || !r.status) continue;

      await db.execute({
        sql: `
          INSERT INTO attendance (student_id, section_id, date, status, remarks, marked_by_user_id, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(student_id, date) DO UPDATE SET
            section_id = excluded.section_id,
            status = excluded.status,
            remarks = excluded.remarks,
            marked_by_user_id = excluded.marked_by_user_id,
            updated_at = CURRENT_TIMESTAMP
        `,
        args: [
          Number(r.student_id),
          Number(sectionId),
          date,
          r.status,
          r.remarks || null,
          auth.user.id
        ]
      });
    }

    await logAudit({
      user: auth.user,
      action: 'ATTENDANCE_MARKED',
      module: 'Attendance',
      targetId: String(sectionId),
      newValue: { date, count: records.length, markedBy: auth.user.full_name }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Attendance for ${records.length} students recorded successfully!` 
    });
  } catch (error: any) {
    console.error('Attendance POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save attendance' }, { status: 500 });
  }
}
