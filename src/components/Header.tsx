import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import SearchForm from './SearchForm';

export const dynamic = 'force-dynamic';

export default async function Header() {
  const s = await getSettings();
  const sections = await prisma.section.findMany({ where: { isActive: true }, orderBy: { order: 'asc' }, take: 6 });

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-lg text-white shadow-sm">🧭</span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">{s.siteName}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/" className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-indigo-700">
            الرئيسية
          </Link>
          {sections.map((sec) => (
            <Link
              key={sec.id}
              href={`/s/${sec.slug}`}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-indigo-700"
            >
              {sec.icon} {sec.name}
            </Link>
          ))}
        </nav>

        <SearchForm className="order-3 w-full sm:order-2 sm:mr-auto sm:w-64" />
      </div>
    </header>
  );
}
