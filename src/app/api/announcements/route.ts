import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const audience = searchParams.get('audience');
    const status = searchParams.get('status') || 'All'; // 'Published' | 'Archived' | 'Draft' | 'All'

    const db = getDb();
    let query = 'SELECT * FROM announcements WHERE 1=1';
    const args: any[] = [];

    if (status !== 'All') {
      if (status === 'Published') {
        query += ' AND is_published = 1';
      } else if (status === 'Archived') {
        query += ' AND is_published = 2';
      } else if (status === 'Draft') {
        query += ' AND is_published = 0';
      }
    }

    if (audience && audience !== 'All') {
      query += ' AND (target_audience = ? OR target_audience = "All")';
      args.push(audience);
    }

    query += ' ORDER BY published_at DESC';

    const res = await db.execute({ sql: query, args });
    return NextResponse.json({ announcements: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const { title, content, priority, targetAudience, status, isPublished } = await req.json();
    if (!title || !content) return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });

    let pubState = 1; // 1 = Published, 0 = Draft, 2 = Archived
    if (status === 'Draft') pubState = 0;
    else if (status === 'Archived') pubState = 2;
    else if (isPublished !== undefined) pubState = isPublished ? 1 : 0;

    const db = getDb();
    const res = await db.execute({
      sql: 'INSERT INTO announcements (title, content, priority, target_audience, is_published, created_by_user_id) VALUES (?, ?, ?, ?, ?, ?)',
      args: [title.trim(), content.trim(), priority || 'Medium', targetAudience || 'All', pubState, auth.user.id]
    });

    await logAudit({
      user: auth.user,
      action: 'ANNOUNCEMENT_CREATED',
      module: 'Announcements',
      targetId: String(res.lastInsertRowid),
      newValue: { title, priority, targetAudience, status: status || 'Published' }
    });

    return NextResponse.json({ 
      success: true, 
      id: Number(res.lastInsertRowid),
      message: 'Notice created successfully' 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const { id, title, content, priority, targetAudience, status, isPublished } = await req.json();
    if (!id) return NextResponse.json({ error: 'Notice ID is required' }, { status: 400 });

    const db = getDb();
    const oldRes = await db.execute({ sql: 'SELECT * FROM announcements WHERE id = ?', args: [Number(id)] });
    if (oldRes.rows.length === 0) return NextResponse.json({ error: 'Notice not found' }, { status: 404 });
    const old = oldRes.rows[0];

    let pubState = old.is_published;
    if (status === 'Published') pubState = 1;
    else if (status === 'Archived') pubState = 2;
    else if (status === 'Draft') pubState = 0;
    else if (isPublished !== undefined) pubState = isPublished ? 1 : 0;

    await db.execute({
      sql: `
        UPDATE announcements 
        SET title = COALESCE(?, title),
            content = COALESCE(?, content),
            priority = COALESCE(?, priority),
            target_audience = COALESCE(?, target_audience),
            is_published = ?
        WHERE id = ?
      `,
      args: [
        title ? title.trim() : null,
        content ? content.trim() : null,
        priority || null,
        targetAudience || null,
        pubState,
        Number(id)
      ]
    });

    await logAudit({
      user: auth.user,
      action: pubState === 2 ? 'NOTICE_ARCHIVED' : 'NOTICE_UPDATED',
      module: 'Announcements',
      targetId: String(id),
      previousValue: old,
      newValue: { title, priority, targetAudience, is_published: pubState }
    });

    return NextResponse.json({
      success: true,
      message: pubState === 2 ? 'Notice archived successfully' : 'Notice updated successfully'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const action = searchParams.get('action') || 'archive'; // 'archive' | 'permanent'
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const db = getDb();
  if (action === 'archive') {
    await db.execute({ sql: 'UPDATE announcements SET is_published = 2 WHERE id = ?', args: [Number(id)] });
    await logAudit({
      user: auth.user,
      action: 'NOTICE_ARCHIVED',
      module: 'Announcements',
      targetId: String(id)
    });
    return NextResponse.json({ success: true, message: 'Notice archived successfully' });
  }

  await db.execute({ sql: 'DELETE FROM announcements WHERE id = ?', args: [Number(id)] });
  await logAudit({
    user: auth.user,
    action: 'NOTICE_DELETED',
    module: 'Announcements',
    targetId: String(id)
  });
  return NextResponse.json({ success: true, message: 'Notice permanently deleted' });
}