
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const db = getDb();

    let query = `
      SELECT a.*, s.full_name as student_name, s.admission_no, c.name as class_name, s.gender
      FROM achievements a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      WHERE 1=1
    `;
    const args: any[] = [];
    if (studentId) {
      query += ' AND a.student_id = ?';
      args.push(Number(studentId));
    }
    query += ' ORDER BY a.date DESC';

    const res = await db.execute({ sql: query, args });
    return NextResponse.json({ achievements: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN', 'STAFF']);
  if ('status' in auth) return auth;

  try {
    const { studentId, title, competitionEvent, position, date, description, certificateUrl } = await req.json();
    if (!studentId || !title || !competitionEvent || !position) {
      return NextResponse.json({ error: 'studentId, title, competitionEvent, position are required' }, { status: 400 });
    }

    const db = getDb();
    const res = await db.execute({
      sql: 'INSERT INTO achievements (student_id, title, competition_event, position, date, description, certificate_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [Number(studentId), title.trim(), competitionEvent.trim(), position.trim(), date || null, description || null, certificateUrl || null]
    });

    await logAudit({
      user: auth.user,
      action: 'ACHIEVEMENT_ADDED',
      module: 'Achievements',
      targetId: String(res.lastInsertRowid),
      newValue: { studentId, title, position }
    });

    return NextResponse.json({ success: true, message: 'Achievement added successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
