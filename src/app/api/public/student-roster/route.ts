import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');
    const search = searchParams.get('search');

    const db = getDb();

    // If sectionId is provided, return all active students in that section
    if (sectionId) {
      let sql = `
        SELECT 
          s.id, s.admission_no, s.roll_no, s.full_name, s.gender, s.photo_url,
          c.id as class_id, c.name as class_name, c.numeric_order,
          sec.id as section_id, sec.name as section_name, sec.gender as wing
        FROM students s
        JOIN classes c ON s.class_id = c.id
        JOIN sections sec ON s.section_id = sec.id
        WHERE s.section_id = ? AND COALESCE(s.status, 'Active') = 'Active'
      `;
      const args: any[] = [Number(sectionId)];

      if (search) {
        sql += ` AND (s.full_name LIKE ? OR s.roll_no = ? OR s.admission_no LIKE ?)`;
        const q = `%${search.trim()}%`;
        const rollNum = isNaN(Number(search.trim())) ? -1 : Number(search.trim());
        args.push(q, rollNum, q);
      }

      sql += ' ORDER BY s.roll_no ASC';

      const res = await db.execute({ sql, args });

      return NextResponse.json({
        sectionId: Number(sectionId),
        totalStudents: res.rows.length,
        students: res.rows
      });
    }

    // If only classId is provided, return sections for that class with counts
    if (classId) {
      const sectionsRes = await db.execute({
        sql: `
          SELECT 
            sec.id as section_id, sec.name as section_name, sec.gender as wing,
            c.id as class_id, c.name as class_name,
            COUNT(s.id) as student_count
          FROM sections sec
          JOIN classes c ON sec.class_id = c.id
          LEFT JOIN students s ON s.section_id = sec.id AND COALESCE(s.status, 'Active') = 'Active'
          WHERE sec.class_id = ?
          GROUP BY sec.id
          ORDER BY sec.name ASC
        `,
        args: [Number(classId)]
      });

      return NextResponse.json({
        classId: Number(classId),
        sections: sectionsRes.rows
      });
    }

    // Default: Return all 12 classes with their total active student counts & section breakdown
    const classesRes = await db.execute(`
      SELECT 
        c.id, c.name, c.numeric_order,
        COUNT(s.id) as total_students,
        SUM(CASE WHEN s.gender = 'Boys' THEN 1 ELSE 0 END) as boys_count,
        SUM(CASE WHEN s.gender = 'Girls' THEN 1 ELSE 0 END) as girls_count
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id AND COALESCE(s.status, 'Active') = 'Active'
      GROUP BY c.id
      ORDER BY c.numeric_order ASC
    `);

    const sectionsRes = await db.execute(`
      SELECT 
        sec.id as section_id, sec.class_id, sec.name as section_name, sec.gender as wing,
        COUNT(s.id) as student_count
      FROM sections sec
      LEFT JOIN students s ON s.section_id = sec.id AND COALESCE(s.status, 'Active') = 'Active'
      GROUP BY sec.id
      ORDER BY sec.class_id ASC, sec.name ASC
    `);

    return NextResponse.json({
      classes: classesRes.rows,
      sections: sectionsRes.rows
    });
  } catch (error: any) {
    console.error('Student roster API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch student roster' }, { status: 500 });
  }
}
