'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/admin/dashboard', label: 'لوحة التحكم', icon: '📊' },
  { href: '/admin/analytics', label: 'التحليلات والإحصائيات', icon: '📈' },
  { href: '/admin/content', label: 'المحتوى', icon: '📝' },
  { href: '/admin/sections', label: 'الأقسام', icon: '🗂️' },
  { href: '/admin/users', label: 'المستخدمون', icon: '👥' },
  { href: '/admin/settings', label: 'الإعدادات', icon: '⚙️' },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
      {LINKS.map((l) => {
        const active = pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ' +
              (active ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800 hover:text-white')
            }
          >
            <span className="text-base">{l.icon}</span>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
