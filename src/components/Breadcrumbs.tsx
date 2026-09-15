import Link from 'next/link';

export default function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400" aria-label="مسار التنقل">
      <Link href="/" className="hover:text-indigo-600">
        الرئيسية
      </Link>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span>/</span>
          {it.href ? (
            <Link href={it.href} className="hover:text-indigo-600">
              {it.label}
            </Link>
          ) : (
            <span className="font-semibold text-slate-600">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
