import crypto from 'crypto';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

const COOKIE = 'platform_session';

function secret(): string {
  return process.env.SESSION_SECRET || 'dev-secret-change-me';
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('hex');
}

export function createSessionToken(userId: number): string {
  const p = Buffer.from(JSON.stringify({ u: userId, exp: Date.now() + 7 * 864e5 })).toString('base64url');
  return `${p}.${sign(p)}`;
}

export function verifySessionToken(token: string): number | null {
  const [p, s] = token.split('.');
  if (!p || !s) return null;
  if (sign(p) !== s) return null;
  try {
    const data = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
    if (typeof data.u !== 'number' || data.exp < Date.now()) return null;
    return data.u;
  } catch {
    return null;
  }
}

export function setSessionCookie(token: string) {
  // SameSite=None+Secure so the session cookie survives when the site is
  // embedded in a cross-origin frame (e.g. preview iframes); lax for local dev.
  const isProd = process.env.NODE_ENV === 'production';
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 86400,
  });
}

export async function getSessionUser() {
  // TEMPORARY preview bypass: ADMIN_BYPASS_AUTH=1 → act as the first admin user
  // without a session cookie. Remove/flip the env var to restore protection.
  if (process.env.ADMIN_BYPASS_AUTH === '1') {
    const [admin] = await prisma.user.findMany({ where: { role: 'admin', isActive: true }, take: 1 });
    if (admin) return admin;
  }
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const uid = verifySessionToken(token);
  if (!uid) return null;
  const user = await prisma.user.findUnique({ where: { id: uid } });
  return user && user.isActive ? user : null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

export function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}
