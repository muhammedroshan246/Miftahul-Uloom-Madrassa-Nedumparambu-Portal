
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const res = await db.execute('SELECT * FROM gallery ORDER BY created_at DESC');
    return NextResponse.json({ gallery: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const { title, category, imageUrl } = await req.json();
    if (!title || !imageUrl) return NextResponse.json({ error: 'Title and image URL are required' }, { status: 400 });

    const db = getDb();
    const res = await db.execute({
      sql: 'INSERT INTO gallery (title, category, image_url) VALUES (?, ?, ?)',
      args: [title.trim(), category || 'Campus Life', imageUrl.trim()]
    });

    return NextResponse.json({ success: true, message: 'Gallery image added' });
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
  await db.execute({ sql: 'DELETE FROM gallery WHERE id = ?', args: [Number(id)] });
  return NextResponse.json({ success: true, message: 'Image removed from gallery' });
}
