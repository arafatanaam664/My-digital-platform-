import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import SearchForm from './SearchForm';
import NavMobile from './NavMobile';

export const dynamic = 'force-dynamic';

export default async function Header() {
  const s = await getSettings();
  const sections = await prisma.section.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    take: 6,
    include: { subsections: { where: { isActive: true }, orderBy: { order: 'asc' } } },
  });

  const mobileSections = sections.map((sec) => ({
    id: sec.id,
    slug: sec.slug,
    name: sec.name,
    icon: sec.icon,
    subsections: (sec.subsections ?? []).map((sub) => ({
      id: sub.id,
      slug: sub.slug,
      name: sub.name,
      description: sub.description,
    })),
  }));

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        {/* الشعار */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={s.siteName}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-lg text-white shadow-sm">🧭</span>
          <span className="hidden text-base font-extrabold tracking-tight text-slate-900 sm:block">{s.siteName}</span>
        </Link>

        {/* تنقل سطح المكتب: أقسام رئيسية + قوائم فرعية منسدلة */}
        <nav className="ml-2 hidden items-center gap-0.5 lg:flex" aria-label="التنقل الرئيسي">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            الرئيسية
          </Link>
          {sections.map((sec) => {
            const subs = sec.subsections ?? [];
            return (
              <div key={sec.id} className="group relative">
                <Link
                  href={`/s/${sec.slug}`}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition group-hover:bg-slate-100 group-hover:text-slate-900"
                >
                  <span className="text-base leading-none">{sec.icon}</span>
                  {sec.name}
                  {subs.length > 0 && (
                    <svg
                      className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200 group-hover:rotate-180"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  )}
                </Link>

                {subs.length > 0 && (
                  <div className="invisible absolute right-0 top-full z-50 pt-1.5 opacity-0 transition-all duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <div className="w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/5">
                      <Link
                        href={`/s/${sec.slug}`}
                        className="block rounded-xl bg-indigo-50/80 px-3 py-2 text-sm font-extrabold text-indigo-700 transition hover:bg-indigo-100"
                      >
                        كل {sec.name} ←
                      </Link>
                      <div className="mt-1 space-y-0.5">
                        {subs.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/s/${sec.slug}/${sub.slug}`}
                            className="block rounded-xl px-3 py-2 transition hover:bg-slate-50"
                          >
                            <div className="text-sm font-bold text-slate-800">{sub.name}</div>
                            {sub.description && (
                              <div className="mt-0.5 line-clamp-1 text-[11px] leading-5 text-slate-400">{sub.description}</div>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* بحث سطح المكتب */}
        <div className="ml-auto hidden lg:block">
          <SearchForm className="w-56" />
        </div>

        {/* قائمة الجوال */}
        <NavMobile sections={mobileSections} />
      </div>
    </header>
  );
}
