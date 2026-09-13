import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'OFFICE_ADMIN']);
  if ('status' in auth) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || 'September 2026';

    const db = getDb();
    const res = await db.execute({
      sql: `
        SELECT 
          t.staff_id,
          t.full_name,
          t.designation,
          sal.basic_salary,
          sal.allowance,
          sal.deduction,
          sal.net_salary,
          sal.status,
          sal.payment_date,
          sal.payment_reference
        FROM salaries sal
        JOIN teachers t ON sal.teacher_id = t.id
        WHERE sal.month = ?
        ORDER BY t.staff_id ASC
      `,
      args: [month]
    });

    const rows = res.rows;
    let csv = 'Staff ID,Teacher Name,Designation,Basic Salary (INR),Allowance (INR),Deduction (INR),Net Salary (INR),Payment Status,Payment Date,Payment Reference\n';

    rows.forEach((r: any) => {
      const line = [
        `"${r.staff_id}"`,
        `"${(r.full_name || '').replace(/"/g, '""')}"`,
        `"${(r.designation || '').replace(/"/g, '""')}"`,
        r.basic_salary || 0,
        r.allowance || 0,
        r.deduction || 0,
        r.net_salary || 0,
        `"${r.status || 'Pending'}"`,
        `"${r.payment_date || ''}"`,
        `"${(r.payment_reference || '').replace(/"/g, '""')}"`
      ].join(',');
      csv += line + '\n';
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="Mifthahul_Uloom_Payroll_${month.replace(/\s+/g, '_')}.csv"`
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}