const fs = require('fs');
const path = require('path');
function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

// 1. /api/achievements
ensureDir('src/app/api/achievements');
fs.writeFileSync('src/app/api/achievements/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const db = getDb();

    let query = \`
      SELECT a.*, s.full_name as student_name, s.admission_no, c.name as class_name, s.gender
      FROM achievements a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      WHERE 1=1
    \`;
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
`);

// 2. /api/announcements
ensureDir('src/app/api/announcements');
fs.writeFileSync('src/app/api/announcements/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const res = await db.execute('SELECT * FROM announcements ORDER BY published_at DESC');
    return NextResponse.json({ announcements: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const { title, content, priority, targetAudience, isPublished } = await req.json();
    if (!title || !content) return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });

    const db = getDb();
    const res = await db.execute({
      sql: 'INSERT INTO announcements (title, content, priority, target_audience, is_published, created_by_user_id) VALUES (?, ?, ?, ?, ?, ?)',
      args: [title.trim(), content.trim(), priority || 'Medium', targetAudience || 'All', isPublished !== undefined ? (isPublished ? 1 : 0) : 1, auth.user.id]
    });

    await logAudit({
      user: auth.user,
      action: 'ANNOUNCEMENT_CREATED',
      module: 'Announcements',
      targetId: String(res.lastInsertRowid),
      newValue: { title, priority }
    });

    return NextResponse.json({ success: true, message: 'Announcement created successfully' });
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
  await db.execute({ sql: 'DELETE FROM announcements WHERE id = ?', args: [Number(id)] });
  return NextResponse.json({ success: true, message: 'Announcement deleted' });
}
`);

// 3. /api/events
ensureDir('src/app/api/events');
fs.writeFileSync('src/app/api/events/route.ts', `
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
`);

// 4. /api/gallery
ensureDir('src/app/api/gallery');
fs.writeFileSync('src/app/api/gallery/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

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
`);

