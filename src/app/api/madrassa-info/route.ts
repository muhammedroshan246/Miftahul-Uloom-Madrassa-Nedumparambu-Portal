import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const db = getDb();
    const settingsRes = await db.execute('SELECT key, value FROM website_settings');
    const settings: Record<string, string> = {};
    for (const row of settingsRes.rows) {
      settings[String(row.key)] = String(row.value);
    }

    const info = {
      madrassaName: settings.madrassa_name || 'Mifthahul Uloom Higher Secondary Madrassa',
      range: settings.madrassa_range || 'Vengara',
      rangeNumber: settings.range_number || '50',
      madrassaNumber: settings.madrassa_number || '5090',
      location: settings.madrassa_location || 'Nedumparambu',
      classTimingSession1: settings.class_timing_session_1 || '6:15 AM – 7:30 AM',
      classTimingSession2: settings.class_timing_session_2 || '7:30 AM – 9:00 AM',
      sadrName: settings.sadr_name || 'V. K. Jabir Baqavi',
      sadrRole: settings.sadr_role || 'Sadr / Head of Madrassa',
      sadrClass: settings.sadr_class || '+2',
      sadrPhone: settings.sadr_phone || '9544182665',
      secretaryName: settings.secretary_name || 'Mansoor Thamanchery',
      secretaryRole: settings.secretary_role || 'Secretary',
      secretaryPhone: settings.secretary_phone || '9567333332',
      presidentName: settings.president_name || 'Alavi Haji',
      presidentRole: settings.president_role || 'President',
      presidentPhone: settings.president_phone || '9947452964',
      showStaffPhonesPublicly: settings.show_staff_phones_publicly === '1' || settings.show_staff_phones_publicly === 'true',
      aboutHistory: settings.about_history || ''
    };

    return NextResponse.json({ success: true, info });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const body = await req.json();
    const db = getDb();

    const keysToUpdate: Record<string, string> = {
      madrassa_name: body.madrassaName,
      madrassa_range: body.range,
      range_number: body.rangeNumber,
      madrassa_number: body.madrassaNumber,
      madrassa_location: body.location,
      class_timing_session_1: body.classTimingSession1,
      class_timing_session_2: body.classTimingSession2,
      sadr_name: body.sadrName,
      sadr_role: body.sadrRole,
      sadr_class: body.sadrClass,
      sadr_phone: body.sadrPhone,
      secretary_name: body.secretaryName,
      secretary_role: body.secretaryRole,
      secretary_phone: body.secretaryPhone,
      president_name: body.presidentName,
      president_role: body.presidentRole,
      president_phone: body.presidentPhone,
      show_staff_phones_publicly: body.showStaffPhonesPublicly ? '1' : '0',
      about_history: body.aboutHistory
    };

    for (const [key, val] of Object.entries(keysToUpdate)) {
      if (val !== undefined && val !== null) {
        await db.execute({
          sql: `
            INSERT INTO website_settings (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
          `,
          args: [key, String(val)]
        });
      }
    }

    await logAudit({
      user: auth.user,
      action: 'MADRASSA_INFO_UPDATED',
      module: 'Settings',
      targetId: 'MadrassaInfo',
      newValue: body
    });

    return NextResponse.json({ success: true, message: 'Official Madrassa information updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
