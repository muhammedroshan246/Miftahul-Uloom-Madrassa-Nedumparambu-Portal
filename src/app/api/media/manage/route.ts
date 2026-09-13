import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { requireAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

const CATEGORIES = ['branding', 'hero', 'principal', 'gallery', 'events', 'teachers', 'achievements', 'students'];

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const db = getDb();
    const settingsRes = await db.execute('SELECT key, value FROM website_settings');
    const settings: Record<string, string> = {};
    for (const r of settingsRes.rows) {
      settings[String(r.key)] = String(r.value);
    }

    const mediaList: any[] = [];

    // Scan public/uploads folders
    for (const cat of CATEGORIES) {
      const isStudentCat = cat === 'students';
      const dirPath = isStudentCat 
        ? path.join(process.cwd(), 'storage', 'students')
        : path.join(process.cwd(), 'public', 'uploads', cat);

      try {
        const files = await fs.readdir(dirPath);
        for (const file of files) {
          if (file.startsWith('.')) continue;
          const filePath = path.join(dirPath, file);
          const stats = await fs.stat(filePath);
          
          if (stats.isFile()) {
            const url = isStudentCat 
              ? `/api/media/student-photo?file=${file}` 
              : `/uploads/${cat}/${file}`;

            const isActiveLogo = settings['logo_url'] === url;
            const isActiveHero = settings['hero_image_url'] === url;
            const isActivePrincipal = settings['principal_photo_url'] === url;

            mediaList.push({
              filename: file,
              category: cat,
              url,
              size: stats.size,
              createdAt: stats.birthtime || stats.mtime,
              isPrivate: isStudentCat,
              isActive: isActiveLogo || isActiveHero || isActivePrincipal,
              activeLabel: isActiveLogo ? 'Active Logo' : isActiveHero ? 'Active Hero' : isActivePrincipal ? 'Active Principal' : null
            });
          }
        }
      } catch {
        // Directory may not exist yet or empty
      }
    }

    mediaList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      media: mediaList,
      totalCount: mediaList.length,
      settings
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to list media' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const { action, key, url, title, category } = await req.json();
    const db = getDb();

    if (action === 'SET_ACTIVE_ASSET' && key && url) {
      await db.execute({
        sql: `
          INSERT INTO website_settings (key, value, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        `,
        args: [key, url]
      });

      await logAudit({
        user: auth.user,
        action: 'WEBSITE_ASSET_SET',
        module: 'Media',
        targetId: key,
        newValue: { key, url }
      });

      return NextResponse.json({ success: true, message: `Updated active ${key}!` });
    }

    if (action === 'ADD_TO_GALLERY' && url) {
      await db.execute({
        sql: 'INSERT INTO gallery (title, category, image_url) VALUES (?, ?, ?)',
        args: [title || 'Campus Life', category || 'Campus Life', url]
      });
      return NextResponse.json({ success: true, message: 'Added to public gallery archive' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const filename = searchParams.get('filename');

    if (!category || !filename) {
      return NextResponse.json({ error: 'category and filename are required' }, { status: 400 });
    }

    const safeFilename = path.basename(filename);
    const isStudentCat = category === 'students';
    const filePath = isStudentCat
      ? path.join(process.cwd(), 'storage', 'students', safeFilename)
      : path.join(process.cwd(), 'public', 'uploads', category, safeFilename);

    try {
      await fs.unlink(filePath);
    } catch (e: any) {
      console.warn('File unlink error (may already be deleted):', e.message);
    }

    const relativeUrl = isStudentCat 
      ? `/api/media/student-photo?file=${safeFilename}` 
      : `/uploads/${category}/${safeFilename}`;

    // Clean up references in DB if any
    const db = getDb();
    if (isStudentCat) {
      await db.execute({
        sql: "UPDATE students SET photo_url = NULL WHERE photo_url LIKE ?",
        args: [`%${safeFilename}%`]
      });
    } else if (category === 'gallery') {
      await db.execute({
        sql: "DELETE FROM gallery WHERE image_url = ?",
        args: [relativeUrl]
      });
    } else if (category === 'teachers') {
      await db.execute({
        sql: "UPDATE teachers SET photo_url = NULL WHERE photo_url = ?",
        args: [relativeUrl]
      });
    }

    await logAudit({
      user: auth.user,
      action: 'IMAGE_DELETED',
      module: 'Media',
      targetId: safeFilename,
      newValue: { category, filename: safeFilename }
    });

    return NextResponse.json({ success: true, message: 'Image deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}