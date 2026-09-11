import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { signToken, createAuthCookie, TokenPayload } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { studentId } = await req.json();

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    const db = getDb();

    // Fetch verified active student
    const sRes = await db.execute({
      sql: `
        SELECT 
          s.id, s.user_id, s.admission_no, s.roll_no, s.full_name, s.gender, s.photo_url,
          s.class_id, s.section_id, s.status,
          c.name as class_name,
          sec.name as section_name,
          u.username
        FROM students s
        JOIN classes c ON s.class_id = c.id
        JOIN sections sec ON s.section_id = sec.id
        JOIN users u ON s.user_id = u.id
        WHERE s.id = ? AND COALESCE(s.status, 'Active') = 'Active'
        LIMIT 1
      `,
      args: [Number(studentId)]
    });

    if (sRes.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Selected student not found or currently inactive in Madrassa records.' 
      }, { status: 404 });
    }

    const student: any = sRes.rows[0];

    const payload: TokenPayload = {
      id: Number(student.user_id),
      username: String(student.username || student.admission_no),
      role: 'STUDENT',
      full_name: String(student.full_name),
      student_id: Number(student.id),
      class_id: Number(student.class_id),
      section_id: Number(student.section_id),
    };

    // Sign secure JWT session token
    const token = await signToken(payload);

    await logAudit({
      user: payload,
      action: 'STUDENT_NO_PASSWORD_LOGIN',
      module: 'Auth',
      targetId: String(student.id),
      newValue: { 
        studentName: student.full_name, 
        rollNo: student.roll_no, 
        className: student.class_name, 
        wing: student.section_name 
      }
    });

    const response = NextResponse.json({
      success: true,
      redirect: '/student',
      student: {
        id: student.id,
        fullName: student.full_name,
        admissionNo: student.admission_no,
        rollNo: student.roll_no,
        className: student.class_name,
        sectionName: student.section_name,
        gender: student.gender
      }
    });

    // Set secure HTTP-only cookie
    createAuthCookie(response, token);

    return response;
  } catch (error: any) {
    console.error('Student session creation error:', error);
    return NextResponse.json({ error: 'Internal server error while logging in student' }, { status: 500 });
  }
}
