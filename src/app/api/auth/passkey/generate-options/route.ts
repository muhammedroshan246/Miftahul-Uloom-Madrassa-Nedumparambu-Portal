
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { username, mode } = body;
    const db = getDb();

    // Challenge for passkey (browser WebAuthn)
    const challenge = Buffer.from(Math.random().toString(36).substring(2) + Date.now().toString(36)).toString('base64url');

    if (mode === 'register') {
      const user = await getSessionUser(req);
      if (!user) {
        return NextResponse.json({ error: 'Please login to register a passkey' }, { status: 401 });
      }

      return NextResponse.json({
        options: {
          challenge,
          rp: { name: 'Mifthahul Uloom Madrassa ERP', id: req.nextUrl.hostname },
          user: {
            id: Buffer.from(String(user.id)).toString('base64url'),
            name: user.username,
            displayName: user.full_name,
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
          timeout: 60000,
          attestation: 'none',
          authenticatorSelection: {
            userVerification: 'preferred',
            residentKey: 'preferred'
          }
        },
        challenge
      });
    } else {
      // Login mode
      let allowCredentials: any[] = [];
      if (username) {
        const uRes = await db.execute({
          sql: 'SELECT id FROM users WHERE username = ? LIMIT 1',
          args: [username.trim()]
        });
        if (uRes.rows.length > 0) {
          const credRes = await db.execute({
            sql: 'SELECT credential_id FROM passkey_credentials WHERE user_id = ?',
            args: [uRes.rows[0].id]
          });
          allowCredentials = credRes.rows.map(r => ({
            id: String(r.credential_id),
            type: 'public-key'
          }));
        }
      }

      return NextResponse.json({
        options: {
          challenge,
          timeout: 60000,
          rpId: req.nextUrl.hostname,
          allowCredentials,
          userVerification: 'preferred'
        },
        challenge
      });
    }
  } catch (error: any) {
    console.error('Passkey options error:', error);
    return NextResponse.json({ error: 'Failed to generate passkey options' }, { status: 500 });
  }
}
