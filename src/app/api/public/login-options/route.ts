import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();

    // 1. Fetch Authorized Office Members (Admin and Sadr)
    const officeRes = await db.execute(`
      SELECT id, username, full_name, role, avatar_url
      FROM users
      WHERE role IN ('SUPER_ADMIN', 'OFFICE_ADMIN', 'SADR') AND is_active = 1
      ORDER BY 
        CASE 
          WHEN username = 'admin' THEN 1 
          WHEN role = 'SADR' OR username = 'sadr' THEN 2 
          ELSE 3 
        END ASC
    `);

    const officeMembers = officeRes.rows.map((u: any) => {
      const isSadr = u.role === 'SADR' || u.username === 'sadr';
      const isAdmin = u.username === 'admin' || u.role === 'SUPER_ADMIN';
      return {
        id: Number(u.id),
        username: String(u.username),
        label: isSadr ? 'Sadr — V. K. Jabir Baqavi' : (isAdmin ? 'Admin' : String(u.full_name)),
        full_name: isSadr ? 'V. K. Jabir Baqavi' : String(u.full_name),
        role: String(u.role),
        designation: isSadr ? 'Sadr / Principal Usthad' : (isAdmin ? 'Head Administrator' : 'Office Staff'),
        photo_url: isSadr ? '/uploads/principal/sadr_jabir_baqavi_nobg.png' : (u.avatar_url || null),
        is_sadr: isSadr,
      };
    });

    // 2. Fetch Active Staff Members (INCLUDING Sadr as an eligible login option)
    const staffRes = await db.execute(`
      SELECT 
        t.id, 
        t.full_name, 
        COALESCE(t.designation, 'Usthad') as designation, 
        t.qualification, 
        t.phone, 
        t.photo_url, 
        t.assigned_classes, 
        CASE WHEN t.id = 28 OR t.full_name LIKE '%Jabir Baqavi%' THEN 'sadr' ELSE u.username END as username,
        CASE WHEN t.id = 28 OR t.full_name LIKE '%Jabir Baqavi%' THEN 1 ELSE 0 END as is_sadr
      FROM teachers t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.is_active = 1
      ORDER BY 
        CASE WHEN t.id = 28 OR t.full_name LIKE '%Jabir Baqavi%' THEN 2 ELSE 1 END,
        t.id ASC
    `);

    const staffMembers = staffRes.rows.map((t: any) => {
      const isSadr = Boolean(t.is_sadr);
      return {
        id: Number(t.id),
        username: String(t.username),
        label: isSadr ? 'V. K. Jabir Baqavi (Sadr)' : String(t.full_name),
        full_name: String(t.full_name),
        designation: isSadr ? 'Sadr / Principal Usthad' : String(t.designation),
        qualification: t.qualification ? String(t.qualification) : '',
        phone: t.phone ? String(t.phone) : '',
        photo_url: isSadr ? '/uploads/principal/sadr_jabir_baqavi_nobg.png' : (t.photo_url || null),
        assigned_classes: isSadr ? '+2 / All Classes (Sadr)' : (t.assigned_classes ? String(t.assigned_classes) : 'Faculty'),
        is_sadr: isSadr
      };
    });

    // 3. Sadr Profile Summary
    const sadrObj = staffMembers.find((s: any) => s.is_sadr) || officeMembers.find((o: any) => o.is_sadr) || null;

    return NextResponse.json({
      success: true,
      officeMembers,
      staffMembers,
      staff: staffMembers,
      sadr: sadrObj
    });
  } catch (error: any) {
    console.error('Error fetching login options:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch login options',
      officeMembers: [],
      staffMembers: [],
      staff: [],
      sadr: null
    }, { status: 500 });
  }
}