// 5. /api/corrections
ensureDir('src/app/api/corrections');
fs.writeFileSync('src/app/api/corrections/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('status' in auth) return auth;

  try {
    const db = getDb();
    let query = \`
      SELECT cr.*, s.full_name as student_name, s.admission_no, c.name as class_name, sec.name as section_name
      FROM correction_requests cr
      JOIN students s ON cr.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN sections sec ON s.section_id = sec.id
      WHERE 1=1
    \`;
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

    return NextResponse.json({ success: true, message: \`Correction request marked as \${status}\` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`);

// 6. /api/reports
ensureDir('src/app/api/reports');
fs.writeFileSync('src/app/api/reports/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'students';
    const classId = searchParams.get('classId');
    const gender = searchParams.get('gender');
    const format = searchParams.get('format'); // 'csv' or 'json'

    const db = getDb();

    if (type === 'students') {
      let query = \`
        SELECT s.admission_no, s.roll_no, s.full_name, s.gender, s.dob,
               c.name as class_name, sec.name as section_name,
               p.father_name, p.primary_phone, p.address, s.status
        FROM students s
        JOIN classes c ON s.class_id = c.id
        JOIN sections sec ON s.section_id = sec.id
        LEFT JOIN parents p ON s.parent_id = p.id
        WHERE 1=1
      \`;
      const args: any[] = [];
      if (classId && classId !== 'All') { query += ' AND s.class_id = ?'; args.push(Number(classId)); }
      if (gender && gender !== 'All') { query += ' AND s.gender = ?'; args.push(gender); }
      query += ' ORDER BY c.numeric_order ASC, sec.name ASC, s.roll_no ASC';

      const res = await db.execute({ sql: query, args });

      if (format === 'csv') {
        const headers = ['Admission No', 'Roll No', 'Full Name', 'Gender', 'Class', 'Section', 'Father Name', 'Phone', 'Address', 'Status'];
        const csvRows = [headers.join(',')];
        for (const r of res.rows) {
          csvRows.push([
            \`"\${r.admission_no || ''}"\`,
            r.roll_no,
            \`"\${r.full_name || ''}"\`,
            r.gender,
            \`"\${r.class_name || ''}"\`,
            r.section_name,
            \`"\${r.father_name || ''}"\`,
            \`"\${r.primary_phone || ''}"\`,
            \`"\${(String(r.address || '')).replace(/"/g, '""')}"\`,
            r.status
          ].join(','));
        }
        return new NextResponse(csvRows.join('\\n'), {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': \`attachment; filename="students_report_\${Date.now()}.csv"\`
          }
        });
      }

      return NextResponse.json({ type: 'students', rows: res.rows });
    }

    if (type === 'fees') {
      const res = await db.execute(\`
        SELECT f.month, f.amount, f.status, f.paid_amount, f.payment_date, f.payment_mode, f.receipt_no,
               s.admission_no, s.full_name, s.roll_no, c.name as class_name, sec.name as section_name, p.primary_phone
        FROM fees f
        JOIN students s ON f.student_id = s.id
        JOIN classes c ON s.class_id = c.id
        JOIN sections sec ON s.section_id = sec.id
        LEFT JOIN parents p ON s.parent_id = p.id
        ORDER BY c.numeric_order ASC, sec.name ASC, s.roll_no ASC, f.id ASC
      \`);

      if (format === 'csv') {
        const headers = ['Admission No', 'Student Name', 'Class', 'Section', 'Month', 'Amount', 'Status', 'Paid Amount', 'Payment Date', 'Payment Mode', 'Receipt No', 'Phone'];
        const csvRows = [headers.join(',')];
        for (const r of res.rows) {
          csvRows.push([
            \`"\${r.admission_no || ''}"\`,
            \`"\${r.full_name || ''}"\`,
            \`"\${r.class_name || ''}"\`,
            r.section_name,
            \`"\${r.month || ''}"\`,
            r.amount,
            r.status,
            r.paid_amount,
            r.payment_date || '',
            r.payment_mode || '',
            \`"\${r.receipt_no || ''}"\`,
            \`"\${r.primary_phone || ''}"\`
          ].join(','));
        }
        return new NextResponse(csvRows.join('\\n'), {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': \`attachment; filename="fee_report_\${Date.now()}.csv"\`
          }
        });
      }

      return NextResponse.json({ type: 'fees', rows: res.rows });
    }

    if (type === 'attendance') {
      const res = await db.execute(\`
        SELECT s.admission_no, s.full_name, c.name as class_name, sec.name as section_name,
               COUNT(a.id) as total_recorded_days,
               SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_days,
               SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absent_days,
               SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) as late_days
        FROM students s
        JOIN classes c ON s.class_id = c.id
        JOIN sections sec ON s.section_id = sec.id
        LEFT JOIN attendance a ON a.student_id = s.id
        GROUP BY s.id
        ORDER BY c.numeric_order ASC, sec.name ASC, s.roll_no ASC
      \`);

      if (format === 'csv') {
        const headers = ['Admission No', 'Student Name', 'Class', 'Section', 'Total Days', 'Present Days', 'Absent Days', 'Late Days', 'Attendance %'];
        const csvRows = [headers.join(',')];
        for (const r of res.rows) {
          const tot = Number(r.total_recorded_days || 0);
          const pres = Number(r.present_days || 0);
          const pct = tot > 0 ? ((pres / tot) * 100).toFixed(1) + '%' : 'N/A';
          csvRows.push([
            \`"\${r.admission_no || ''}"\`,
            \`"\${r.full_name || ''}"\`,
            \`"\${r.class_name || ''}"\`,
            r.section_name,
            tot,
            pres,
            Number(r.absent_days || 0),
            Number(r.late_days || 0),
            pct
          ].join(','));
        }
        return new NextResponse(csvRows.join('\\n'), {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': \`attachment; filename="attendance_report_\${Date.now()}.csv"\`
          }
        });
      }

      return NextResponse.json({ type: 'attendance', rows: res.rows });
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`);

// 7. /api/audit-logs
ensureDir('src/app/api/audit-logs');
fs.writeFileSync('src/app/api/audit-logs/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

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
      const q = \`%\${search}%\`;
      args.push(q, q, q, q);
    }

    query += ' ORDER BY created_at DESC LIMIT 200';
    const res = await db.execute({ sql: query, args });

    return NextResponse.json({ logs: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`);

// 8. /api/settings
ensureDir('src/app/api/settings');
fs.writeFileSync('src/app/api/settings/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const db = getDb();
    const res = await db.execute('SELECT key, value FROM website_settings');
    const settings: Record<string, string> = {};
    for (const r of res.rows) {
      settings[String(r.key)] = String(r.value);
    }
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const { settings } = await req.json();
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Settings object required' }, { status: 400 });
    }

    const db = getDb();
    for (const [key, value] of Object.entries(settings)) {
      await db.execute({
        sql: \`
          INSERT INTO website_settings (key, value, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            updated_at = CURRENT_TIMESTAMP
        \`,
        args: [key, String(value)]
      });
    }

    await logAudit({
      user: auth.user,
      action: 'WEBSITE_SETTINGS_UPDATED',
      module: 'Settings',
      targetId: 'WebsiteCMS',
      newValue: settings
    });

    return NextResponse.json({ success: true, message: 'Settings saved successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`);

// 9. /api/academic-years (Promotion System)
ensureDir('src/app/api/academic-years');
fs.writeFileSync('src/app/api/academic-years/route.ts', `
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { MONTHS, MONTHLY_FEE_AMOUNT } from '@/lib/constants';

export async function GET() {
  try {
    const db = getDb();
    const res = await db.execute('SELECT * FROM academic_years ORDER BY id DESC');
    return NextResponse.json({ years: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const { action, fromSectionId, toSectionId, studentIds, newAcademicYearName } = await req.json();
    const db = getDb();

    if (action === 'promote_batch') {
      if (!toSectionId || !Array.isArray(studentIds) || studentIds.length === 0) {
        return NextResponse.json({ error: 'toSectionId and studentIds are required' }, { status: 400 });
      }

      const secRes = await db.execute({ sql: 'SELECT class_id, gender FROM sections WHERE id = ?', args: [Number(toSectionId)] });
      if (secRes.rows.length === 0) return NextResponse.json({ error: 'Target section not found' }, { status: 404 });
      const targetClassId = Number(secRes.rows[0].class_id);

      for (const sId of studentIds) {
        await db.execute({
          sql: 'UPDATE students SET class_id = ?, section_id = ? WHERE id = ?',
          args: [targetClassId, Number(toSectionId), Number(sId)]
        });
      }

      await logAudit({
        user: auth.user,
        action: 'STUDENTS_BULK_PROMOTED',
        module: 'AcademicYear',
        targetId: String(toSectionId),
        newValue: { fromSectionId, toSectionId, count: studentIds.length }
      });

      return NextResponse.json({ success: true, message: \`Successfully promoted \${studentIds.length} students to new class!\` });
    }

    if (action === 'graduate_batch') {
      for (const sId of studentIds) {
        await db.execute({
          sql: 'UPDATE students SET status = "Graduated" WHERE id = ?',
          args: [Number(sId)]
        });
      }

      await logAudit({
        user: auth.user,
        action: 'STUDENTS_GRADUATED_ALUMNI',
        module: 'AcademicYear',
        newValue: { count: studentIds.length }
      });

      return NextResponse.json({ success: true, message: \`Graduated \${studentIds.length} students to Alumni status.\` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`);

console.log('CMS, reports, audit logs, and promotion APIs created!');
