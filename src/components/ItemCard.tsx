import Link from 'next/link';
import type { ContentItem } from '@/lib/types';
import { fmtDate, fmtNum, itemUrl, TYPE_LABEL } from '@/lib/utils';

const TYPE_BADGE: Record<string, string> = {
  article: 'bg-sky-50 text-sky-700 border-sky-200',
  guide: 'bg-amber-50 text-amber-700 border-amber-200',
  tool: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  page: 'bg-slate-50 text-slate-600 border-slate-200',
};

export default function ItemCard({
  item,
  showSection,
}: {
  item: ContentItem & { section?: { name: string }; subsection?: { name: string } };
  showSection?: boolean;
}) {
  return (
    <Link
      href={itemUrl(item)}
      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
    >
      <div className="flex items-center gap-2">
        <span className={'rounded-md border px-2 py-0.5 text-[10px] font-bold ' + (TYPE_BADGE[item.type] || TYPE_BADGE.page)}>
          {TYPE_LABEL[item.type] || item.type}
        </span>
        {showSection && item.subsection && (
          <span className="text-[11px] font-semibold text-slate-400">{item.subsection.name}</span>
        )}
      </div>
      <h3 className="mt-3 line-clamp-2 text-sm font-extrabold leading-6 text-slate-900 group-hover:text-indigo-700">{item.title}</h3>
      {item.excerpt && <p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-500">{item.excerpt}</p>}
      <div className="mt-auto flex items-center justify-between pt-4 text-[11px] text-slate-400">
        <span>{fmtDate(item.publishedAt)}</span>
        <span>👁 {fmtNum(item.views)}</span>
      </div>
    </Link>
  );
}
