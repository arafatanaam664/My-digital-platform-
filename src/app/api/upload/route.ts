import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { requireUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

export const runtime = 'nodejs';

const MAX_INPUT_BYTES = 8 * 1024 * 1024; // 8MB قبل الضغط
const MAX_WIDTH = 1600; // أقصى عرض — توصية صور جوجل للمحتوى (يكفي LCP وبطاقات + HiDPI)
const WEBP_QUALITY = 82; // جودة مرئية شبه خالية من الفقد مقابل ضغط كبير

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
  if (file.size > MAX_INPUT_BYTES) {
    return NextResponse.json({ error: 'حجم الملف يتجاوز 8MB' }, { status: 400 });
  }

  const original = Buffer.from(await file.arrayBuffer());
  const rawName = file.name.replace(/\.[^.]+$/, '').replace(/\s+/g, ' ').trim() || 'صورة';

  // ---------- Google-optimized pipeline: WebP + compress + downscale ----------
  let outBuf = original;
  let ext = EXT[file.type] || 'webp';
  let contentType = file.type;
  let width = 0;
  let height = 0;

  try {
    if (file.type === 'image/gif') {
      // Animated GIFs: keep as-is (conversion would break animation), read dims only
      const meta = await sharp(original).metadata();
      width = meta.width ?? 0;
      height = meta.height ?? 0;
    } else {
      const { data, info } = await sharp(original)
        .rotate() // EXIF auto-orient — image must display upright for Google
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY, effort: 4, alphaQuality: 85 })
        .toBuffer({ resolveWithObject: true });
      width = info.width;
      height = info.height;
      // Use WebP only when it is genuinely smaller (tiny flat images can invert)
      if (data.length <= original.length) {
        outBuf = data;
        ext = 'webp';
        contentType = 'image/webp';
      }
    }
  } catch (e) {
    console.error('Image optimization failed — uploading original:', e);
    try {
      const meta = await sharp(original).metadata();
      width = meta.width ?? 0;
      height = meta.height ?? 0;
    } catch {
      /* ignore */
    }
  }

  const base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'image';
  const dimSuffix = width && height ? `-${width}x${height}` : '';
  const now = new Date();
  const ym = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const key = `content/${ym}/${Date.now()}-${base}${dimSuffix}.${ext}`;

  // ---------- 1) Production: Cloudflare R2 (zero egress) ----------
  const cfg = r2Config();
  if (cfg) {
    try {
      await cfg.client.send(
        new PutObjectCommand({
          Bucket: cfg.bucket,
          Key: key,
          Body: outBuf,
          ContentType: contentType,
          CacheControl: 'public, max-age=31536000, immutable',
        })
      );
      return NextResponse.json({
        url: `${cfg.baseUrl}/${key}`,
        width,
        height,
        size: outBuf.length,
        originalSize: original.length,
        format: contentType,
        alt: rawName,
        storage: 'r2',
      });
    } catch (e) {
      console.error('R2 upload failed:', e);
      return NextResponse.json({ error: 'فشل الرفع إلى R2 — راجع مفاتيح API' }, { status: 500 });
    }
  }

  // ---------- 2) Dev / preview: local disk served by /api/uploads/[...key] ----------
  try {
    const dest = path.join(process.cwd(), 'uploads', key);
    await fs.promises.mkdir(path.dirname(dest), { recursive: true });
    await fs.promises.writeFile(dest, outBuf);
    return NextResponse.json({
      url: `/api/uploads/${key}`,
      width,
      height,
      size: outBuf.length,
      originalSize: original.length,
      format: contentType,
      alt: rawName,
      storage: 'local',
    });
  } catch (e) {
    console.error('Local upload failed:', e);
    return NextResponse.json(
      { error: 'تعذر حفظ الصورة محلياً — في الإنتاج فعّل متغيرات R2_*' },
      { status: 500 }
    );
  }
}
