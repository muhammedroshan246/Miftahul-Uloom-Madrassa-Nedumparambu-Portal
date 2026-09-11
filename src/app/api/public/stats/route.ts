
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    
    // Total Students
    const totalStudentsRes = await db.execute("SELECT COUNT(*) as c FROM students WHERE status = 'Active'");
    const totalStudents = Number(totalStudentsRes.rows[0]?.c || 0);

    // Boys Count
    const boysRes = await db.execute("SELECT COUNT(*) as c FROM students WHERE gender = 'Boys' AND status = 'Active'");
    const totalBoys = Number(boysRes.rows[0]?.c || 0);

    // Girls Count
    const girlsRes = await db.execute("SELECT COUNT(*) as c FROM students WHERE gender = 'Girls' AND status = 'Active'");
    const totalGirls = Number(girlsRes.rows[0]?.c || 0);

    // Total Teachers
    const teachersRes = await db.execute("SELECT COUNT(*) as c FROM teachers WHERE is_active = 1");
    const totalTeachers = Number(teachersRes.rows[0]?.c || 0);

    // Total Staff (including teachers and office)
    const staffRes = await db.execute("SELECT COUNT(*) as c FROM users WHERE role IN ('STAFF', 'OFFICE_ADMIN', 'SUPER_ADMIN') AND is_active = 1");
    const totalStaff = Number(staffRes.rows[0]?.c || 0);

    // Total Classes
    const classesRes = await db.execute("SELECT COUNT(*) as c FROM classes");
    const totalClasses = Number(classesRes.rows[0]?.c || 0);

    // Total Sections
    const sectionsRes = await db.execute("SELECT COUNT(*) as c FROM sections");
    const totalSections = Number(sectionsRes.rows[0]?.c || 0);

    return NextResponse.json({
      totalStudents,
      totalBoys,
      totalGirls,
      totalTeachers,
      totalStaff,
      totalClasses,
      totalSections,
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Stats query error:', error);
    return NextResponse.json({ error: 'Failed to fetch public statistics' }, { status: 500 });
  }
}
