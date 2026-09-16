import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Reports whether the server can see a valid session cookie (login diagnostics). */
export async function GET() {
  const t = cookies().get('platform_session')?.value;
  const state = !t ? 'missing' : verifySessionToken(t) ? 'valid' : 'invalid';
  return NextResponse.json({ cookie: state });
}
