import Link from 'next/link';
import { prisma } from '@/lib/db';
import { fmtNum, fmtDateTime, itemUrl, TYPE_LABEL } from '@/lib/utils';
import ConfirmDelete from '../_components/ConfirmDelete';
import { deleteContent } from '@/actions/content';

export const dynamic = 'force-dynamic';

const TABS = [
  { key: 'all', label: 'الكل' },
  { key: 'article', label: 'مقالات' },
  { key: 'guide', label: 'أدلة' },
  { key: 'tool', label: 'أدوات' },
  { key: 'page', label: 'صفحات' },
];

export default async function ContentListPage({ searchParams }: { searchParams: { type?: string; section?: string; q?: string } }) {
  const type = searchParams.type || 'all';
  const sectionId = parseInt(searchParams.section || '0', 10);
  const q = (searchParams.q || '').trim();

  const where: Record<string, unknown> = {};
  if (type !== 'all') where.type = type;
  if (sectionId) where.sectionId = sectionId;
  if (q.length >= 2) where.OR = [{ title: { contains: q } }, { excerpt: { contains: q } }];

  const [items, sections] = await Promise.all([
    prisma.contentItem.findMany({
      where,
      include: { section: true, subsection: true },
      orderBy: { createdAt: 'desc' },
      take: 300,
    }),
    prisma.section.findMany({ orderBy: { order: 'asc' } }),
  ]);

  const counts: Record<string, number> = { all: items.length };
  if (!q && !sectionId) {
    for (const it of items) counts[it.type] = (counts[it.type] || 0) + 1;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">إدارة المحتوى</h1>
          <p className="mt-1 text-xs text-slate-500">مقالات، أدلة، أدوات، وصفحات — {items.length} عنصر</p>
        </div>
        <Link href="/admin/content/new" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-700">
          + إضافة محتوى جديد
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/admin/content?type=${t.key}${sectionId ? `&section=${sectionId}` : ''}`}
              className={
                'rounded-lg px-3 py-1.5 text-xs font-bold transition ' +
                (t.key === type ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')
              }
            >
              {t.label} {counts[t.key] ? `(${counts[t.key]})` : ''}
            </Link>
          ))}
        </div>
        <form className="mr-auto flex w-full items-center gap-2 sm:w-auto" action="/admin/content">
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="section" value={sectionId || ''} />
          <input
            name="q"
            defaultValue={q}
            placeholder="بحث بالعنوان..."
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-indigo-400 focus:outline-none sm:w-48"
          />
          <button className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700">بحث</button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 text-[11px] text-slate-400">
            <tr>
              <th className="px-4 py-3 font-bold">العنوان</th>
              <th className="px-4 py-3 font-bold">النوع</th>
              <th className="px-4 py-3 font-bold">القسم / الفرعي</th>
              <th className="px-4 py-3 font-bold">الحالة</th>
              <th className="px-4 py-3 font-bold">الزيارات</th>
              <th className="px-4 py-3 font-bold">آخر تعديل</th>
              <th className="px-4 py-3 font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                <td className="max-w-[280px] px-4 py-3">
                  <div className="truncate font-extrabold text-slate-800">{it.title}</div>
                  <div className="truncate text-[10px] text-slate-400" dir="ltr">
                    {itemUrl(it)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{TYPE_LABEL[it.type] || it.type}</span>
                </td>
                <td className="px-4 py-3 text-[11px] text-slate-500">
                  {it.section?.name} / {it.subsection?.name}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      'rounded-md px-2 py-1 text-[10px] font-bold ' +
                      (it.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')
                    }
                  >
                    {it.status === 'published' ? 'منشور' : 'مسودة'}
                  </span>
                </td>
                <td className="px-4 py-3 font-extrabold text-slate-700">{fmtNum(it.views)}</td>
                <td className="px-4 py-3 text-[11px] text-slate-400">{fmtDateTime(it.updatedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Link href={itemUrl(it)} target="_blank" className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-200">
                      عرض
                    </Link>
                    <Link href={`/admin/content/${it.id}/edit`} className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-[11px] font-bold text-indigo-600 hover:bg-indigo-100">
                      تعديل
                    </Link>
                    <ConfirmDelete action={deleteContent.bind(null, it.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  لا يوجد محتوى — ابدأ بإضافة أول محتوى من الزر بالأعلى
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
