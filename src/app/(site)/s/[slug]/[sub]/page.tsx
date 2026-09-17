import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import TrackData from '@/components/TrackData';
import ItemCard from '@/components/ItemCard';
import Breadcrumbs from '@/components/Breadcrumbs';
import SectionTitle from '@/components/SectionTitle';
import { fmtNum, itemUrl } from '@/lib/utils';
import { COUNTRIES } from '@/data/countdown';
import { resolveHoliday, daysBetween, formatDateShort } from '@/lib/countdown';
import { DEDICATED_SUB_PAGES } from '@/lib/dedicatedSubPages';

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

  // الأقسام الفرعية التي لها صفحات SEO كاملة — إعادة توجيه مباشرة إليها
  const dedicated = DEDICATED_SUB_PAGES[params.sub];
  if (dedicated) redirect(dedicated.href);

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

      {/* رأس القسم الفرعي */}
      <div className="border-b border-slate-200/70 bg-gradient-to-b from-indigo-50/70 to-white">
        <div className="container-site py-10">
          <Breadcrumbs
            items={[
              { label: section.name, href: `/s/${section.slug}` },
              { label: sub.name },
            ]}
          />
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {section.icon} {sub.name}
          </h1>
          {sub.description && <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">{sub.description}</p>}
          {(section.subsections?.length ?? 0) > 1 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {(section.subsections ?? []).map((s2) => (
                <Link
                  key={s2.id}
                  href={`/s/${section.slug}/${s2.slug}`}
                  className={
                    'rounded-lg px-3 py-1.5 text-xs font-bold transition ' +
                    (s2.id === sub.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-500 shadow-sm hover:border-indigo-300 hover:text-indigo-700')
                  }
                >
                  {s2.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container-site space-y-12 py-10">
        <section>
          {sub.slug === 'countdowns' ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {COUNTRIES.map((c) => {
                  const now = new Date();
                  let best: { date: Date; name: string } | null = null;
                  for (const h of c.holidays) {
                    const r = resolveHoliday(h, now);
                    if (r.date && (!best || r.date.getTime() < best.date.getTime())) {
                      best = { date: r.date, name: h.name };
                    }
                  }
                  return (
                    <Link
                      key={c.slug}
                      href={`/countdowns/${c.slug}`}
                      className="card card-hover flex flex-col gap-3 p-5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-50 text-2xl" aria-hidden>
                          {c.flag}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-extrabold text-slate-900">{c.name}</div>
                          <div className="text-[11px] font-semibold text-slate-400">{c.holidays.length} مناسبة</div>
                        </div>
                      </div>
                      {best && (
                        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-6 text-slate-600">
                          <span className="font-bold text-slate-800">الأقرب الآن:</span> {best.name} —{' '}
                          <span className="font-bold text-indigo-700">{daysBetween(now, best.date)} يوم</span> ({formatDateShort(best.date)})
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
              <p className="mt-6 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 p-4 text-center text-sm text-slate-500">
                راقب العدّادات مباشرة على الصفحة الرئيسية للقسم:{' '}
                <Link href="/countdowns" className="font-bold text-indigo-700 hover:underline">
                  عدّادات المناسبات حول العالم ←
                </Link>
              </p>
            </>
          ) : items.length > 0 ? (
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
            <SectionTitle>من قسم {section.name}</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              {otherSubsItems.map((it) => (
                <Link
                  key={it.id}
                  href={itemUrl(it)}
                  className="card card-hover flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="truncate text-sm font-bold text-slate-700">{it.title}</span>
                  <span className="shrink-0 text-[11px] text-slate-400">👁 {fmtNum(it.views)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {otherSections.length > 0 && (
          <section className="border-t border-slate-200/70 pt-10">
            <SectionTitle>استكشف أقساماً أخرى</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-3">
              {otherSections.map((o) => (
                <Link key={o.id} href={`/s/${o.slug}`} className="card card-hover flex items-center gap-3 p-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-xl">{o.icon}</span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-extrabold text-slate-800">{o.name}</div>
                    <div className="mt-0.5 truncate text-[11px] text-slate-400">{o.description || 'قريباً'}</div>
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
