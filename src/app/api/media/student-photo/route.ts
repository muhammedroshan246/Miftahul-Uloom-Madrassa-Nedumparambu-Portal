import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { requireAuth } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

const FALLBACK_AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="#064e3b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

export async function GET(req: NextRequest) {
  // 1. Enforce Authentication
  const auth = await requireAuth(req);
  if ('status' in auth) {
    return new NextResponse('Access Denied: Private student photo requires authentication', { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const file = searchParams.get('file');
    const studentId = searchParams.get('studentId') || searchParams.get('id');

    const db = getDb();
    let filename = file ? path.basename(file) : '';

    // If studentId provided and filename not given, look up student's photo_url
    let targetStudentId = studentId ? Number(studentId) : null;

    if (!filename && targetStudentId) {
      const sRes = await db.execute({
        sql: 'SELECT photo_url FROM students WHERE id = ?',
        args: [targetStudentId]
      });
      if (sRes.rows.length > 0 && sRes.rows[0].photo_url) {
        const photoUrl = String(sRes.rows[0].photo_url);
        const match = photoUrl.match(/file=([^&]+)/);
        if (match) filename = path.basename(match[1]);
      }
    }

    // If filename given but targetStudentId not known, find the student ID
    if (filename && !targetStudentId) {
      const sRes = await db.execute({
        sql: 'SELECT id FROM students WHERE photo_url LIKE ?',
        args: [`%${filename}%`]
      });
      if (sRes.rows.length > 0) {
        targetStudentId = Number(sRes.rows[0].id);
      }
    }

    // 2. Authorize Access according to User Role
    const user = auth.user;
    if (user.role === 'SUPER_ADMIN' || user.role === 'OFFICE_ADMIN' || user.role === 'STAFF') {
      // Authorized staff/admin
    } else if (user.role === 'STUDENT') {
      // Student can only view their own photo
      if (targetStudentId && user.student_id !== targetStudentId) {
        return new NextResponse('Forbidden: You can only view your own student photo', { status: 403 });
      }
    } else if (user.role === 'PARENT') {
      // Parent can only view their child's photo
      if (targetStudentId && user.parent_id) {
        const childCheck = await db.execute({
          sql: 'SELECT 1 FROM students WHERE id = ? AND parent_id = ?',
          args: [targetStudentId, user.parent_id]
        });
        if (childCheck.rows.length === 0) {
          return new NextResponse('Forbidden: You can only view photos of your registered children', { status: 403 });
        }
      }
    } else {
      return new NextResponse('Forbidden: Insufficient permissions', { status: 403 });
    }

    if (!filename) {
      return new NextResponse(FALLBACK_AVATAR_SVG, {
        headers: { 'Content-Type': 'image/svg+xml' }
      });
    }

    // 3. Prevent Directory Traversal & Read from storage/students/
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), 'storage', 'students', safeFilename);

    try {
      const fileBuffer = await fs.readFile(filePath);
      
      let contentType = 'image/jpeg';
      if (safeFilename.endsWith('.png')) contentType = 'image/png';
      else if (safeFilename.endsWith('.webp')) contentType = 'image/webp';

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'private, max-age=3600',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    } catch {
      // Fallback SVG if file on disk is missing
      return new NextResponse(FALLBACK_AVATAR_SVG, {
        headers: { 'Content-Type': 'image/svg+xml' }
      });
    }
  } catch (error: any) {
    console.error('Student photo streaming error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}