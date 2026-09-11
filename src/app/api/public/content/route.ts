import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    
    // 1. Settings & Institutional Info
    const settingsRes = await db.execute('SELECT key, value FROM website_settings');
    const settings: Record<string, string> = {};
    for (const row of settingsRes.rows) {
      settings[String(row.key)] = String(row.value);
    }

    const allowPublicPhone = settings.show_staff_phones_publicly === '1' || settings.show_staff_phones_publicly === 'true';

    const institution = {
      name: settings.madrassa_name || 'Mifthahul Uloom Higher Secondary Madrassa',
      range: settings.madrassa_range || 'Vengara',
      rangeNumber: settings.range_number || '50',
      madrassaNumber: settings.madrassa_number || '5090',
      location: settings.madrassa_location || 'Nedumparambu',
      tagline: 'Nedumparambu • Madrassa No. 5090 • Vengara Range — No. 50',
      classTimings: {
        session1: settings.class_timing_session_1 || '6:15 AM – 7:30 AM',
        session2: settings.class_timing_session_2 || '7:30 AM – 9:00 AM'
      }
    };

    const administration = {
      president: {
        name: settings.president_name || 'Alavi Haji',
        role: settings.president_role || 'President',
        phone: allowPublicPhone ? (settings.president_phone || null) : null
      },
      secretary: {
        name: settings.secretary_name || 'Mansoor Thamanchery',
        role: settings.secretary_role || 'Secretary',
        phone: allowPublicPhone ? (settings.secretary_phone || null) : null
      },
      sadr: {
        name: settings.sadr_name || 'V. K. Jabir Baqavi',
        role: settings.sadr_role || 'Sadr / Head of Madrassa',
        class: settings.sadr_class || '+2',
        phone: allowPublicPhone ? (settings.sadr_phone || null) : null,
        photoUrl: settings.sadr_photo_url || settings.principal_photo_url || '/uploads/principal/sadr_jabir_baqavi_nobg.png'
      }
    };

    // 2. Active Teachers for Public Display
    const teachersRes = await db.execute(`
      SELECT 
        id, 
        staff_id, 
        full_name, 
        designation, 
        qualification, 
        photo_url, 
        assigned_classes,
        show_phone_publicly,
        phone
      FROM teachers 
      WHERE is_active = 1 
      ORDER BY id ASC
    `);

    const teachers = teachersRes.rows.map((t: any) => ({
      id: t.id,
      staffId: t.staff_id,
      name: t.full_name,
      designation: t.designation,
      qualification: t.qualification,
      photoUrl: t.photo_url,
      assignedClasses: t.assigned_classes || 'Primary & Secondary',
      phone: (allowPublicPhone || t.show_phone_publicly === 1) ? t.phone : null
    }));

    // 3. Announcements
    const annRes = await db.execute(`
      SELECT * FROM announcements 
      WHERE is_published = 1 
      ORDER BY published_at DESC LIMIT 6
    `);

    // 4. Events
    const eventsRes = await db.execute(`
      SELECT * FROM events 
      WHERE is_published = 1 
      ORDER BY event_date ASC LIMIT 6
    `);

    // 5. Gallery
    const galleryRes = await db.execute(`
      SELECT * FROM gallery 
      ORDER BY created_at DESC LIMIT 12
    `);

    // 6. Achievements
    const achRes = await db.execute(`
      SELECT a.*, s.full_name as student_name, c.name as class_name, s.gender
      FROM achievements a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      ORDER BY a.date DESC LIMIT 6
    `);

    // 7. Classes & Counts
    const classRes = await db.execute(`
      SELECT c.*, 
             (SELECT COUNT(*) FROM students WHERE class_id = c.id AND gender = 'Boys' AND status = 'Active') as boys_count,
             (SELECT COUNT(*) FROM students WHERE class_id = c.id AND gender = 'Girls' AND status = 'Active') as girls_count
      FROM classes c
      ORDER BY c.numeric_order ASC
    `);

    return NextResponse.json({
      settings,
      institution,
      administration,
      teachers,
      announcements: annRes.rows,
      events: eventsRes.rows,
      gallery: galleryRes.rows,
      achievements: achRes.rows,
      classes: classRes.rows,
    });
  } catch (error: any) {
    console.error('Public content error:', error);
    return NextResponse.json({ error: 'Failed to fetch public content' }, { status: 500 });
  }
}
