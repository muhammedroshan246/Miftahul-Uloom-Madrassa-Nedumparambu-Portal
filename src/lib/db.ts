import { createClient, Client } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import initialData from './initialData.json';

let client: Client | null = null;
let isInitialized = false;

function resolveDatabaseConfig(): { url: string; authToken?: string } {
  const envUrl = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_TOKEN;

  // 1. Remote Database (Turso / LibSQL Cloud / Remote HTTP)
  if (envUrl && (envUrl.startsWith('libsql://') || envUrl.startsWith('https://') || envUrl.startsWith('http://') || envUrl.startsWith('wss://'))) {
    return {
      url: envUrl,
      authToken: authToken || undefined,
    };
  }

  // 2. Local / Serverless File Mode
  const possibleSourcePaths = [
    path.resolve(process.cwd(), 'madrassa.db'),
    path.resolve(process.cwd(), 'public', 'madrassa.db'),
    path.resolve(__dirname, '..', '..', 'madrassa.db'),
    path.resolve(__dirname, '..', '..', '..', 'madrassa.db'),
  ];

  let sourceDbPath: string | null = null;
  for (const p of possibleSourcePaths) {
    if (fs.existsSync(p) && fs.statSync(p).size > 0) {
      sourceDbPath = p;
      break;
    }
  }

  // On Vercel / AWS Lambda, /var/task is read-only. We copy to /tmp for read-write access
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);

  if (isServerless) {
    const tmpDbPath = path.join('/tmp', 'madrassa.db');
    try {
      if (sourceDbPath && (!fs.existsSync(tmpDbPath) || fs.statSync(tmpDbPath).size === 0)) {
        fs.copyFileSync(sourceDbPath, tmpDbPath);
        console.log(`[DB] Copied source database (${fs.statSync(sourceDbPath).size} bytes) from ${sourceDbPath} to ${tmpDbPath}`);
      }
    } catch (e: any) {
      console.warn('[DB] Warning while copying database to /tmp:', e?.message);
    }

    if (fs.existsSync(tmpDbPath)) {
      return { url: `file:${tmpDbPath}` };
    }
  }

  if (sourceDbPath) {
    return { url: `file:${sourceDbPath}` };
  }

  // Fallback to default in working directory
  const defaultPath = path.resolve(process.cwd(), 'madrassa.db');
  return { url: `file:${defaultPath}` };
}

export function getDb(): Client {
  if (!client) {
    const config = resolveDatabaseConfig();
    console.log('[DB] Connecting to database:', config.url.replace(/\/\/[^@]+@/, '//***@'));
    client = createClient(config);
  }
  return client;
}

