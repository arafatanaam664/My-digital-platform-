import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import SearchForm from '@/components/SearchForm';
import TrackData from '@/components/TrackData';
import ItemCard from '@/components/ItemCard';
import { fmtNum, itemUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const s = await getSettings();
  const [sections, latest, popular] = await Promise.all([
    prisma.section.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        subsections: { where: { isActive: true }, orderBy: { order: 'asc' } },
        items: {
          where: { status: 'published' },
          orderBy: { publishedAt: 'desc' },
          take: 3,
        },
      },
    }),
    prisma.contentItem.findMany({ where: { status: 'published' }, orderBy: { publishedAt: 'desc' }, take: 6 }),
    prisma.contentItem.findMany({
      where: { status: 'published' },
      orderBy: [{ views: 'desc' }, { publishedAt: 'desc' }],
      take: 5,
    }),
  ]);

  const totalItems = sections.reduce((a, x) => a + (x.items?.length ?? 0), 0);
  const popularByViews = popular.some((p) => p.views > 0) ? popular : latest.slice(0, 5);

  return (
    <div>
      <TrackData path="/" />

      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-indigo-50/80 via-white to-white">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center">
          <h1 className="mx-auto max-w-3xl text-3xl font-extrabold leading-snug text-slate-900 sm:text-4xl">{s.tagline}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">{s.description}</p>
          <SearchForm className="mx-auto mt-7 max-w-xl" placeholder="ابحث عن أداة، دليل، أو مقال... مثال: محول هجري" />
          <div className="mx-auto mt-8 flex max-w-md items-center justify-center divide-x divide-x-reverse divide-slate-200 rounded-2xl border border-slate-200 bg-white py-3 shadow-sm">
            <div className="flex-1 px-4">
              <div className="text-xl font-extrabold text-indigo-600">{fmtNum(sections.length)}</div>
              <div className="text-[11px] font-semibold text-slate-400">أقسام</div>
            </div>
            <div className="flex-1 px-4">
              <div className="text-xl font-extrabold text-indigo-600">{fmtNum(totalItems)}</div>
              <div className="text-[11px] font-semibold text-slate-400">محتوى منشور</div>
            </div>
            <div className="flex-1 px-4">
              <div className="text-xl font-extrabold text-indigo-600">{fmtNum(sections.reduce((a, x) => a + (x.subsections?.length ?? 0), 0))}</div>
              <div className="text-[11px] font-semibold text-slate-400">تصنيفات</div>
            </div>
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-xl font-extrabold text-slate-900">أقسام المنصة</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((sec) => (
            <div key={sec.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md">
              <Link href={`/s/${sec.slug}`} className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-2xl">{sec.icon}</span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 hover:text-indigo-700">{sec.name}</h3>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {(sec.subsections ?? []).map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/s/${sec.slug}/${sub.slug}`}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 hover:bg-indigo-100 hover:text-indigo-700"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </Link>
              {sec.description && <p className="mt-3 line-clamp-2 text-xs leading-6 text-slate-500">{sec.description}</p>}
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                {(sec.items ?? []).map((it) => (
                  <Link
                    key={it.id}
                    href={itemUrl(it)}
                    className="block truncate rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    ← {it.title}
                  </Link>
                ))}
                {(sec.items?.length ?? 0) === 0 && <p className="px-2 text-xs text-slate-400">المحتوى قادم قريباً</p>}
              </div>
              <Link href={`/s/${sec.slug}`} className="mt-4 text-xs font-bold text-indigo-600 hover:underline">
                ادخل القسم ←
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Latest */}
      {latest.length > 0 && (
        <section className="border-t border-slate-100 bg-slate-50/60">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <h2 className="mb-6 text-xl font-extrabold text-slate-900">أحدث المحتوى</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((it) => (
                <ItemCard key={it.id} item={it} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-xl font-extrabold text-slate-900">الأكثر زيارة</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {popularByViews.map((it, i) => (
            <Link
              key={it.id}
              href={itemUrl(it)}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-sm"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-lg font-extrabold text-indigo-600">
                {i + 1}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-slate-800">{it.title}</div>
                <div className="mt-0.5 text-[11px] text-slate-400">👁 {fmtNum(it.views)} زيارة</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
