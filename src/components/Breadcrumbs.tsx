import Link from 'next/link';

export default function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400" aria-label="مسار التنقل">
      <Link href="/" className="transition hover:text-indigo-600">
        الرئيسية
      </Link>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span aria-hidden>/</span>
          {it.href ? (
            <Link href={it.href} className="transition hover:text-indigo-600">
              {it.label}
            </Link>
          ) : (
            <span className="max-w-[200px] truncate font-semibold text-slate-600 sm:max-w-md">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
