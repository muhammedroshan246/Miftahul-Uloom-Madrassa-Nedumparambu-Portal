
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  try {
    const db = getDb();
    let query = `
      SELECT cr.*, s.full_name as student_name, s.admission_no, c.name as class_name, sec.name as section_name
      FROM correction_requests cr
      JOIN students s ON cr.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN sections sec ON s.section_id = sec.id
      WHERE 1=1
    `;
    const args: any[] = [];

    if (auth.user.role === 'STUDENT') {
      query += ' AND cr.student_id = ?';
      args.push(auth.user.student_id);
    }
    query += ' ORDER BY cr.created_at DESC';

    const res = await db.execute({ sql: query, args });
    return NextResponse.json({ requests: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['STUDENT', 'PARENT', 'SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const { studentId, fieldName, oldValue, requestedValue, reason } = await req.json();
    const sId = auth.user.role === 'STUDENT' ? auth.user.student_id : Number(studentId);

    if (!sId || !fieldName || !requestedValue) {
      return NextResponse.json({ error: 'studentId, fieldName, and requestedValue are required' }, { status: 400 });
    }

    const db = getDb();
    const res = await db.execute({
      sql: 'INSERT INTO correction_requests (student_id, field_name, old_value, requested_value, reason, status) VALUES (?, ?, ?, ?, ?, "Pending")',
      args: [sId, fieldName, oldValue || null, requestedValue, reason || null]
    });

    await logAudit({
      user: auth.user,
      action: 'CORRECTION_REQUEST_SUBMITTED',
      module: 'Students',
      targetId: String(sId),
      newValue: { fieldName, requestedValue }
    });

    return NextResponse.json({ success: true, message: 'Correction request submitted to Office for review!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const { requestId, status, reviewNotes } = await req.json();
    if (!requestId || !status) return NextResponse.json({ error: 'requestId and status required' }, { status: 400 });

    const db = getDb();
    await db.execute({
      sql: 'UPDATE correction_requests SET status = ?, review_notes = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [status, reviewNotes || null, Number(requestId)]
    });

    return NextResponse.json({ success: true, message: `Correction request marked as ${status}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
