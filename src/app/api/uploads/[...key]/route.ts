import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
};

/** Serves locally uploaded images (dev/preview fallback when R2 is not configured). */
export async function GET(_req: NextRequest, { params }: { params: { key: string[] } }) {
  const key = (params.key ?? []).join('/');
  if (!key || key.includes('..') || key.includes('\0')) {
    return new NextResponse('Bad Request', { status: 400 });
  }
  const root = path.join(process.cwd(), 'uploads');
  const file = path.join(root, key);
  if (!file.startsWith(root + path.sep)) {
    return new NextResponse('Not Found', { status: 404 });
  }
  try {
    const data = await fs.promises.readFile(file);
    const ext = file.split('.').pop()?.toLowerCase() || '';
    return new NextResponse(data, {
      headers: {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Not Found', { status: 404 });
  }
}
