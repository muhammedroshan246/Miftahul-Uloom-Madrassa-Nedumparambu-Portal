
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { signToken, createAuthCookie, getSessionUser, TokenPayload } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { mode, credential, username } = await req.json();
    const db = getDb();

    if (mode === 'register') {
      const user = await getSessionUser(req);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const credId = credential.id || 'passkey_' + Date.now();
      const rawKey = JSON.stringify(credential);

      await db.execute({
        sql: 'INSERT INTO passkey_credentials (user_id, credential_id, public_key) VALUES (?, ?, ?)',
        args: [user.id, credId, rawKey]
      });

      await logAudit({
        user,
        action: 'PASSKEY_REGISTERED',
        module: 'Auth',
        targetId: String(user.id)
      });

      return NextResponse.json({ success: true, message: 'Passkey registered successfully!' });
    } else {
      // Biometric / Passkey Login
      let userRow: any = null;
      if (credential?.id) {
        const credRes = await db.execute({
          sql: `
            SELECT u.* FROM passkey_credentials pc
            JOIN users u ON pc.user_id = u.id
            WHERE pc.credential_id = ? AND u.is_active = 1
            LIMIT 1
          `,
          args: [credential.id]
        });
        if (credRes.rows.length > 0) userRow = credRes.rows[0];
      }

      if (!userRow && username) {
        const uRes = await db.execute({
          sql: 'SELECT * FROM users WHERE username = ? AND is_active = 1 LIMIT 1',
          args: [username.trim()]
        });
        if (uRes.rows.length > 0) userRow = uRes.rows[0];
      }

      if (!userRow) {
        return NextResponse.json({ error: 'Passkey not recognized or user not found' }, { status: 401 });
      }

      // Fetch role entity IDs
      let studentId: number | undefined;
      let teacherId: number | undefined;
      let parentId: number | undefined;

      if (userRow.role === 'STUDENT') {
        const sRes = await db.execute({ sql: 'SELECT id FROM students WHERE user_id = ?', args: [userRow.id] });
        if (sRes.rows.length > 0) studentId = Number(sRes.rows[0].id);
      } else if (userRow.role === 'STAFF') {
        const tRes = await db.execute({ sql: 'SELECT id FROM teachers WHERE user_id = ?', args: [userRow.id] });
        if (tRes.rows.length > 0) teacherId = Number(tRes.rows[0].id);
      } else if (userRow.role === 'PARENT') {
        const pRes = await db.execute({ sql: 'SELECT id FROM parents WHERE user_id = ?', args: [userRow.id] });
        if (pRes.rows.length > 0) parentId = Number(pRes.rows[0].id);
      }

      const payload: TokenPayload = {
        id: Number(userRow.id),
        username: String(userRow.username),
        role: userRow.role as any,
        full_name: String(userRow.full_name),
        email: userRow.email ? String(userRow.email) : undefined,
        phone: userRow.phone ? String(userRow.phone) : undefined,
        student_id: studentId,
        teacher_id: teacherId,
        parent_id: parentId,
      };

      const token = await signToken(payload);
      await logAudit({
        user: payload,
        action: 'PASSKEY_LOGIN_SUCCESS',
        module: 'Auth',
        targetId: String(userRow.id)
      });

      const response = NextResponse.json({ success: true, user: payload, token });
      createAuthCookie(response, token);
      return response;
    }
  } catch (error: any) {
    console.error('Passkey verification error:', error);
    return NextResponse.json({ error: 'Passkey verification failed' }, { status: 500 });
  }
}
