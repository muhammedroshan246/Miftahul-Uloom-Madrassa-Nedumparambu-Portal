
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const res = await db.execute('SELECT key, value FROM website_settings');
    const settings: Record<string, string> = {};
    for (const r of res.rows) {
      settings[String(r.key)] = String(r.value);
    }
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const { settings } = await req.json();
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Settings object required' }, { status: 400 });
    }

    const db = getDb();
    for (const [key, value] of Object.entries(settings)) {
      await db.execute({
        sql: `
          INSERT INTO website_settings (key, value, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            updated_at = CURRENT_TIMESTAMP
        `,
        args: [key, String(value)]
      });
    }

    await logAudit({
      user: auth.user,
      action: 'WEBSITE_SETTINGS_UPDATED',
      module: 'Settings',
      targetId: 'WebsiteCMS',
      newValue: settings
    });

    return NextResponse.json({ success: true, message: 'Settings saved successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
