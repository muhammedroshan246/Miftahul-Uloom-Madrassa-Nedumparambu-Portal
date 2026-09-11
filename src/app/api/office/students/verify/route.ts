import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const EXPECTED_COUNTS: Record<string, { total: number; boys: number; girls: number }> = {
  'Class 1': { total: 29, boys: 13, girls: 16 },
  'Class 2': { total: 18, boys: 8, girls: 10 },
  'Class 3': { total: 28, boys: 15, girls: 13 },
  'Class 4': { total: 34, boys: 21, girls: 13 },
  'Class 5': { total: 31, boys: 16, girls: 15 },
  'Class 6': { total: 32, boys: 16, girls: 16 },
  'Class 7': { total: 25, boys: 13, girls: 12 },
  'Class 8': { total: 32, boys: 15, girls: 17 },
  'Class 9': { total: 28, boys: 14, girls: 14 },
  'Class 10': { total: 18, boys: 9, girls: 9 },
  '+1': { total: 12, boys: 5, girls: 7 },
  '+2': { total: 16, boys: 4, girls: 12 },
};

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN', 'STAFF']);
  if ('status' in auth) return auth;

  try {
    const db = getDb();

    // 1. Overall counts
    const totalStudentsRes = await db.execute("SELECT COUNT(*) as c FROM students WHERE status = 'Active'");
    const totalBoysRes = await db.execute("SELECT COUNT(*) as c FROM students WHERE status = 'Active' AND gender = 'Boys'");
    const totalGirlsRes = await db.execute("SELECT COUNT(*) as c FROM students WHERE status = 'Active' AND gender = 'Girls'");

    const totalStudents = Number(totalStudentsRes.rows[0]?.c || 0);
    const totalBoys = Number(totalBoysRes.rows[0]?.c || 0);
    const totalGirls = Number(totalGirlsRes.rows[0]?.c || 0);

    // 2. Class-by-class audit
    const classRowsRes = await db.execute(`
      SELECT 
        c.id as class_id,
        c.name as class_name,
        c.numeric_order,
        COUNT(s.id) as actual_total,
        SUM(CASE WHEN s.gender = 'Boys' THEN 1 ELSE 0 END) as actual_boys,
        SUM(CASE WHEN s.gender = 'Girls' THEN 1 ELSE 0 END) as actual_girls
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id AND s.status = 'Active'
      GROUP BY c.id, c.name, c.numeric_order
      ORDER BY c.numeric_order ASC
    `);

    let allMatched = (totalStudents === 303 && totalBoys === 149 && totalGirls === 154);

    const classAudit = classRowsRes.rows.map((row: any) => {
      const className = String(row.class_name);
      const expected = EXPECTED_COUNTS[className] || { total: 0, boys: 0, girls: 0 };
      const actualTotal = Number(row.actual_total || 0);
      const actualBoys = Number(row.actual_boys || 0);
      const actualGirls = Number(row.actual_girls || 0);

      const totalMatches = actualTotal === expected.total;
      const boysMatches = actualBoys === expected.boys;
      const girlsMatches = actualGirls === expected.girls;
      const classMatched = totalMatches && boysMatches && girlsMatches;

      if (!classMatched) allMatched = false;

      return {
        classId: row.class_id,
        className,
        numericOrder: row.numeric_order,
        expected,
        actual: {
          total: actualTotal,
          boys: actualBoys,
          girls: actualGirls
        },
        matched: classMatched,
        discrepancies: {
          totalDiff: actualTotal - expected.total,
          boysDiff: actualBoys - expected.boys,
          girlsDiff: actualGirls - expected.girls
        }
      };
    });

    // 3. Complete Student Roster for instant client filtering
    const allStudentsRes = await db.execute(`
      SELECT 
        s.id,
        s.admission_no,
        s.roll_no,
        s.full_name,
        s.gender,
        s.class_id,
        s.section_id,
        s.status,
        c.name as class_name,
        sec.name as section_name,
        u.username
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN sections sec ON s.section_id = sec.id
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'Active'
      ORDER BY c.numeric_order ASC, s.gender ASC, s.roll_no ASC
    `);

    return NextResponse.json({
      summary: {
        totalStudents,
        expectedTotal: 303,
        totalBoys,
        expectedBoys: 149,
        totalGirls,
        expectedGirls: 154,
        totalClasses: classAudit.length,
        isReconciled: allMatched
      },
      classAudit,
      students: allStudentsRes.rows
    });
  } catch (error: any) {
    console.error('Students verification API error:', error);
    return NextResponse.json({ error: 'Failed to verify student records' }, { status: 500 });
  }
}
