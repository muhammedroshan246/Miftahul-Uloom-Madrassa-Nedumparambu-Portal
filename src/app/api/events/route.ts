
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const db = getDb();
    const res = await db.execute('SELECT * FROM events ORDER BY event_date ASC');
    return NextResponse.json({ events: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const { title, description, eventDate, eventTime, location, imageUrl, isPublished } = await req.json();
    if (!title || !description || !eventDate) return NextResponse.json({ error: 'Title, description, and event date are required' }, { status: 400 });

    const db = getDb();
    const res = await db.execute({
      sql: 'INSERT INTO events (title, description, event_date, event_time, location, image_url, is_published) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [title.trim(), description.trim(), eventDate, eventTime || null, location || null, imageUrl || null, isPublished !== undefined ? (isPublished ? 1 : 0) : 1]
    });

    await logAudit({
      user: auth.user,
      action: 'EVENT_CREATED',
      module: 'Events',
      targetId: String(res.lastInsertRowid),
      newValue: { title, eventDate }
    });

    return NextResponse.json({ success: true, message: 'Event added successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const db = getDb();
  await db.execute({ sql: 'DELETE FROM events WHERE id = ?', args: [Number(id)] });
  return NextResponse.json({ success: true, message: 'Event deleted' });
}
