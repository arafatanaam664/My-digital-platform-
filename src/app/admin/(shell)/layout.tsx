import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import NavLinks from './_components/NavLinks';

export const dynamic = 'force-dynamic';

export default async function AdminShellLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/admin/login');

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 right-0 z-30 flex w-60 flex-col border-l border-slate-800 bg-slate-900">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5 px-5 py-5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-lg text-white">🧭</span>
          <div>
            <div className="text-sm font-extrabold text-white">لوحة التحكم</div>
            <div className="text-[10px] text-slate-400">إدارة المنصة</div>
          </div>
        </Link>
        <NavLinks />
        <div className="mt-auto border-t border-slate-800 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-xs font-bold text-slate-200">{user.name}</div>
              <div className="truncate text-[10px] text-slate-500" dir="ltr">
                {user.email}
              </div>
            </div>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="rounded-lg bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-slate-300 hover:bg-rose-600 hover:text-white">
                خروج
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="mr-60 flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-3 backdrop-blur">
          <div className="text-xs font-semibold text-slate-400">أهلاً، {user.name} 👋</div>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
          >
            عرض الموقع ↗
          </a>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
