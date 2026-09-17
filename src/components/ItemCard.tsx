import Link from 'next/link';
import type { ContentItem } from '@/lib/types';
import { fmtDate, fmtNum, itemUrl, TYPE_LABEL } from '@/lib/utils';

const TYPE_BADGE: Record<string, string> = {
  article: 'border-sky-200 bg-sky-50 text-sky-700',
  guide: 'border-amber-200 bg-amber-50 text-amber-700',
  tool: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  page: 'border-slate-200 bg-slate-50 text-slate-600',
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
      className="card card-hover group flex h-full flex-col overflow-hidden"
    >
      {item.featuredImage && (
        <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.featuredImage}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <span className={'badge ' + (TYPE_BADGE[item.type] || TYPE_BADGE.page)}>
            {TYPE_LABEL[item.type] || item.type}
          </span>
          {showSection && item.subsection && (
            <span className="truncate text-[11px] font-semibold text-slate-400">{item.subsection.name}</span>
          )}
        </div>
        <h3 className="mt-3 line-clamp-2 text-sm font-extrabold leading-6 text-slate-900 transition group-hover:text-indigo-700">
          {item.title}
        </h3>
        {item.excerpt && <p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-500">{item.excerpt}</p>}
        <div className="mt-auto flex items-center justify-between pt-4 text-[11px] text-slate-400">
          <span>{fmtDate(item.publishedAt)}</span>
          <span>👁 {fmtNum(item.views)}</span>
        </div>
      </div>
    </Link>
  );
}
