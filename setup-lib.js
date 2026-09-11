const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
ensureDir('src/lib');
ensureDir('scripts');

// 1. src/lib/constants.ts
const constantsTs = `
export const MADRASSA_NAME = "Mifthahul Uloom Higher Secondary Madrassa";
export const MADRASSA_TAGLINE = "Nurturing Islamic Excellence, Moral Integrity & Academic Eminence";
export const MADRASSA_LOCATION = "Kozhikode, Kerala, India";
export const MADRASSA_PHONE = "+91 495 272 8840";
export const MADRASSA_EMAIL = "office@mifthahululoom.edu.in";
export const MONTHLY_FEE_AMOUNT = 100; // Rs. 100 per student per month

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  OFFICE_ADMIN: "OFFICE_ADMIN",
  STAFF: "STAFF",
  STUDENT: "STUDENT",
  PARENT: "PARENT",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const CLASSES = [
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "+1",
  "+2",
];

export const SECTIONS = ["Boys", "Girls"] as const;

export const STANDARD_SUBJECTS = {
  primary: [
    { name: "Quran & Tajweed", code: "QUR-P" },
    { name: "Islamic Studies (Fiqh & Aqeedah)", code: "ISL-P" },
    { name: "Arabic Language", code: "ARB-P" },
    { name: "English", code: "ENG-P" },
    { name: "Mathematics", code: "MAT-P" },
    { name: "Environmental Science", code: "EVS-P" },
    { name: "Malayalam", code: "MAL-P" },
  ],
  secondary: [
    { name: "Quran & Tafseer", code: "QUR-S" },
    { name: "Hadith & Fiqh", code: "ISL-S" },
    { name: "Arabic Literature & Grammar", code: "ARB-S" },
    { name: "English", code: "ENG-S" },
    { name: "Mathematics", code: "MAT-S" },
    { name: "General Science", code: "SCI-S" },
    { name: "Social Science", code: "SOC-S" },
    { name: "Malayalam / Hindi", code: "LAN-S" },
  ],
  higherSecondary: [
    { name: "Advanced Islamic Jurisprudence & Tafseer", code: "ISL-HS" },
    { name: "Higher Arabic Literature & Rhetoric", code: "ARB-HS" },
    { name: "English Core", code: "ENG-HS" },
    { name: "Physics / Business Studies", code: "OPT1-HS" },
    { name: "Chemistry / Accountancy", code: "OPT2-HS" },
    { name: "Biology / Economics", code: "OPT3-HS" },
    { name: "Computer Science / Mathematics", code: "OPT4-HS" },
  ],
};

export const EXAM_TYPES = [
  "First Term Monthly Assessment",
  "First Mid-Term Examination",
  "Quarterly Examination",
  "Second Mid-Term Examination",
  "Half-Yearly Examination",
  "Model Examination",
  "Annual Grand Examination",
];

export const MONTHS = [
  "June 2026",
  "July 2026",
  "August 2026",
  "September 2026",
  "October 2026",
  "November 2026",
  "December 2026",
  "January 2027",
  "February 2027",
  "March 2027",
  "April 2027",
  "May 2027",
];
`;
fs.writeFileSync('src/lib/constants.ts', constantsTs.trim());