export async function seedInitialData(db: Client) {
  console.log('[DB] Running automatic data seeding...');
  
  // 1. Academic Years
  if (Array.isArray(initialData.academic_years)) {
    for (const ay of initialData.academic_years) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO academic_years (id, name, is_current, start_date, end_date) VALUES (?, ?, ?, ?, ?)`,
        args: [ay.id, ay.name, ay.is_current, ay.start_date, ay.end_date]
      });
    }
  }

  // 2. Users
  if (Array.isArray(initialData.users)) {
    for (const u of initialData.users) {
      await db.execute({
        sql: `INSERT INTO users (id, username, password_hash, role, full_name, email, phone, avatar_url, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET role = excluded.role, full_name = excluded.full_name, avatar_url = COALESCE(excluded.avatar_url, users.avatar_url)`,
        args: [u.id, u.username, u.password_hash, u.role, u.full_name, u.email, u.phone, u.avatar_url, u.is_active]
      });
    }
  }

  // 3. Classes
  if (Array.isArray(initialData.classes)) {
    for (const c of initialData.classes) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO classes (id, name, display_order, numeric_order) VALUES (?, ?, ?, ?)`,
        args: [c.id, c.name, c.display_order, c.numeric_order]
      });
    }
  }

  // 4. Sections
  if (Array.isArray(initialData.sections)) {
    for (const s of initialData.sections) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO sections (id, class_id, name, gender, class_teacher_id) VALUES (?, ?, ?, ?, ?)`,
        args: [s.id, s.class_id, s.name, s.gender, s.class_teacher_id]
      });
    }
  }

  // 5. Teachers
  if (Array.isArray(initialData.teachers)) {
    for (const t of initialData.teachers) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO teachers (id, user_id, staff_id, full_name, gender, phone, email, qualification, designation, photo_url, joining_date, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [t.id, t.user_id, t.staff_id, t.full_name, t.gender, t.phone, t.email, t.qualification, t.designation, t.photo_url, t.joining_date, t.is_active]
      });
    }
  }

  // 6. Teacher Assignments
  if (Array.isArray(initialData.teacher_assignments)) {
    for (const ta of initialData.teacher_assignments) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO teacher_assignments (id, teacher_id, section_id, subject_id) VALUES (?, ?, ?, ?)`,
        args: [ta.id, ta.teacher_id, ta.section_id, ta.subject_id]
      });
    }
  }

  // 7. Subjects
  if (Array.isArray(initialData.subjects)) {
    for (const sub of initialData.subjects) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO subjects (id, name, code, class_id) VALUES (?, ?, ?, ?)`,
        args: [sub.id, sub.name, sub.code, sub.class_id]
      });
    }
  }

  // 8. Parents
  if (Array.isArray(initialData.parents)) {
    for (const p of initialData.parents) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO parents (id, user_id, father_name, mother_name, guardian_name, primary_phone, alt_phone, address, emergency_contact) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [p.id, p.user_id, p.father_name, p.mother_name, p.guardian_name, p.primary_phone, p.alt_phone, p.address, p.emergency_contact]
      });
    }
  }

  // 9. Students (ALL 303 STUDENTS)
  if (Array.isArray(initialData.students)) {
    for (const st of initialData.students) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO students (id, user_id, admission_no, roll_no, full_name, dob, gender, class_id, section_id, photo_url, admission_date, status, academic_year_id, parent_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [st.id, st.user_id, st.admission_no, st.roll_no, st.full_name, st.dob, st.gender, st.class_id, st.section_id, st.photo_url, st.admission_date, st.status || 'Active', st.academic_year_id, st.parent_id]
      });
    }
  }

  // 10. Exams
  if (Array.isArray(initialData.exams)) {
    for (const ex of initialData.exams) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO exams (id, academic_year_id, name, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [ex.id, ex.academic_year_id, ex.name, ex.start_date, ex.end_date, ex.status]
      });
    }
  }

  // 11. Exam Subjects
  if (Array.isArray(initialData.exam_subjects)) {
    for (const es of initialData.exam_subjects) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO exam_subjects (id, exam_id, subject_id, class_id, max_marks, pass_marks) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [es.id, es.exam_id, es.subject_id, es.class_id, es.max_marks, es.pass_marks]
      });
    }
  }

  // 12. Website Settings
  if (Array.isArray(initialData.website_settings)) {
    for (const ws of initialData.website_settings) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO website_settings (key, value) VALUES (?, ?)`,
        args: [ws.key, ws.value]
      });
    }
  }

  // 13. Staff Permissions
  if (Array.isArray((initialData as any).staff_permissions)) {
    for (const sp of (initialData as any).staff_permissions) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO staff_permissions (id, teacher_id, section_id, can_manage_marks, can_manage_attendance) VALUES (?, ?, ?, ?, ?)`,
        args: [sp.id, sp.teacher_id, sp.section_id, sp.can_manage_marks, sp.can_manage_attendance]
      });
    }
  }

  // 14. Passkey Credentials
  if (Array.isArray((initialData as any).passkey_credentials)) {
    for (const pk of (initialData as any).passkey_credentials) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO passkey_credentials (id, user_id, credential_id, public_key, counter, transports, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [pk.id, pk.user_id, pk.credential_id, pk.public_key, pk.counter, pk.transports, pk.created_at]
      });
    }
  }

  // 15. Salaries
  if (Array.isArray((initialData as any).salaries)) {
    for (const sal of (initialData as any).salaries) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO salaries (id, teacher_id, academic_year_id, month, basic_salary, allowance, deduction, other_adjustment, net_salary, status, payment_date, payment_mode, payment_reference, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [sal.id, sal.teacher_id, sal.academic_year_id, sal.month, sal.basic_salary, sal.allowance, sal.deduction, sal.other_adjustment || 0, sal.net_salary, sal.status, sal.payment_date, sal.payment_mode, sal.payment_reference, sal.notes, sal.created_at, sal.updated_at]
      });
    }
  }

  // 16. Fees
  if (Array.isArray((initialData as any).fees)) {
    for (const f of (initialData as any).fees) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO fees (id, student_id, academic_year_id, month, amount, status, paid_amount, payment_date, payment_mode, payment_reference, receipt_no, collected_by_user_id, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [f.id, f.student_id, f.academic_year_id, f.month, f.amount, f.status, f.paid_amount, f.payment_date, f.payment_mode, f.payment_reference, f.receipt_no, f.collected_by_user_id, f.updated_at]
      });
    }
  }

  // 17. Attendance
  if (Array.isArray((initialData as any).attendance)) {
    for (const att of (initialData as any).attendance) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO attendance (id, student_id, section_id, date, status, remarks, marked_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [att.id, att.student_id, att.section_id, att.date, att.status, att.remarks, att.marked_by_user_id, att.created_at, att.updated_at]
      });
    }
  }

  // 18. Marks
  if (Array.isArray((initialData as any).marks)) {
    for (const m of (initialData as any).marks) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO marks (id, exam_id, subject_id, student_id, marks_obtained, grade, is_pass, remarks, entered_by_user_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [m.id, m.exam_id, m.subject_id, m.student_id, m.marks_obtained, m.grade, m.is_pass, m.remarks, m.entered_by_user_id, m.status, m.created_at, m.updated_at]
      });
    }
  }

  // 19. Announcements
  if (Array.isArray((initialData as any).announcements)) {
    for (const ann of (initialData as any).announcements) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO announcements (id, title, content, priority, target_audience, is_published, published_at, created_by_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [ann.id, ann.title, ann.content, ann.priority, ann.target_audience, ann.is_published, ann.published_at, ann.created_by_user_id]
      });
    }
  }

  // 20. Events
  if (Array.isArray((initialData as any).events)) {
    for (const ev of (initialData as any).events) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO events (id, title, description, event_date, event_time, location, image_url, is_published, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [ev.id, ev.title, ev.description, ev.event_date, ev.event_time, ev.location, ev.image_url, ev.is_published, ev.created_at]
      });
    }
  }

  // 21. Gallery
  if (Array.isArray((initialData as any).gallery)) {
    for (const g of (initialData as any).gallery) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO gallery (id, title, category, image_url, event_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [g.id, g.title, g.category, g.image_url, g.event_id, g.created_at]
      });
    }
  }

  // 22. Achievements
  if (Array.isArray((initialData as any).achievements)) {
    for (const ach of (initialData as any).achievements) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO achievements (id, student_id, title, competition_event, position, date, description, certificate_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [ach.id, ach.student_id, ach.title, ach.competition_event, ach.position, ach.date, ach.description, ach.certificate_url, ach.created_at]
      });
    }
  }

  console.log('[DB] Seeding completed successfully!');
}

export async function initDb() {
  const db = getDb();

  // Enable foreign keys
  await db.execute('PRAGMA foreign_keys = ON;');

  // 1. Users table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('SUPER_ADMIN', 'OFFICE_ADMIN', 'STAFF', 'STUDENT', 'PARENT')),
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      avatar_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Passkey / WebAuthn Credentials table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS passkey_credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      credential_id TEXT UNIQUE NOT NULL,
      public_key TEXT NOT NULL,
      counter INTEGER DEFAULT 0,
      transports TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 3. Academic Years table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS academic_years (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      is_current INTEGER DEFAULT 0,
      start_date DATE,
      end_date DATE
    );
  `);

  // 4. Classes table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      display_order INTEGER NOT NULL,
      numeric_order INTEGER NOT NULL
    );
  `);

  // 5. Teachers / Staff table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      staff_id TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      gender TEXT CHECK(gender IN ('Male', 'Female')),
      phone TEXT,
      email TEXT,
      qualification TEXT,
      designation TEXT DEFAULT 'Teacher',
      photo_url TEXT,
      joining_date DATE,
      assigned_class_id INTEGER,
      assigned_wing TEXT DEFAULT 'Boys',
      assigned_section_id INTEGER,
      assigned_class_id_2 INTEGER,
      assigned_wing_2 TEXT DEFAULT 'Boys',
      assigned_section_id_2 INTEGER,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 6. Sections table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      name TEXT NOT NULL CHECK(name IN ('Boys', 'Girls')),
      gender TEXT NOT NULL CHECK(gender IN ('Boys', 'Girls')),
      class_teacher_id INTEGER,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (class_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
      UNIQUE(class_id, name)
    );
  `);

  // 7. Subjects table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT,
      class_id INTEGER,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    );
  `);

  // 8. Teacher Assignments
  await db.execute(`
    CREATE TABLE IF NOT EXISTS teacher_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      section_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      UNIQUE(teacher_id, section_id, subject_id)
    );
  `);

  // 9. Parents table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS parents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      father_name TEXT,
      mother_name TEXT,
      guardian_name TEXT,
      primary_phone TEXT NOT NULL,
      alt_phone TEXT,
      address TEXT,
      emergency_contact TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 10. Students table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      admission_no TEXT UNIQUE NOT NULL,
      roll_no INTEGER NOT NULL,
      full_name TEXT NOT NULL,
      dob DATE,
      gender TEXT NOT NULL CHECK(gender IN ('Boys', 'Girls')),
      class_id INTEGER NOT NULL,
      section_id INTEGER NOT NULL,
      photo_url TEXT,
      admission_date DATE,
      status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive', 'Graduated', 'Transferred')),
      academic_year_id INTEGER,
      parent_id INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE RESTRICT,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE RESTRICT,
      FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
      FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE SET NULL
    );
  `);

  // 11. Attendance table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      section_id INTEGER NOT NULL,
      date DATE NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Present', 'Absent', 'Late')),
      remarks TEXT,
      marked_by_user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
      UNIQUE(student_id, date)
    );
  `);

  // 12. Exams table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      academic_year_id INTEGER,
      name TEXT NOT NULL,
      start_date DATE,
      end_date DATE,
      status TEXT DEFAULT 'Published' CHECK(status IN ('Draft', 'Submitted', 'Published')),
      FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
    );
  `);

  // 13. Exam Subjects table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS exam_subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      max_marks REAL DEFAULT 100,
      pass_marks REAL DEFAULT 40,
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      UNIQUE(exam_id, subject_id, class_id)
    );
  `);

  // 14. Marks table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS marks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      marks_obtained REAL NOT NULL,
      grade TEXT,
      is_pass INTEGER DEFAULT 1,
      remarks TEXT,
      entered_by_user_id INTEGER,
      status TEXT DEFAULT 'Approved' CHECK(status IN ('Draft', 'Submitted', 'Approved')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      UNIQUE(exam_id, subject_id, student_id)
    );
  `);

  // 15. Fees table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      academic_year_id INTEGER,
      month TEXT NOT NULL,
      amount REAL DEFAULT 100,
      status TEXT DEFAULT 'Pending' CHECK(status IN ('Paid', 'Pending', 'Partially Paid')),
      paid_amount REAL DEFAULT 0,
      payment_date DATE,
      payment_mode TEXT CHECK(payment_mode IN ('Cash', 'UPI', 'Bank Transfer', 'Online', NULL)),
      payment_reference TEXT,
      receipt_no TEXT,
      collected_by_user_id INTEGER,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
      UNIQUE(student_id, month)
    );
  `);

  // 16. Achievements table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      title TEXT NOT NULL,
      competition_event TEXT NOT NULL,
      position TEXT NOT NULL,
      date DATE,
      description TEXT,
      certificate_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
  `);

  // 17. Announcements table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      priority TEXT DEFAULT 'Medium' CHECK(priority IN ('High', 'Medium', 'Low')),
      target_audience TEXT DEFAULT 'All' CHECK(target_audience IN ('All', 'Students', 'Parents', 'Staff')),
      is_published INTEGER DEFAULT 1,
      published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by_user_id INTEGER
    );
  `);

  // 18. Events table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      event_date DATE NOT NULL,
      event_time TEXT,
      location TEXT,
      image_url TEXT,
      is_published INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 19. Gallery table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'Campus Life',
      image_url TEXT NOT NULL,
      event_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
    );
  `);

  // 20. Correction Requests table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS correction_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      field_name TEXT NOT NULL,
      old_value TEXT,
      requested_value TEXT NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Rejected')),
      review_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
  `);

  // 21. Audit Logs table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT,
      user_role TEXT,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      target_id TEXT,
      previous_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 22. Website Settings table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS website_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    INSERT OR IGNORE INTO website_settings (key, value) VALUES 
    ('standard_monthly_fee', '100'),
    ('fee_currency', '₹');
  `);

  // 23. Salaries table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS salaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      academic_year_id INTEGER,
      month TEXT NOT NULL,
      basic_salary REAL NOT NULL DEFAULT 0,
      allowance REAL NOT NULL DEFAULT 0,
      deduction REAL NOT NULL DEFAULT 0,
      other_adjustment REAL NOT NULL DEFAULT 0,
      net_salary REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Paid', 'Pending', 'Processing')),
      payment_date DATE,
      payment_mode TEXT CHECK(payment_mode IN ('Bank Transfer', 'Cash', 'UPI', 'Cheque', NULL)),
      payment_reference TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
      FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
      UNIQUE(teacher_id, month)
    );
  `);

  // Safe migrations for newly added columns
  try {
    await db.execute('ALTER TABLE salaries ADD COLUMN other_adjustment REAL DEFAULT 0;');
  } catch (e) {}
  try {
    await db.execute('ALTER TABLE teachers ADD COLUMN assigned_class_id INTEGER;');
  } catch (e) {}
  try {
    await db.execute('ALTER TABLE teachers ADD COLUMN assigned_wing TEXT DEFAULT \'Boys\';');
  } catch (e) {}
  try {
    await db.execute('ALTER TABLE teachers ADD COLUMN assigned_section_id INTEGER;');
  } catch (e) {}
  try {
    await db.execute('ALTER TABLE teachers ADD COLUMN assigned_class_id_2 INTEGER;');
  } catch (e) {}
  try {
    await db.execute('ALTER TABLE teachers ADD COLUMN assigned_wing_2 TEXT DEFAULT \'Boys\';');
  } catch (e) {}
  try {
    await db.execute('ALTER TABLE teachers ADD COLUMN assigned_section_id_2 INTEGER;');
  } catch (e) {}

  // 24. Staff Permissions table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS staff_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      section_id INTEGER NOT NULL,
      can_manage_marks INTEGER DEFAULT 1,
      can_manage_attendance INTEGER DEFAULT 1,
      can_manage_fees INTEGER DEFAULT 1,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
      UNIQUE(teacher_id, section_id)
    );
  `);
  try {
    await db.execute('ALTER TABLE staff_permissions ADD COLUMN can_manage_fees INTEGER DEFAULT 1;');
  } catch (e) {}

  // Synchronize 7 Faculty Class Assignments if not yet set
  try {
    const unassignedCheck = await db.execute('SELECT count(*) as c FROM teachers WHERE assigned_section_id IS NOT NULL');
    if (Number(unassignedCheck.rows[0]?.c || 0) < 7) {
      const assignments = [
        { id: 28, class_id: 36, wing: 'Boys', section_id: 71 }, // +2 Boys
        { id: 29, class_id: 30, wing: 'Boys', section_id: 59 }, // Class 6 Boys
        { id: 30, class_id: 27, wing: 'Boys', section_id: 53 }, // Class 3 Boys
        { id: 31, class_id: 25, wing: 'Boys', section_id: 49 }, // Class 1 Boys
        { id: 32, class_id: 26, wing: 'Boys', section_id: 51 }, // Class 2 Boys
        { id: 33, class_id: 29, wing: 'Boys', section_id: 57 }, // Class 5 Boys
        { id: 34, class_id: 28, wing: 'Boys', section_id: 55 }, // Class 4 Boys
      ];
      for (const a of assignments) {
        await db.execute({
          sql: 'UPDATE teachers SET assigned_class_id = ?, assigned_wing = ?, assigned_section_id = ? WHERE id = ?',
          args: [a.class_id, a.wing, a.section_id, a.id]
        });
        await db.execute({
          sql: 'UPDATE sections SET class_teacher_id = ? WHERE id = ?',
          args: [a.id, a.section_id]
        });
        await db.execute({
          sql: 'INSERT INTO staff_permissions (teacher_id, section_id, can_manage_marks, can_manage_attendance, can_manage_fees) VALUES (?, ?, 1, 1, 1) ON CONFLICT(teacher_id, section_id) DO UPDATE SET can_manage_marks = 1, can_manage_attendance = 1, can_manage_fees = 1',
          args: [a.id, a.section_id]
        });
      }
    }
  } catch (e) {
    console.warn('[DB] Notice syncing faculty assignments:', e);
  }

  // Indexes
  await db.execute('CREATE INDEX IF NOT EXISTS idx_students_class_section ON students(class_id, section_id);');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_students_admission_no ON students(admission_no);');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date, section_id);');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_fees_month_status ON fees(month, status);');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_marks_exam_student ON marks(exam_id, student_id);');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_salaries_month_status ON salaries(month, status);');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_staff_permissions ON staff_permissions(teacher_id, section_id);');

  // Check if database needs initial seeding
  const sCheck = await db.execute('SELECT count(*) as c FROM students');
  const count = Number(sCheck.rows[0]?.c || 0);
  if (count === 0) {
    console.log('[DB] Students table is empty. Triggering automatic data seeding...');
    await seedInitialData(db);
  } else {
    // Also check if salaries or other tables need initial seed
    const salCheck = await db.execute('SELECT count(*) as c FROM salaries');
    if (Number(salCheck.rows[0]?.c || 0) === 0) {
      console.log('[DB] Salaries table is empty. Seeding initial data...');
      await seedInitialData(db);
    }
    console.log(`[DB] Database verified. Found ${count} enrolled students.`);
  }

  isInitialized = true;
  return db;
}

export async function ensureDbReady(): Promise<Client> {
  const db = getDb();
  if (isInitialized) return db;

  try {
    const res = await db.execute('SELECT count(*) as c FROM students');
    const count = Number(res.rows[0]?.c || 0);
    if (count > 0) {
      isInitialized = true;
      return db;
    }
  } catch (err) {
    console.log('[DB] Schema check failed, running initDb()...');
  }

  await initDb();
  return db;
}
