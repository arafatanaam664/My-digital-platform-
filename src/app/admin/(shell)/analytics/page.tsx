import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getBrowserSplit, getDailySeries, getDeviceSplit, getSectionSplit, getTopPages, RANGE_LABEL, sinceFromRange } from '@/lib/stats';
import { resolvePath } from '@/lib/track';
import { fmtNum, TYPE_LABEL } from '@/lib/utils';
import TrendChart from '../_components/TrendChart';

export const dynamic = 'force-dynamic';

const RANGES = ['7', '30', '90', '365'];

export default async function AnalyticsPage({ searchParams }: { searchParams: { range?: string } }) {
  const range = RANGES.includes(searchParams.range || '') ? searchParams.range! : '30';
  const since = sinceFromRange(range);
  const days = range === '7' ? 7 : range === '90' ? 90 : range === '365' ? 180 : 30;

  const total = await prisma.pageView.count({ where: { createdAt: { gte: since } } });
  const series = await getDailySeries(days);
  const [top, devices, browsers, sections] = await Promise.all([
    getTopPages(since, 25),
    getDeviceSplit(since),
    getBrowserSplit(since),
    getSectionSplit(since),
  ]);

  const resolvedTop = await Promise.all(
    top.map(async (t) => {
      const info = await resolvePath(t.path);
      return { ...t, title: info.title, type: info.type, contentId: info.contentId };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">التحليلات والإحصائيات</h1>
          <p className="mt-1 text-xs text-slate-500">
            إجمالي الزيارات خلال {RANGE_LABEL[range]}: <b className="text-slate-800">{fmtNum(total)}</b>
          </p>
        </div>
        <div className="flex gap-1 rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin/analytics?range=${r}`}
              className={
                'rounded-lg px-3 py-1.5 text-xs font-bold transition ' +
                (r === range ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100')
              }
            >
              {RANGE_LABEL[r]}
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-extrabold text-slate-900">منحنى الزيارات اليومي</h2>
        <TrendChart data={series} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-sm font-extrabold text-slate-900">زيارات كل صفحة / مقال (تفصيلي)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] text-slate-400">
                  <th className="pb-2 font-bold">الصفحة</th>
                  <th className="pb-2 font-bold">النوع</th>
                  <th className="pb-2 font-bold">الزيارات</th>
                  <th className="pb-2 font-bold">الحصة</th>
                </tr>
              </thead>
              <tbody>
                {resolvedTop.map((t) => (
                  <tr key={t.path} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="max-w-[320px] py-2.5">
                      <Link href={t.path === '/' ? '/' : t.path} target="_blank" className="block truncate font-bold text-slate-700 hover:text-indigo-700">
                        {t.title}
                      </Link>
                      <div className="truncate text-[10px] text-slate-400" dir="ltr">
                        {t.path}
                      </div>
                    </td>
                    <td className="py-2.5 text-[11px] text-slate-500">{TYPE_LABEL[t.type] || t.type}</td>
                    <td className="py-2.5 font-extrabold text-slate-800">{fmtNum(t._count._all)}</td>
                    <td className="py-2.5 text-slate-500">{total ? Math.round((t._count._all / total) * 100) : 0}%</td>
                  </tr>
                ))}
                {resolvedTop.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      لا توجد زيارات خلال هذه الفترة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-extrabold text-slate-900">الأجهزة</h2>
            <div className="space-y-3">
              {devices.map((d) => (
                <div key={d.device}>
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>{d.device === 'mobile' ? '📱 جوال' : d.device === 'desktop' ? '🖥️ حاسوب' : '📟 لوحي'}</span>
                    <span>
                      {fmtNum(d.count)} ({d.pct}%)
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-extrabold text-slate-900">المتصفحات</h2>
            <div className="space-y-3">
              {browsers.map((b) => (
                <div key={b.browser}>
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>{b.browser}</span>
                    <span>
                      {fmtNum(b.count)} ({b.pct}%)
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-sky-500" style={{ width: `${b.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-extrabold text-slate-900">توزيع الزيارات على الأقسام</h2>
            <div className="space-y-3">
              {sections.map((s) => (
                <div key={s.name}>
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span className="truncate">{s.name}</span>
                    <span>{s.pct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-indigo-400" style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
              {sections.length === 0 && <p className="text-xs text-slate-400">لا توجد بيانات</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
