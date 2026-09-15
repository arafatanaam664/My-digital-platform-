import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import TrackData from '@/components/TrackData';
import ItemCard from '@/components/ItemCard';
import Breadcrumbs from '@/components/Breadcrumbs';
import { fmtNum, itemUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string; sub: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const sub = await prisma.subsection.findUnique({
    where: { slug: params.sub },
    include: { section: true },
  });
  if (!sub) return {};
  return {
    title: `${sub.name} — ${sub.section?.name ?? ''}`,
    description: sub.description ?? undefined,
  };
}

export default async function SubsectionPage({ params }: Props) {
  const sub = await prisma.subsection.findUnique({
    where: { slug: params.sub },
    include: {
      section: {
        include: {
          subsections: { where: { isActive: true }, orderBy: { order: 'asc' } },
        },
      },
    },
  });
  if (!sub || !sub.section || !sub.isActive || !sub.section.isActive) notFound();

  const section = sub.section;
  const items = await prisma.contentItem.findMany({
    where: { subsectionId: sub.id, status: 'published' },
    orderBy: [{ publishedAt: 'desc' }],
  });

  const otherSubsItems = await prisma.contentItem.findMany({
    where: { sectionId: section.id, subsectionId: { not: sub.id }, status: 'published' },
    orderBy: [{ publishedAt: 'desc' }],
    take: 4,
  });

  const otherSections = await prisma.section.findMany({
    where: { isActive: true, id: { not: section.id } },
    orderBy: { order: 'asc' },
    take: 3,
  });

  return (
    <div>
      <TrackData path={`/s/${params.slug}/${params.sub}`} />
      <div className="border-b border-slate-200 bg-gradient-to-b from-indigo-50/70 to-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <Breadcrumbs
            items={[
              { label: section.name, href: `/s/${section.slug}` },
              { label: sub.name },
            ]}
          />
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
            {section.icon} {sub.name}
          </h1>
          {sub.description && <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">{sub.description}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {(section.subsections ?? []).map((s2) => (
              <Link
                key={s2.id}
                href={`/s/${section.slug}/${s2.slug}`}
                className={
                  'rounded-lg px-3 py-1.5 text-xs font-bold transition ' +
                  (s2.id === sub.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 shadow-sm hover:text-indigo-700')
                }
              >
                {s2.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
        <section>
          {items.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((it) => (
                <ItemCard key={it.id} item={it} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
              لا يوجد محتوى منشور في هذا القسم بعد.
            </p>
          )}
        </section>

        {otherSubsItems.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-extrabold text-slate-900">من قسم {section.name}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {otherSubsItems.map((it) => (
                <Link
                  key={it.id}
                  href={itemUrl(it)}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition hover:border-indigo-300"
                >
                  <span className="truncate font-bold text-slate-700">{it.title}</span>
                  <span className="shrink-0 text-[11px] text-slate-400">👁 {fmtNum(it.views)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {otherSections.length > 0 && (
          <section className="border-t border-slate-100 pt-8">
            <h2 className="mb-4 text-lg font-extrabold text-slate-900">استكشف أقساماً أخرى</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {otherSections.map((o) => (
                <Link
                  key={o.id}
                  href={`/s/${o.slug}`}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-xl">{o.icon}</span>
                  <div>
                    <div className="text-sm font-extrabold text-slate-800">{o.name}</div>
                    <div className="line-clamp-1 text-[11px] text-slate-400">{o.description || 'قريباً'}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
