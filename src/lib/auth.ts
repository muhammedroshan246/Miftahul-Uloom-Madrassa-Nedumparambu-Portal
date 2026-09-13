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
    const isSadrAllowed = user.role === 'SADR' && (allowedRoles.includes('OFFICE_ADMIN') || allowedRoles.includes('SUPER_ADMIN') || allowedRoles.includes('STAFF') || allowedRoles.includes('SADR'));
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    
    if (!allowedRoles.includes(user.role) && !isSadrAllowed && !isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden. Insufficient permissions.' }, { status: 403 });
    }
  }

  return { user };
}