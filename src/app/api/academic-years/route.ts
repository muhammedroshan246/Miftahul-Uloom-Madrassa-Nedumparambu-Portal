
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

      return NextResponse.json({ success: true, message: `Successfully promoted ${studentIds.length} students to new class!` });
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

      return NextResponse.json({ success: true, message: `Graduated ${studentIds.length} students to Alumni status.` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
