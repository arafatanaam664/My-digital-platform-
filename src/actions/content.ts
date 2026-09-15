'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';
import { TOOL_LIST } from '@/tools/registry';

export async function revalidateSite() {
  for (const p of ['/', '/s', '/articles', '/guides', '/tools', '/pages', '/search', '/sitemap.xml']) {
    revalidatePath(p, 'page');
  }
  revalidatePath('/', 'layout');
}

interface ContentInput {
  type: string;
  title: string;
  slug: string;
  sectionId: number;
  subsectionId: number;
  excerpt?: string | null;
  body?: string | null;
  toolKey?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  featuredImage?: string | null;
  tags?: string | null;
  status: string;
  publishedAt?: Date | null;
  order: number;
}

async function uniqueSlug(base: string, ignoreId?: number): Promise<string> {
  let slug = slugify(base) || 'content';
  let i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await prisma.contentItem.findUnique({ where: { slug } });
    if (!exists || exists.id === ignoreId) return slug;
    slug = `${slugify(base)}-${i++}`;
  }
}

function parseContentForm(fd: FormData): ContentInput {
  const str = (k: string) => String(fd.get(k) || '').trim();
  const num = (k: string) => {
    const v = parseInt(str(k), 10);
    return isNaN(v) ? 0 : v;
  };
  const pubRaw = str('publishedAt');
  return {
    type: str('type'),
    title: str('title'),
    slug: str('slug'),
    sectionId: num('sectionId'),
    subsectionId: num('subsectionId'),
    excerpt: str('excerpt') || null,
    body: str('body') || null,
    toolKey: str('toolKey') || null,
    metaTitle: str('metaTitle') || null,
    metaDescription: str('metaDescription') || null,
    featuredImage: str('featuredImage') || null,
    tags: str('tags') || null,
    status: str('status') || 'draft',
    publishedAt: pubRaw ? new Date(pubRaw) : null,
    order: num('order'),
  };
}

export async function createContent(formData: FormData) {
  await requireUser();
  const input = parseContentForm(formData);

  if (!input.title || !input.sectionId || !input.subsectionId) throw new Error('الحقول المطلوبة مفقودة');
  if (input.type === 'tool' && !TOOL_LIST.some((t) => t.key === input.toolKey)) throw new Error('اختر أداة');

  const slug = await uniqueSlug(input.slug || input.title);
  const published = input.status === 'published';

  await prisma.contentItem.create({
    data: {
      ...input,
      slug,
      excerpt: input.excerpt ?? '',
      body: input.body ?? '',
      publishedAt: published ? input.publishedAt ?? new Date() : input.publishedAt,
    },
  });
  revalidateSite();
}

export async function updateContent(formData: FormData) {
  await requireUser();
  const id = parseInt(String(formData.get('id') || '0'), 10);
  if (!id) throw new Error('معرف غير صالح');
  const input = parseContentForm(formData);

  if (!input.title || !input.sectionId || !input.subsectionId) throw new Error('الحقول المطلوبة مفقودة');

  const existing = await prisma.contentItem.findUnique({ where: { id } });
  if (!existing) throw new Error('المحتوى غير موجود');

  const slug = input.slug && input.slug !== existing.slug ? await uniqueSlug(input.slug, id) : existing.slug;
  const statusChanged = input.status !== existing.status;
  const published = input.status === 'published';

  await prisma.contentItem.update({
    where: { id },
    data: {
      ...input,
      slug,
      excerpt: input.excerpt ?? '',
      body: input.body ?? '',
      publishedAt:
        published && !existing.publishedAt
          ? input.publishedAt ?? new Date()
          : statusChanged && !published
            ? null
            : input.publishedAt ?? existing.publishedAt,
    },
  });
  revalidateSite();
}

export async function deleteContent(id: number) {
  await requireUser();
  await prisma.contentItem.delete({ where: { id } }).catch(() => {});
  revalidateSite();
}
