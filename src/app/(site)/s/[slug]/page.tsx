import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import TrackData from '@/components/TrackData';
import ItemCard from '@/components/ItemCard';
import Breadcrumbs from '@/components/Breadcrumbs';
import SectionTitle from '@/components/SectionTitle';
import { DEDICATED_SUB_PAGES } from '@/lib/dedicatedSubPages';

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const sec = await prisma.section.findUnique({ where: { slug: params.slug } });
  if (!sec) return {};
  return { title: sec.name, description: sec.description ?? undefined };
}

export default async function SectionPage({ params }: Props) {
  const path = `/s/${params.slug}`;
  const section = await prisma.section.findUnique({
    where: { slug: params.slug },
    include: {
      subsections: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
        include: { items: { where: { status: 'published' }, orderBy: { publishedAt: 'desc' }, take: 3 } },
      },
      items: { where: { status: 'published' }, orderBy: { publishedAt: 'desc' }, take: 8 },
    },
  });
  if (!section || !section.isActive) notFound();

  const otherSections = await prisma.section.findMany({
    where: { isActive: true, id: { not: section.id } },
    orderBy: { order: 'asc' },
    take: 3,
  });

  return (
    <div>
      <TrackData path={path} />

      {/* رأس القسم */}
      <div className="border-b border-slate-200/70 bg-gradient-to-b from-indigo-50/70 to-white">
        <div className="container-site py-10">
          <Breadcrumbs items={[{ label: section.name, href: path }]} />
          <div className="mt-5 flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-3xl shadow-sm">
              {section.icon}
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{section.name}</h1>
              {section.description && <p className="mt-1.5 max-w-2xl text-sm leading-7 text-slate-500">{section.description}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="container-site space-y-12 py-10">
        {/* شارات الأقسام الفرعية */}
        {(section.subsections?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2">
            {(section.subsections ?? []).map((s2) => (
              <Link
                key={s2.id}
                href={DEDICATED_SUB_PAGES[s2.slug]?.href ?? `/s/${section.slug}/${s2.slug}`}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700"
              >
                {s2.name}
              </Link>
            ))}
          </div>
        )}

        {(section.subsections ?? []).map((sub) => (
          <section key={sub.id}>
            <SectionTitle href={DEDICATED_SUB_PAGES[sub.slug]?.href ?? `/s/${section.slug}/${sub.slug}`}>{sub.name}</SectionTitle>
            {sub.description && <p className="-mt-3 mb-5 max-w-2xl text-xs leading-6 text-slate-400">{sub.description}</p>}
            {sub.slug === 'countdowns' ? (
              <Link
                href="/countdowns"
                className="card card-hover flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="font-extrabold text-slate-900">
                    ⏳ عدّادات تنازلية مباشرة على الأعياد والمناسبات — 12 دولة
                  </div>
                  <div className="mt-1 text-xs leading-6 text-slate-500">
                    كم باقي على عيد الفطر وعيد الأضحى واليوم الوطني والأعياد القومية حسب دولتك،
                    بالتاريخين الميلادي والهجري.
                  </div>
                </div>
                <span className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm">
                  استعرض العدّادات ←
                </span>
              </Link>
            ) : DEDICATED_SUB_PAGES[sub.slug] ? (
              <Link
                href={DEDICATED_SUB_PAGES[sub.slug].href}
                className="card card-hover flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="font-extrabold text-slate-900">{DEDICATED_SUB_PAGES[sub.slug].title}</div>
                  <div className="mt-1 text-xs leading-6 text-slate-500">{DEDICATED_SUB_PAGES[sub.slug].desc}</div>
                </div>
                <span className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm">
                  افتح الصفحة ←
                </span>
              </Link>
            ) : (sub.items?.length ?? 0) > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(sub.items ?? []).map((it) => (
                  <ItemCard key={it.id} item={it} />
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-400">المحتوى في هذا القسم قادم قريباً</p>
            )}
          </section>
        ))}

        {(section.subsections?.length ?? 0) === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
            هذا القسم جديد — المحتوى سيبدأ الظهور هنا قريباً.
          </p>
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
                    <div className="mt-0.5 truncate text-[11px] text-slate-400">
                      {o.description ? o.description.slice(0, 60) + (o.description.length > 60 ? '…' : '') : 'قادم'}
                    </div>
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
