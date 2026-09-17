import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import TrackData from '@/components/TrackData';
import SearchForm from '@/components/SearchForm';
import ItemCard from '@/components/ItemCard';
import SectionTitle from '@/components/SectionTitle';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'البحث' };

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q || '').trim();
  let results: Array<any> = [];
  if (q.length >= 2) {
    results = await prisma.contentItem.findMany({
      where: {
        status: 'published',
        section: { isActive: true },
        OR: [{ title: { contains: q } }, { excerpt: { contains: q } }, { tags: { contains: q } }],
      },
      include: { section: true, subsection: true },
      orderBy: [{ views: 'desc' }, { publishedAt: 'desc' }],
      take: 30,
    });
  }

  return (
    <div>
      <TrackData path="/search" />
      <div className="container-site max-w-5xl py-12">
        <SectionTitle>بحث في المنصة</SectionTitle>
        <SearchForm className="max-w-xl" placeholder="اكتب كلمة البحث..." />

        {q && (
          <p className="mt-6 text-sm text-slate-500">
            نتائج البحث عن: <b className="text-slate-800">«{q}»</b> — {results.length} نتيجة
          </p>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((it) => (
            <ItemCard key={it.id} item={it} showSection />
          ))}
        </div>

        {q && results.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-10 text-center">
            <div className="text-3xl">🔍</div>
            <p className="mt-3 text-sm font-semibold text-slate-500">لا توجد نتائج مطابقة</p>
            <Link href="/" className="link-soft mt-2 inline-block">
              العودة إلى الرئيسية
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
