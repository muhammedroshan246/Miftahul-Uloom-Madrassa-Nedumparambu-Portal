
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword, signToken, createAuthCookie, TokenPayload } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { username, password, portal } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const db = getDb();
    const cleanUsername = username.trim();
    
    // Find user by username, phone, email, or student admission number
    const userRes = await db.execute({
      sql: `
        SELECT u.* FROM users u
        LEFT JOIN students s ON s.user_id = u.id
        WHERE (u.username = ? OR u.phone = ? OR u.email = ? OR s.admission_no = ?) AND u.is_active = 1
        LIMIT 1
      `,
      args: [cleanUsername, cleanUsername, cleanUsername, cleanUsername]
    });

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials or inactive account' }, { status: 401 });
    }

    const user = userRes.rows[0];
    const isPasswordValid = await verifyPassword(password, String(user.password_hash));

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Role check if portal specified
    if (portal === 'office' && !['SUPER_ADMIN', 'OFFICE_ADMIN'].includes(String(user.role))) {
      return NextResponse.json({ error: 'Access denied: Not authorized for Office Portal' }, { status: 403 });
    }
    if (portal === 'staff' && String(user.role) !== 'STAFF' && !['SUPER_ADMIN', 'OFFICE_ADMIN'].includes(String(user.role))) {
      return NextResponse.json({ error: 'Access denied: Not authorized for Staff Portal' }, { status: 403 });
    }
    if (portal === 'student' && String(user.role) !== 'STUDENT') {
      return NextResponse.json({ error: 'Access denied: Not authorized for Student Portal' }, { status: 403 });
    }
    if (portal === 'parent' && String(user.role) !== 'PARENT') {
      return NextResponse.json({ error: 'Access denied: Not authorized for Parent Portal' }, { status: 403 });
    }

    // Fetch associated entity IDs
    let studentId: number | undefined;
    let teacherId: number | undefined;
    let parentId: number | undefined;
    let classId: number | undefined;
    let sectionId: number | undefined;

    if (user.role === 'STUDENT') {
      const sRes = await db.execute({
        sql: 'SELECT id, class_id, section_id FROM students WHERE user_id = ? LIMIT 1',
        args: [user.id]
      });
      if (sRes.rows.length > 0) {
        studentId = Number(sRes.rows[0].id);
        classId = Number(sRes.rows[0].class_id);
        sectionId = Number(sRes.rows[0].section_id);
      }
    } else if (user.role === 'STAFF') {
      const tRes = await db.execute({
        sql: 'SELECT id FROM teachers WHERE user_id = ? LIMIT 1',
        args: [user.id]
      });
      if (tRes.rows.length > 0) {
        teacherId = Number(tRes.rows[0].id);
      }
    } else if (user.role === 'PARENT') {
      const pRes = await db.execute({
        sql: 'SELECT id FROM parents WHERE user_id = ? LIMIT 1',
        args: [user.id]
      });
      if (pRes.rows.length > 0) {
        parentId = Number(pRes.rows[0].id);
      }
    }

    const payload: TokenPayload = {
      id: Number(user.id),
      username: String(user.username),
      role: user.role as any,
      full_name: String(user.full_name),
      email: user.email ? String(user.email) : undefined,
      phone: user.phone ? String(user.phone) : undefined,
      student_id: studentId,
      teacher_id: teacherId,
      parent_id: parentId,
      class_id: classId,
      section_id: sectionId,
    };

    const token = await signToken(payload);

    await logAudit({
      user: payload,
      action: 'LOGIN_SUCCESS',
      module: 'Auth',
      targetId: String(user.id),
      newValue: { username: user.username, role: user.role, portal: portal || 'default' }
    });

    const response = NextResponse.json({
      success: true,
      user: payload,
      token,
    });

    createAuthCookie(response, token);
    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error during login' }, { status: 500 });
  }
}
