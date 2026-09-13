import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();

    // 1. Fetch Sadr Usthad details
    const sadrRes = await db.execute(`
      SELECT 
        t.id as teacher_id, 
        t.full_name, 
        COALESCE(t.designation, 'Sadr / Principal Usthad') as designation, 
        t.qualification, 
        t.phone, 
        COALESCE(t.photo_url, '/uploads/principal/sadr_jabir_baqavi_nobg.png') as photo_url, 
        t.assigned_classes, 
        'sadr' as username
      FROM teachers t
      WHERE t.id = 28 OR t.full_name LIKE '%Jabir Baqavi%'
      LIMIT 1
    `);

    const sadr = sadrRes.rows.length > 0 ? sadrRes.rows[0] : {
      teacher_id: 28,
      full_name: 'V. K. Jabir Baqavi',
      designation: 'Sadr / Principal Usthad',
      qualification: 'Baqavi / Senior Islamic Scholar',
      phone: '9544182665',
      photo_url: '/uploads/principal/sadr_jabir_baqavi_nobg.png',
      assigned_classes: '+2',
      username: 'sadr'
    };

    // 2. Fetch Active Staff / Usthads (excluding Sadr and office/admin accounts)
    const staffRes = await db.execute(`
      SELECT 
        t.id, 
        t.full_name, 
        COALESCE(t.designation, 'Usthad') as designation, 
        t.qualification, 
        t.phone, 
        t.photo_url, 
        t.assigned_classes, 
        u.username
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE t.is_active = 1 
        AND t.id != 28 
        AND u.username NOT IN ('sadr', 'admin', 'office', 'jabir.baqavi')
      ORDER BY t.id ASC
    `);

    return NextResponse.json({
      success: true,
      sadr,
      staff: staffRes.rows
    });
  } catch (error: any) {
    console.error('Error fetching login options:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch login options',
      sadr: null,
      staff: []
    }, { status: 500 });
  }
}
