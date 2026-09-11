import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getDb } from '@/lib/db';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN', 'STAFF']);
  if ('status' in auth) return auth;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'gallery';
    const title = (formData.get('title') as string) || '';
    const studentId = formData.get('studentId') ? Number(formData.get('studentId')) : null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // 1. Validate File Type
    const mimeType = file.type.toLowerCase();
    const ext = ALLOWED_MIME_TYPES[mimeType];
    if (!ext) {
      return NextResponse.json({
        error: 'Invalid file format. Only JPG, JPEG, PNG, and WebP images are allowed.'
      }, { status: 400 });
    }

    // 2. Validate File Size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: `File is too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Maximum allowed size is 5 MB.`
      }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const randomHex = crypto.randomBytes(6).toString('hex');
    const timestamp = Date.now();
    const cleanCategory = ['branding', 'hero', 'principal', 'gallery', 'events', 'teachers', 'students', 'achievements'].includes(category)
      ? category
      : 'gallery';

    const filename = `${cleanCategory}_${timestamp}_${randomHex}${ext}`;

    let relativeUrl = '';
    let isPrivate = false;

    if (cleanCategory === 'students') {
      // 3. SECURE STORAGE: Store outside public directory
      const storageDir = path.join(process.cwd(), 'storage', 'students');
      await fs.mkdir(storageDir, { recursive: true });
      const filePath = path.join(storageDir, filename);
      await fs.writeFile(filePath, buffer);

      relativeUrl = `/api/media/student-photo?file=${filename}`;
      isPrivate = true;

      // If studentId provided, update student record
      if (studentId) {
        const db = getDb();
        await db.execute({
          sql: 'UPDATE students SET photo_url = ? WHERE id = ?',
          args: [relativeUrl, studentId]
        });
      }
    } else {
      // Public Storage
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', cleanCategory);
      await fs.mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, filename);
      await fs.writeFile(filePath, buffer);

      relativeUrl = `/uploads/${cleanCategory}/${filename}`;
      isPrivate = false;

      // If category is branding, hero, or principal, optionally update website_settings
      const db = getDb();
      if (cleanCategory === 'branding') {
        await db.execute({
          sql: 'INSERT INTO website_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP',
          args: ['logo_url', relativeUrl]
        });
      } else if (cleanCategory === 'hero') {
        await db.execute({
          sql: 'INSERT INTO website_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP',
          args: ['hero_image_url', relativeUrl]
        });
      } else if (cleanCategory === 'principal') {
        await db.execute({
          sql: 'INSERT INTO website_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP',
          args: ['principal_photo_url', relativeUrl]
        });
      }
    }

    await logAudit({
      user: auth.user,
      action: 'IMAGE_UPLOADED',
      module: 'Media',
      targetId: filename,
      newValue: { category: cleanCategory, filename, url: relativeUrl, size: file.size, isPrivate }
    });

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully!',
      url: relativeUrl,
      filename,
      category: cleanCategory,
      size: file.size,
      mimeType,
      isPrivate
    });
  } catch (error: any) {
    console.error('Image upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload image' }, { status: 500 });
  }
}