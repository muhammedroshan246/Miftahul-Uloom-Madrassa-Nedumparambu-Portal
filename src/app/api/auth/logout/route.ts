
import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie, getSessionUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (user) {
    await logAudit({
      user,
      action: 'LOGOUT',
      module: 'Auth',
      targetId: String(user.id)
    });
  }
  const res = NextResponse.json({ success: true, message: 'Logged out successfully' });
  clearAuthCookie(res);
  return res;
}
