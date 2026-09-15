'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';

function revalidateAll() {
  for (const p of ['/', '/s', '/articles', '/guides', '/tools', '/pages', '/sitemap.xml']) {
    revalidatePath(p, 'page');
  }
}

async function uniqueSlug(base: string, kind: 'section' | 'subsection', ignoreId?: number): Promise<string> {
  let slug = slugify(base) || 'section';
  let i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists =
      kind === 'section'
        ? await prisma.section.findUnique({ where: { slug } })
        : await prisma.subsection.findUnique({ where: { slug } });
    if (!exists || exists.id === ignoreId) return slug;
    slug = `${slugify(base)}-${i++}`;
  }
}

export async function createSection(fd: FormData) {
  await requireUser();
  const name = String(fd.get('name') || '').trim();
  if (!name) return;
  const slug = await uniqueSlug(String(fd.get('slug') || '').trim() || name, 'section');
  await prisma.section.create({
    data: {
      name,
      slug,
      icon: String(fd.get('icon') || '').trim() || '📂',
      description: String(fd.get('description') || '').trim() || null,
      order: parseInt(String(fd.get('order') || '0'), 10) || 0,
      isActive: fd.get('isActive') === 'on',
    },
  });
  revalidateAll();
}

export async function updateSection(fd: FormData) {
  await requireUser();
  const id = parseInt(String(fd.get('id') || '0'), 10);
  if (!id) return;
  const name = String(fd.get('name') || '').trim();
  if (!name) return;
  const existing = await prisma.section.findUnique({ where: { id } });
  if (!existing) return;
  const slugRaw = String(fd.get('slug') || '').trim();
  const slug = slugRaw && slugRaw !== existing.slug ? await uniqueSlug(slugRaw, 'section', id) : existing.slug;
  await prisma.section.update({
    where: { id },
    data: {
      name,
      slug,
      icon: String(fd.get('icon') || '').trim() || existing.icon,
      description: String(fd.get('description') || '').trim() || null,
      order: parseInt(String(fd.get('order') || '0'), 10) || 0,
      isActive: fd.get('isActive') === 'on',
    },
  });
  revalidateAll();
}

export async function deleteSection(id: number) {
  await requireUser();
  const [subs, items] = await Promise.all([
    prisma.subsection.count({ where: { sectionId: id } }),
    prisma.contentItem.count({ where: { sectionId: id } }),
  ]);
  if (subs > 0 || items > 0) throw new Error('لا يمكن حذف القسم لأنه يحتوي على أقسام فرعية أو محتوى. احذفها أولاً.');
  await prisma.section.delete({ where: { id } });
  revalidateAll();
}

export async function createSubsection(fd: FormData) {
  await requireUser();
  const sectionId = parseInt(String(fd.get('sectionId') || '0'), 10);
  const name = String(fd.get('name') || '').trim();
  if (!sectionId || !name) return;
  const slug = await uniqueSlug(String(fd.get('slug') || '').trim() || name, 'subsection');
  await prisma.subsection.create({
    data: {
      sectionId,
      name,
      slug,
      description: String(fd.get('description') || '').trim() || null,
      type: String(fd.get('type') || 'articles') || 'articles',
      order: parseInt(String(fd.get('order') || '0'), 10) || 0,
      isActive: fd.get('isActive') === 'on',
    },
  });
  revalidateAll();
}

export async function updateSubsection(fd: FormData) {
  await requireUser();
  const id = parseInt(String(fd.get('id') || '0'), 10);
  if (!id) return;
  const name = String(fd.get('name') || '').trim();
  if (!name) return;
  const existing = await prisma.subsection.findUnique({ where: { id } });
  if (!existing) return;
  const slugRaw = String(fd.get('slug') || '').trim();
  const slug = slugRaw && slugRaw !== existing.slug ? await uniqueSlug(slugRaw, 'subsection', id) : existing.slug;
  await prisma.subsection.update({
    where: { id },
    data: {
      name,
      slug,
      description: String(fd.get('description') || '').trim() || null,
      type: String(fd.get('type') || existing.type),
      order: parseInt(String(fd.get('order') || '0'), 10) || 0,
      isActive: fd.get('isActive') === 'on',
    },
  });
  revalidateAll();
}

export async function deleteSubsection(id: number) {
  await requireUser();
  const items = await prisma.contentItem.count({ where: { subsectionId: id } });
  if (items > 0) throw new Error('لا يمكن حذف القسم الفرعي لأنه يحتوي على محتوى. انقل أو احذف المحتوى أولاً.');
  await prisma.subsection.delete({ where: { id } });
  revalidateAll();
}
