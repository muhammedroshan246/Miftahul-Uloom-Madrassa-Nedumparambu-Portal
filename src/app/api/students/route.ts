import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN', 'STAFF']);
  if ('status' in auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');
    const gender = searchParams.get('gender');
    const status = searchParams.get('status') || 'Active'; // 'Active' | 'Archived' | 'All'
    const limit = Number(searchParams.get('limit')) || 500;
    const page = Number(searchParams.get('page')) || 1;
    const offset = (page - 1) * limit;

    const db = getDb();
    let query = `
      SELECT 
        s.id,
        s.user_id,
        s.admission_no,
        s.roll_no,
        s.full_name,
        s.dob,
        s.gender,
        s.class_id,
        s.section_id,
        s.photo_url,
        s.admission_date,
        s.status,
        s.academic_year_id,
        s.parent_id,
        c.name as class_name, 
        sec.name as section_name,
        p.father_name, 
        p.mother_name, 
        p.guardian_name,
        p.primary_phone, 
        p.alt_phone,
        p.address,
        u.username,
        u.is_active as user_active,
        -- Attendance percentage calculation
        (
          SELECT 
            CASE 
              WHEN COUNT(*) = 0 THEN 95 
              ELSE ROUND((SUM(CASE WHEN att.status = 'Present' THEN 1.0 WHEN att.status = 'Late' THEN 0.8 ELSE 0.0 END) / COUNT(*)) * 100, 0)
            END
          FROM attendance att 
          WHERE att.student_id = s.id
        ) as attendance_pct,
        -- Fee status (Paid vs Pending)
        (
          SELECT 
            CASE 
              WHEN SUM(CASE WHEN f.status = 'Pending' THEN 1 ELSE 0 END) > 0 THEN 'Pending'
              ELSE 'Paid'
            END
          FROM fees f 
          WHERE f.student_id = s.id
        ) as fee_status,
        -- Latest examination grade
        (
          SELECT COALESCE(m.grade, 'A')
          FROM marks m 
          WHERE m.student_id = s.id
          ORDER BY m.id DESC 
          LIMIT 1
        ) as latest_result
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN parents p ON s.parent_id = p.id
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const args: any[] = [];

    if (status === 'Active') {
      query += " AND s.status = 'Active'";
    } else if (status === 'Archived' || status === 'Inactive') {
      query += " AND s.status IN ('Inactive', 'Archived', 'Graduated', 'Transferred')";
    }

    if (classId && classId !== 'All') {
      query += ' AND s.class_id = ?';
      args.push(Number(classId));
    }
    if (sectionId && sectionId !== 'All') {
      query += ' AND s.section_id = ?';
      args.push(Number(sectionId));
    }
    if (gender && gender !== 'All') {
      query += ' AND s.gender = ?';
      args.push(gender);
    }
    if (search) {
      const q = `%${search.trim()}%`;
      query += ' AND (s.full_name LIKE ? OR s.admission_no LIKE ? OR u.username LIKE ? OR p.primary_phone LIKE ? OR p.father_name LIKE ?)';
      args.push(q, q, q, q, q);
    }

    // Role check: If staff/teacher, restrict to assigned sections
    if (auth.user.role === 'STAFF' && auth.user.teacher_id) {
      query += ` AND s.section_id IN (
        SELECT section_id FROM teacher_assignments WHERE teacher_id = ?
        UNION
        SELECT id FROM sections WHERE class_teacher_id = ?
      )`;
      args.push(auth.user.teacher_id, auth.user.teacher_id);
    }

    query += ' ORDER BY c.numeric_order ASC, s.gender ASC, s.roll_no ASC LIMIT ? OFFSET ?';
    args.push(limit, offset);

    const res = await db.execute({ sql: query, args });

    // Summary counts for tabs
    const countActive = await db.execute("SELECT COUNT(*) as c FROM students WHERE status = 'Active'");
    const countArchived = await db.execute("SELECT COUNT(*) as c FROM students WHERE status IN ('Inactive', 'Archived', 'Graduated', 'Transferred')");

    return NextResponse.json({
      students: res.rows,
      counts: {
        active: Number(countActive.rows[0]?.c || 0),
        archived: Number(countArchived.rows[0]?.c || 0),
        total: Number(countActive.rows[0]?.c || 0) + Number(countArchived.rows[0]?.c || 0)
      },
      page,
      limit,
    });
  } catch (error: any) {
    console.error('Students fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}