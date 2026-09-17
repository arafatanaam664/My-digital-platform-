import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { itemUrl } from '@/lib/utils';
import { COUNTRIES } from '@/data/countdown';
import { SALARY_PROGRAMS } from '@/data/salaries';
import { DEDICATED_SUB_PAGES } from '@/lib/dedicatedSubPages';

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
      // الأقسام الفرعية التي تُعاد توجيهها لصفحات مخصصة — لا تُدرج هنا
      if (DEDICATED_SUB_PAGES[sub.slug]) continue;
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

  // قسم عدّادات المناسبات (countdowns) — بيانات ثابتة، تتحدث التواريخ يومياً
  entries.push({ url: `${base}/countdowns`, lastModified: now, changeFrequency: 'daily', priority: 0.9 });
  for (const c of COUNTRIES) {
    entries.push({ url: `${base}/countdowns/${c.slug}`, lastModified: now, changeFrequency: 'daily', priority: 0.8 });
    for (const h of c.holidays) {
      entries.push({ url: `${base}/countdowns/${c.slug}/${h.slug}`, lastModified: now, changeFrequency: 'daily', priority: 0.7 });
    }
  }

  // الأقسام الجديدة: الرواتب / التقويم الدراسي / الإجازات / التاريخ اليوم / الأسئلة الشائعة
  entries.push({ url: `${base}/salaries`, lastModified: now, changeFrequency: 'daily', priority: 0.9 });
  for (const p of SALARY_PROGRAMS) {
    entries.push({ url: `${base}/salaries/${p.slug}`, lastModified: now, changeFrequency: 'daily', priority: 0.8 });
  }
  entries.push({ url: `${base}/school-calendar`, lastModified: now, changeFrequency: 'daily', priority: 0.8 });
  entries.push({ url: `${base}/holidays/saudi-arabia`, lastModified: now, changeFrequency: 'daily', priority: 0.8 });
  entries.push({ url: `${base}/today`, lastModified: now, changeFrequency: 'daily', priority: 0.9 });
  entries.push({ url: `${base}/faq`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 });

  return entries;
}
