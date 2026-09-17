'use client';

import Link from 'next/link';
import { useState } from 'react';
import SearchForm from './SearchForm';

export interface MobileSection {
  id: number;
  slug: string;
  name: string;
  icon: string;
  subsections: Array<{ id: number; slug: string; name: string; description: string | null }>;
}

/** Mobile navigation: hamburger → full panel with search + sections → subsections. */
export default function NavMobile({ sections }: { sections: MobileSection[] }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="relative ml-auto lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}
        className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          <div className="border-b border-slate-100 p-3">
            <SearchForm onNavigate={close} placeholder="ابحث في المنصة..." />
          </div>
          <nav className="max-h-[60vh] overflow-y-auto p-2" aria-label="قائمة التنقل">
            <Link
              href="/"
              onClick={close}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-extrabold text-slate-800 transition hover:bg-slate-50"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-base">🏠</span>
              الرئيسية
            </Link>

            {sections.map((sec) => (
              <div key={sec.id} className="mt-1">
                <Link
                  href={`/s/${sec.slug}`}
                  onClick={close}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-extrabold text-slate-800 transition hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-base">{sec.icon}</span>
                  {sec.name}
                </Link>
                {sec.subsections.length > 0 && (
                  <div className="mr-5 mt-0.5 space-y-0.5 border-r-2 border-slate-100 pr-3">
                    {sec.subsections.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/s/${sec.slug}/${sub.slug}`}
                        onClick={close}
                        className="block rounded-lg px-3 py-2 text-[13px] font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-indigo-700"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
