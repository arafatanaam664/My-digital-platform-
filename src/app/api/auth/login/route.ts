import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createSessionToken, setSessionCookie, verifyPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let email = '';
  let password = '';
  try {
    const data = await req.json();
    email = String(data.email || '').trim();
    password = String(data.password || '');
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
  }

  const token = createSessionToken(user.id);
  setSessionCookie(token);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => {});

  return NextResponse.json({ ok: true, name: user.name, role: user.role });
}
