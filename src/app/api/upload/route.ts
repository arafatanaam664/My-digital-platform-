import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { requireUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

function r2Config() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, NEXT_PUBLIC_R2_BASE_URL } = process.env;
  if (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET && NEXT_PUBLIC_R2_BASE_URL) {
    return {
      client: new S3Client({
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
        region: 'auto',
      }),
      bucket: R2_BUCKET,
      baseUrl: NEXT_PUBLIC_R2_BASE_URL.replace(/\/+$/, ''),
    };
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'لا يوجد ملف مرفق' }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: 'الأنواع المسموحة: JPG / PNG / WebP / GIF / AVIF' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'حجم الملف يتجاوز 8MB' }, { status: 400 });
  }

  const body = Buffer.from(await file.arrayBuffer());
  const now = new Date();
  const ym = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'image';
  const key = `content/${ym}/${Date.now()}-${base}.${EXT[file.type]}`;

  // 1) Production: Cloudflare R2 (zero egress fees)
  const cfg = r2Config();
  if (cfg) {
    try {
      await cfg.client.send(
        new PutObjectCommand({
          Bucket: cfg.bucket,
          Key: key,
          Body: body,
          ContentType: file.type,
          CacheControl: 'public, max-age=31536000, immutable',
        })
      );
      return NextResponse.json({ url: `${cfg.baseUrl}/${key}` });
    } catch (e) {
      console.error('R2 upload failed:', e);
      return NextResponse.json({ error: 'فشل الرفع إلى R2 — راجع مفاتيح API' }, { status: 500 });
    }
  }

  // 2) Dev / preview fallback: local disk, served by /api/uploads/[...key]
  try {
    const dest = path.join(process.cwd(), 'uploads', key);
    await fs.promises.mkdir(path.dirname(dest), { recursive: true });
    await fs.promises.writeFile(dest, body);
    return NextResponse.json({ url: `/api/uploads/${key}`, storage: 'local' });
  } catch (e) {
    console.error('Local upload failed:', e);
    return NextResponse.json(
      { error: 'تعذر حفظ الصورة محلياً — في الإنتاج فعّل متغيرات R2_*' },
      { status: 500 }
    );
  }
}
