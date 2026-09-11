import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth, hashPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { generateSecure6DigitPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const data = await req.json();
    const { 
      type, // 'student' | 'teacher' | 'user'
      targetId, // student_id, teacher_id, or user_id
      action, // 'generate' | 'custom'
      customPassword
    } = data;

    if (!type || !targetId) {
      return NextResponse.json({ error: 'Target type and ID are required' }, { status: 400 });
    }

    const db = getDb();
    let userId: number | null = null;
    let targetName = '';
    let targetUsername = '';
    let targetRole = '';

    if (type === 'student') {
      const sRes = await db.execute({
        sql: 'SELECT s.id, s.full_name, s.user_id, s.admission_no, u.username, u.role FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?',
        args: [Number(targetId)]
      });
      if (sRes.rows.length === 0) return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
      userId = Number(sRes.rows[0].user_id);
      targetName = String(sRes.rows[0].full_name);
      targetUsername = String(sRes.rows[0].username);
      targetRole = 'STUDENT';
    } else if (type === 'teacher') {
      const tRes = await db.execute({
        sql: 'SELECT t.id, t.full_name, t.user_id, t.staff_id, u.username, u.role FROM teachers t JOIN users u ON t.user_id = u.id WHERE t.id = ?',
        args: [Number(targetId)]
      });
      if (tRes.rows.length === 0) return NextResponse.json({ error: 'Teacher record not found' }, { status: 404 });
      userId = Number(tRes.rows[0].user_id);
      targetName = String(tRes.rows[0].full_name);
      targetUsername = String(tRes.rows[0].username);
      targetRole = 'STAFF';
    } else if (type === 'user') {
      const uRes = await db.execute({
        sql: 'SELECT id, full_name, username, role FROM users WHERE id = ?',
        args: [Number(targetId)]
      });
      if (uRes.rows.length === 0) return NextResponse.json({ error: 'User record not found' }, { status: 404 });
      userId = Number(uRes.rows[0].id);
      targetName = String(uRes.rows[0].full_name);
      targetUsername = String(uRes.rows[0].username);
      targetRole = String(uRes.rows[0].role);
    }

    if (!userId) {
      return NextResponse.json({ error: 'Could not resolve target user' }, { status: 404 });
    }

    // Determine new plain password
    let plainPassword = '';
    if (action === 'custom' && customPassword && customPassword.trim().length >= 4) {
      plainPassword = customPassword.trim();
    } else {
      // Auto-generate 6-digit numeric password
      plainPassword = generateSecure6DigitPassword();
    }

    const newHash = await hashPassword(plainPassword);

    await db.execute({
      sql: 'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [newHash, userId]
    });

    await logAudit({
      user: auth.user,
      action: 'PASSWORD_OVERRIDE',
      module: 'OfficeAdmin',
      targetId: `${type}:${targetId}`,
      newValue: {
        targetName,
        targetUsername,
        targetRole,
        action: action === 'custom' ? 'Set Custom Password' : 'Generated 6-Digit Password'
      }
    });

    return NextResponse.json({
      success: true,
      message: `Password for ${targetName} (${targetUsername}) updated successfully!`,
      credentials: {
        name: targetName,
        username: targetUsername,
        role: targetRole,
        password: plainPassword
      }
    });
  } catch (error: any) {
    console.error('Password control error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update password' }, { status: 500 });
  }
}
