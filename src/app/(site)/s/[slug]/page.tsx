import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import TrackData from '@/components/TrackData';
import ItemCard from '@/components/ItemCard';
import Breadcrumbs from '@/components/Breadcrumbs';
import { itemUrl } from '@/lib/utils';

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
      <div className="border-b border-slate-200 bg-gradient-to-b from-indigo-50/70 to-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <Breadcrumbs items={[{ label: section.name, href: path }]} />
          <div className="mt-4 flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-3xl shadow-sm">{section.icon}</span>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">{section.name}</h1>
              {section.description && <p className="mt-1 max-w-2xl text-sm leading-7 text-slate-500">{section.description}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
        {(section.subsections ?? []).map((sub) => (
          <section key={sub.id}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900">{sub.name}</h2>
              <Link href={`/s/${section.slug}/${sub.slug}`} className="text-xs font-bold text-indigo-600 hover:underline">
                عرض الكل ←
              </Link>
            </div>
            {(sub.items?.length ?? 0) > 0 ? (
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
                    <div className="text-[11px] text-slate-400">{o.description ? o.description.slice(0, 50) + '…' : 'قادم'}</div>
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
