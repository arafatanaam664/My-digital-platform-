import Link from 'next/link';
import type { Metadata } from 'next';
import type { ContentItem } from '@/lib/types';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import TrackData from '@/components/TrackData';
import Breadcrumbs from '@/components/Breadcrumbs';
import Markdown from '@/components/Markdown';
import ToolHost from '@/components/ToolHost';
import { fmtDate, fmtNum, itemUrl, TYPE_LABEL, cn } from '@/lib/utils';

export async function contentMetadata(item: ContentItem): Promise<Metadata> {
  const s = await getSettings();
  const title = item.metaTitle || item.title;
  const desc = item.metaDescription || item.excerpt || s.description;
  return {
    title,
    description: desc,
    alternates: { canonical: itemUrl(item) },
    openGraph: {
      title,
      description: desc,
      type: 'article',
      locale: 'ar_AR',
      ...(item.featuredImage ? { images: [item.featuredImage] } : {}),
    },
  };
}

function RelatedCard({ it }: { it: ContentItem }) {
  return (
    <Link
      href={itemUrl(it)}
      className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-indigo-300"
    >
      <span className="truncate text-sm font-bold text-slate-700 group-hover:text-indigo-700">{it.title}</span>
      <span className="shrink-0 text-[11px] text-slate-400">👁 {fmtNum(it.views)}</span>
    </Link>
  );
}

export default async function ContentPage({ item, path }: { item: ContentItem; path: string }) {
  const section = item.section;
  const subsection = item.subsection;
  if (!section || !subsection || item.status !== 'published' || !section.isActive || !subsection.isActive) notFound();

  const [sameSub, otherInSection, popular, otherSections, prevNext] = await Promise.all([
    prisma.contentItem.findMany({
      where: { subsectionId: item.subsectionId, status: 'published', id: { not: item.id } },
      orderBy: [{ publishedAt: 'desc' }],
      take: 4,
    }),
    prisma.contentItem.findMany({
      where: { sectionId: item.sectionId, subsectionId: { not: item.subsectionId }, status: 'published' },
      orderBy: [{ publishedAt: 'desc' }],
      take: 4,
    }),
    prisma.contentItem.findMany({
      where: { status: 'published', id: { not: item.id } },
      orderBy: [{ views: 'desc' }, { publishedAt: 'desc' }],
      take: 5,
    }),
    prisma.section.findMany({ where: { isActive: true, id: { not: item.sectionId } }, orderBy: { order: 'asc' }, take: 3 }),
    prisma.contentItem.findMany({
      where: { subsectionId: item.subsectionId, status: 'published', id: { not: item.id } },
      orderBy: { publishedAt: 'asc' },
    }),
  ]);

  const popularByViews = popular.some((p) => p.views > 0) ? popular : [];

  const tags = (item.tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <div>
      <TrackData path={path} />
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Breadcrumbs
          items={[
            { label: section.name, href: `/s/${section.slug}` },
            { label: subsection.name, href: `/s/${section.slug}/${subsection.slug}` },
            { label: item.title },
          ]}
        />

        <header className="mt-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-md border px-2.5 py-1 text-[11px] font-bold',
                item.type === 'tool'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : item.type === 'guide'
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-sky-200 bg-sky-50 text-sky-700'
              )}
            >
              {TYPE_LABEL[item.type] || item.type}
            </span>
            <span className="text-xs text-slate-400">{fmtDate(item.publishedAt)}</span>
            <span className="text-xs text-slate-400">👁 {fmtNum(item.views)} زيارة</span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold leading-snug text-slate-900 sm:text-3xl">{item.title}</h1>
          {item.excerpt && <p className="mt-3 text-sm leading-7 text-slate-500">{item.excerpt}</p>}
        </header>

        <div className="mt-8">
          {item.type === 'tool' && item.toolKey && (
            <div className="mb-8">
              <ToolHost toolKey={item.toolKey} />
            </div>
          )}
          {item.body && <Markdown>{item.body}</Markdown>}
        </div>

        {tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2 border-t border-slate-100 pt-6">
            {tags.map((t) => (
              <Link
                key={t}
                href={`/search?q=${encodeURIComponent(t)}`}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-indigo-100 hover:text-indigo-700"
              >
                # {t}
              </Link>
            ))}
          </div>
        )}

        {prevNext.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6 text-xs font-bold">
            {prevNext.length >= 2 ? (
              <Link href={itemUrl(prevNext[0])} className="rounded-xl bg-slate-50 px-4 py-2.5 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700">
                → {prevNext[0].title}
              </Link>
            ) : (
              <span />
            )}
            {prevNext.length >= 2 && (
              <Link href={itemUrl(prevNext[1])} className="rounded-xl bg-slate-50 px-4 py-2.5 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700">
                {prevNext[1].title} ←
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Internal linking modules */}
      <div className="border-t border-slate-100 bg-slate-50/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-3">
          {sameSub.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-extrabold text-slate-900">مزيد من «{subsection.name}»</h2>
              <div className="space-y-2">
                {sameSub.map((it) => (
                  <RelatedCard key={it.id} it={it} />
                ))}
              </div>
            </section>
          )}

          {otherInSection.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-extrabold text-slate-900">من قسم {section.name}</h2>
              <div className="space-y-2">
                {otherInSection.map((it) => (
                  <RelatedCard key={it.id} it={it} />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-sm font-extrabold text-slate-900">
              {popularByViews.length > 0 ? 'الأكثر زيارة في المنصة' : 'تصفح الأقسام'}
            </h2>
            <div className="space-y-2">
              {popularByViews.length > 0 ? (
                popularByViews.map((it) => <RelatedCard key={it.id} it={it} />)
              ) : (
                otherSections.map((o) => (
                  <Link
                    key={o.id}
                    href={`/s/${o.slug}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm hover:border-indigo-300"
                  >
                    <span className="text-lg">{o.icon}</span> {o.name}
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
