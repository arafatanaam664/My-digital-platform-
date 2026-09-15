import { prisma } from '@/lib/db';
import { parseUA } from '@/lib/utils';
import { recordView } from '@/lib/track';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    let body: { path?: unknown; referrer?: unknown; s?: unknown } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const path = typeof body.path === 'string' ? body.path.slice(0, 300) : '/';
    const referrer = typeof body.referrer === 'string' ? body.referrer.slice(0, 300) : null;
    const sessionId = typeof body.s === 'string' ? body.s.slice(0, 64) : null;
    const ua = (req.headers.get('user-agent') || '').slice(0, 300);
    const { device, browser } = parseUA(ua);

    await recordView({ path, referrer, userAgent: ua, device, browser, sessionId });
    return new Response('ok');
  } catch {
    return new Response('err', { status: 500 });
  }
}