// 2. src/lib/db.ts
const dbTs = `
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
  await db.execute(\`
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
  \`);

  // 2. Passkey / WebAuthn Credentials table
  await db.execute(\`
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
  \`);

  // 3. Academic Years table
  await db.execute(\`
    CREATE TABLE IF NOT EXISTS academic_years (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      is_current INTEGER DEFAULT 0,
      start_date DATE,
      end_date DATE
    );
  \`);

  // 4. Classes table
  await db.execute(\`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      display_order INTEGER NOT NULL,
      numeric_order INTEGER NOT NULL
    );
  \`);

  // 5. Teachers / Staff table
  await db.execute(\`
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
  \`);

  // 6. Sections table (Each class has Boys and Girls sections)
  await db.execute(\`
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
  \`);

  // 7. Subjects table
  await db.execute(\`
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT,
      class_id INTEGER,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    );
  \`);

  // 8. Teacher Assignments (Subjects and Classes assigned to teacher)
  await db.execute(\`
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
  \`);

  // 9. Parents table
  await db.execute(\`
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
  \`);

  // 10. Students table
  await db.execute(\`
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
  \`);

  // 11. Attendance table
  await db.execute(\`
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
  \`);

  // 12. Exams table
  await db.execute(\`
    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      academic_year_id INTEGER,
      name TEXT NOT NULL,
      start_date DATE,
      end_date DATE,
      status TEXT DEFAULT 'Published' CHECK(status IN ('Draft', 'Submitted', 'Published')),
      FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
    );
  \`);

  // 13. Exam Subjects table
  await db.execute(\`
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
  \`);

  // 14. Marks table
  await db.execute(\`
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
  \`);

  // 15. Fees table (Rs. 100/mo)
  await db.execute(\`
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
  \`);

  // 16. Achievements table
  await db.execute(\`
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
  \`);

  // 17. Announcements table
  await db.execute(\`
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
  \`);

  // 18. Events table
  await db.execute(\`
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
  \`);

  // 19. Gallery table
  await db.execute(\`
    CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'Campus Life',
      image_url TEXT NOT NULL,
      event_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
    );
  \`);

  // 20. Correction Requests (from Students/Parents)
  await db.execute(\`
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
  \`);

  // 21. Audit Logs table
  await db.execute(\`
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
  \`);

  // 22. Website Settings table
  await db.execute(\`
    CREATE TABLE IF NOT EXISTS website_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  \`);

  // Create useful indexes for fast search and query performance
  await db.execute('CREATE INDEX IF NOT EXISTS idx_students_class_section ON students(class_id, section_id);');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_students_admission_no ON students(admission_no);');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date, section_id);');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_fees_month_status ON fees(month, status);');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_marks_exam_student ON marks(exam_id, student_id);');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);');

  console.log('Database initialized successfully with all tables and indexes.');
}
`;
fs.writeFileSync('src/lib/db.ts', dbTs.trim());

// 3. src/lib/auth.ts
const authTs = `
import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from './db';
import { Role, ROLES } from './constants';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'mifthahul_uloom_secure_jwt_secret_key_2026_madrassa'
);

export interface TokenPayload {
  id: number;
  username: string;
  role: Role;
  full_name: string;
  email?: string;
  phone?: string;
  student_id?: number;
  parent_id?: number;
  teacher_id?: number;
  class_id?: number;
  section_id?: number;
}

export async function hashPassword(plainText: string): Promise<string> {
  return await bcrypt.hash(plainText, 10);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(plainText, hash);
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch (err) {
    return null;
  }
}

export async function getSessionUser(req?: NextRequest): Promise<TokenPayload | null> {
  let token: string | undefined;

  if (req) {
    // Check Authorization header or Cookie
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = req.cookies.get('mu_token')?.value;
    }
  } else {
    try {
      const cookieStore = cookies();
      token = cookieStore.get('mu_token')?.value;
    } catch {
      token = undefined;
    }
  }

  if (!token) return null;
  return await verifyToken(token);
}

export function createAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: 'mu_token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: 'mu_token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function requireAuth(req: NextRequest, allowedRoles?: Role[]): Promise<{ user: TokenPayload } | NextResponse> {
  const user = await getSessionUser(req);
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden. Insufficient permissions.' }, { status: 403 });
    }
  }

  return { user };
}
`;
fs.writeFileSync('src/lib/auth.ts', authTs.trim());

// 4. src/lib/audit.ts
const auditTs = `
import { getDb } from './db';
import { TokenPayload } from './auth';

export async function logAudit({
  user,
  action,
  module,
  targetId,
  previousValue,
  newValue,
  ipAddress,
}: {
  user?: TokenPayload | { id?: number; username?: string; role?: string } | null;
  action: string;
  module: string;
  targetId?: string | number;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
}) {
  try {
    const db = getDb();
    const prevStr = previousValue ? (typeof previousValue === 'string' ? previousValue : JSON.stringify(previousValue)) : null;
    const newStr = newValue ? (typeof newValue === 'string' ? newValue : JSON.stringify(newValue)) : null;
    
    await db.execute({
      sql: \`
        INSERT INTO audit_logs (user_id, username, user_role, action, module, target_id, previous_value, new_value, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      \`,
      args: [
        user?.id || null,
        user?.username || 'SYSTEM',
        user?.role || 'SYSTEM',
        action,
        module,
        targetId ? String(targetId) : null,
        prevStr,
        newStr,
        ipAddress || '127.0.0.1',
      ],
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
`;
fs.writeFileSync('src/lib/audit.ts', auditTs.trim());

console.log('src/lib files created successfully!');
