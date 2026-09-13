
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const module = searchParams.get('module');
    const search = searchParams.get('search') || '';

    const db = getDb();
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const args: any[] = [];

    if (module && module !== 'All') {
      query += ' AND module = ?';
      args.push(module);
    }
    if (search) {
      query += ' AND (action LIKE ? OR username LIKE ? OR target_id LIKE ? OR new_value LIKE ?)';
      const q = `%${search}%`;
      args.push(q, q, q, q);
    }

    query += ' ORDER BY created_at DESC LIMIT 200';
    const res = await db.execute({ sql: query, args });

    return NextResponse.json({ logs: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
