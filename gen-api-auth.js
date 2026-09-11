const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

// 1. /api/auth/login
ensureDir('src/app/api/auth/login');
fs.writeFileSync('src/app/api/auth/login/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword, signToken, createAuthCookie, TokenPayload } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { username, password, portal } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const db = getDb();
    const cleanUsername = username.trim();
    
    // Find user by username or phone or email
    const userRes = await db.execute({
      sql: 'SELECT * FROM users WHERE (username = ? OR phone = ? OR email = ?) AND is_active = 1 LIMIT 1',
      args: [cleanUsername, cleanUsername, cleanUsername]
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
`);

// 2. /api/auth/logout
ensureDir('src/app/api/auth/logout');
fs.writeFileSync('src/app/api/auth/logout/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie, getSessionUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (user) {
    await logAudit({
      user,
      action: 'LOGOUT',
      module: 'Auth',
      targetId: String(user.id)
    });
  }
  const res = NextResponse.json({ success: true, message: 'Logged out successfully' });
  clearAuthCookie(res);
  return res;
}
`);

// 3. /api/auth/me
ensureDir('src/app/api/auth/me');
fs.writeFileSync('src/app/api/auth/me/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const db = getDb();
  let details: any = {};

  if (user.role === 'STUDENT' && user.student_id) {
    const sRes = await db.execute({
      sql: \`
        SELECT s.*, c.name as class_name, sec.name as section_name, 
               p.father_name, p.mother_name, p.primary_phone as parent_phone, p.address
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN sections sec ON s.section_id = sec.id
        LEFT JOIN parents p ON s.parent_id = p.id
        WHERE s.id = ?
      \`,
      args: [user.student_id]
    });
    details.student = sRes.rows[0] || null;
  } else if (user.role === 'STAFF' && user.teacher_id) {
    const tRes = await db.execute({
      sql: 'SELECT * FROM teachers WHERE id = ?',
      args: [user.teacher_id]
    });
    const assignRes = await db.execute({
      sql: \`
        SELECT ta.*, c.name as class_name, sec.name as section_name, sub.name as subject_name, sub.code as subject_code
        FROM teacher_assignments ta
        JOIN sections sec ON ta.section_id = sec.id
        JOIN classes c ON sec.class_id = c.id
        JOIN subjects sub ON ta.subject_id = sub.id
        WHERE ta.teacher_id = ?
      \`,
      args: [user.teacher_id]
    });
    // Find if class teacher of any section
    const ctRes = await db.execute({
      sql: \`
        SELECT sec.*, c.name as class_name
        FROM sections sec
        JOIN classes c ON sec.class_id = c.id
        WHERE sec.class_teacher_id = ?
      \`,
      args: [user.teacher_id]
    });

    details.teacher = tRes.rows[0] || null;
    details.assignments = assignRes.rows || [];
    details.classTeacherSections = ctRes.rows || [];
  } else if (user.role === 'PARENT' && user.parent_id) {
    const pRes = await db.execute({
      sql: 'SELECT * FROM parents WHERE id = ?',
      args: [user.parent_id]
    });
    const childrenRes = await db.execute({
      sql: \`
        SELECT s.*, c.name as class_name, sec.name as section_name
        FROM students s
        JOIN classes c ON s.class_id = c.id
        JOIN sections sec ON s.section_id = sec.id
        WHERE s.parent_id = ?
      \`,
      args: [user.parent_id]
    });
    details.parent = pRes.rows[0] || null;
    details.children = childrenRes.rows || [];
  }

  return NextResponse.json({
    user,
    details
  });
}
`);

// 4. Passkey routes
ensureDir('src/app/api/auth/passkey/generate-options');
fs.writeFileSync('src/app/api/auth/passkey/generate-options/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { username, mode } = body;
    const db = getDb();

    // Challenge for passkey (browser WebAuthn)
    const challenge = Buffer.from(Math.random().toString(36).substring(2) + Date.now().toString(36)).toString('base64url');

    if (mode === 'register') {
      const user = await getSessionUser(req);
      if (!user) {
        return NextResponse.json({ error: 'Please login to register a passkey' }, { status: 401 });
      }

      return NextResponse.json({
        options: {
          challenge,
          rp: { name: 'Mifthahul Uloom Madrassa ERP', id: req.nextUrl.hostname },
          user: {
            id: Buffer.from(String(user.id)).toString('base64url'),
            name: user.username,
            displayName: user.full_name,
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
          timeout: 60000,
          attestation: 'none',
          authenticatorSelection: {
            userVerification: 'preferred',
            residentKey: 'preferred'
          }
        },
        challenge
      });
    } else {
      // Login mode
      let allowCredentials: any[] = [];
      if (username) {
        const uRes = await db.execute({
          sql: 'SELECT id FROM users WHERE username = ? LIMIT 1',
          args: [username.trim()]
        });
        if (uRes.rows.length > 0) {
          const credRes = await db.execute({
            sql: 'SELECT credential_id FROM passkey_credentials WHERE user_id = ?',
            args: [uRes.rows[0].id]
          });
          allowCredentials = credRes.rows.map(r => ({
            id: String(r.credential_id),
            type: 'public-key'
          }));
        }
      }

      return NextResponse.json({
        options: {
          challenge,
          timeout: 60000,
          rpId: req.nextUrl.hostname,
          allowCredentials,
          userVerification: 'preferred'
        },
        challenge
      });
    }
  } catch (error: any) {
    console.error('Passkey options error:', error);
    return NextResponse.json({ error: 'Failed to generate passkey options' }, { status: 500 });
  }
}
`);

ensureDir('src/app/api/auth/passkey/verify');
fs.writeFileSync('src/app/api/auth/passkey/verify/route.ts', `
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
          sql: \`
            SELECT u.* FROM passkey_credentials pc
            JOIN users u ON pc.user_id = u.id
            WHERE pc.credential_id = ? AND u.is_active = 1
            LIMIT 1
          \`,
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
`);

// 5. /api/public/stats (LIVE dynamic DB counts)
ensureDir('src/app/api/public/stats');
fs.writeFileSync('src/app/api/public/stats/route.ts', `
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    
    // Total Students
    const totalStudentsRes = await db.execute("SELECT COUNT(*) as c FROM students WHERE status = 'Active'");
    const totalStudents = Number(totalStudentsRes.rows[0]?.c || 0);

    // Boys Count
    const boysRes = await db.execute("SELECT COUNT(*) as c FROM students WHERE gender = 'Boys' AND status = 'Active'");
    const totalBoys = Number(boysRes.rows[0]?.c || 0);

    // Girls Count
    const girlsRes = await db.execute("SELECT COUNT(*) as c FROM students WHERE gender = 'Girls' AND status = 'Active'");
    const totalGirls = Number(girlsRes.rows[0]?.c || 0);

    // Total Teachers
    const teachersRes = await db.execute("SELECT COUNT(*) as c FROM teachers WHERE is_active = 1");
    const totalTeachers = Number(teachersRes.rows[0]?.c || 0);

    // Total Staff (including teachers and office)
    const staffRes = await db.execute("SELECT COUNT(*) as c FROM users WHERE role IN ('STAFF', 'OFFICE_ADMIN', 'SUPER_ADMIN') AND is_active = 1");
    const totalStaff = Number(staffRes.rows[0]?.c || 0);

    // Total Classes
    const classesRes = await db.execute("SELECT COUNT(*) as c FROM classes");
    const totalClasses = Number(classesRes.rows[0]?.c || 0);

    // Total Sections
    const sectionsRes = await db.execute("SELECT COUNT(*) as c FROM sections");
    const totalSections = Number(sectionsRes.rows[0]?.c || 0);

    return NextResponse.json({
      totalStudents,
      totalBoys,
      totalGirls,
      totalTeachers,
      totalStaff,
      totalClasses,
      totalSections,
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Stats query error:', error);
    return NextResponse.json({ error: 'Failed to fetch public statistics' }, { status: 500 });
  }
}
`);

// 6. /api/public/content
ensureDir('src/app/api/public/content');
fs.writeFileSync('src/app/api/public/content/route.ts', `
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    
    // 1. Settings
    const settingsRes = await db.execute('SELECT key, value FROM website_settings');
    const settings: Record<string, string> = {};
    for (const row of settingsRes.rows) {
      settings[String(row.key)] = String(row.value);
    }

    // 2. Announcements
    const annRes = await db.execute(\`
      SELECT * FROM announcements 
      WHERE is_published = 1 
      ORDER BY published_at DESC LIMIT 6
    \`);

    // 3. Events
    const eventsRes = await db.execute(\`
      SELECT * FROM events 
      WHERE is_published = 1 
      ORDER BY event_date ASC LIMIT 6
    \`);

    // 4. Gallery
    const galleryRes = await db.execute(\`
      SELECT * FROM gallery 
      ORDER BY created_at DESC LIMIT 12
    \`);

    // 5. Achievements
    const achRes = await db.execute(\`
      SELECT a.*, s.full_name as student_name, c.name as class_name, s.gender
      FROM achievements a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      ORDER BY a.date DESC LIMIT 6
    \`);

    // 6. Classes & Structure
    const classRes = await db.execute(\`
      SELECT c.*, 
             (SELECT COUNT(*) FROM students WHERE class_id = c.id AND gender = 'Boys' AND status = 'Active') as boys_count,
             (SELECT COUNT(*) FROM students WHERE class_id = c.id AND gender = 'Girls' AND status = 'Active') as girls_count
      FROM classes c
      ORDER BY c.numeric_order ASC
    \`);

    return NextResponse.json({
      settings,
      announcements: annRes.rows,
      events: eventsRes.rows,
      gallery: galleryRes.rows,
      achievements: achRes.rows,
      classes: classRes.rows,
    });
  } catch (error: any) {
    console.error('Content fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch public content' }, { status: 500 });
  }
}
`);

console.log('Auth and public APIs generated!');
