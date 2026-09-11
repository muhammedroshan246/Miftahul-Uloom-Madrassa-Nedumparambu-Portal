import { createClient, Client } from '@libsql/client';
import path from 'path';

let client: Client;

export function getDb(): Client {
  if (!client) {
    const dbPath = process.env.DATABASE_URL || 'file:./madrassa.db';
    client = createClient({
      url: dbPath,
    });
  }
  return client;
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
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 6. Sections table (Each class has Boys and Girls sections)
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

  // 8. Teacher Assignments (Subjects and Classes assigned to teacher)
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

  // 15. Fees table (Rs. 100/mo)
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

  // 20. Correction Requests (from Students/Parents)
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

  // 23. Salaries / Payroll table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS salaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      academic_year_id INTEGER,
      month TEXT NOT NULL,
      basic_salary REAL NOT NULL DEFAULT 0,
      allowance REAL NOT NULL DEFAULT 0,
      deduction REAL NOT NULL DEFAULT 0,
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

  // Create useful indexes for fast search and query performance
  await db.execute('CREATE INDEX IF NOT EXISTS idx_students_class_section ON students(class_id, section_id);');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_students_admission_no ON students(admission_no);');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date, section_id);');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_fees_month_status ON fees(month, status);');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_marks_exam_student ON marks(exam_id, student_id);');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_salaries_month_status ON salaries(month, status);');

  console.log('Database initialized successfully with all tables and indexes.');
}