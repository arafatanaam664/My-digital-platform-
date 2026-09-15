import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { itemUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [sections, items] = await Promise.all([
    prisma.section.findMany({
      where: { isActive: true },
      include: { subsections: { where: { isActive: true } } },
    }),
    prisma.contentItem.findMany({ where: { status: 'published' }, select: { type: true, slug: true, updatedAt: true } }),
  ]);

  const base = 'http://localhost:3000';
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1 },
  ];

  for (const s of sections) {
    entries.push({ url: `${base}/s/${s.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 });
    for (const sub of s.subsections ?? []) {
      entries.push({
        url: `${base}/s/${s.slug}/${sub.slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  for (const it of items) {
    entries.push({
      url: `${base}${itemUrl(it)}`,
      lastModified: it.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  return entries;
}
