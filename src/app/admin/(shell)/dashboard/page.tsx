import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getDailySeries, getDeviceSplit, getSectionSplit, getTopPages, getKpis, sinceFromRange } from '@/lib/stats';
import { resolvePath } from '@/lib/track';
import { fmtNum, TYPE_LABEL } from '@/lib/utils';
import TrendChart from '../_components/TrendChart';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const kpi = await getKpis();
  const series = await getDailySeries(30);
  const since = sinceFromRange('30');
  const [top, devices, sections] = await Promise.all([getTopPages(since, 10), getDeviceSplit(since), getSectionSplit(since)]);

  const resolvedTop = await Promise.all(
    top.map(async (t) => {
      const info = await resolvePath(t.path);
      return { ...t, title: info.title, type: info.type };
    })
  );
  const totalTop = resolvedTop.reduce((a, r) => a + r._count._all, 0);

  const kpis = [
    { label: 'زيارات اليوم', value: kpi.vToday, icon: '📅' },
    { label: 'زيارات الأسبوع', value: kpi.vWeek, icon: '🗓️' },
    { label: 'زيارات الشهر', value: kpi.vMonth, icon: '📊' },
    { label: 'زيارات السنة', value: kpi.vYear, icon: '📈' },
    { label: 'زوار فريدون (30 يوم)', value: kpi.uniq30, icon: '👥' },
    { label: 'محتوى منشور', value: kpi.itemsCount, icon: '📝' },
    { label: 'أقسام نشطة', value: kpi.sectionsCount, icon: '🗂️' },
    { label: 'أدوات تفاعلية', value: kpi.toolsCount, icon: '🧮' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">لوحة التحكم</h1>
        <p className="mt-1 text-xs text-slate-500">نظرة عامة على أداء المنصة — آخر 30 يوماً</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold text-slate-400">
              {k.icon} {k.label}
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">{fmtNum(k.value)}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900">الزيارات اليومية (آخر 30 يوماً)</h2>
          <Link href="/admin/analytics" className="text-xs font-bold text-indigo-600 hover:underline">
            التحليلات التفصيلية ←
          </Link>
        </div>
        <TrendChart data={series} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-sm font-extrabold text-slate-900">أعلى الصفحات زيارة (30 يوم)</h2>
          <div className="space-y-2">
            {resolvedTop.map((t) => (
              <div key={t.path} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={t.path === '/' ? '/' : t.path}
                      target="_blank"
                      className="truncate text-xs font-bold text-slate-700 hover:text-indigo-700"
                    >
                      {t.title}
                    </Link>
                    <span className="shrink-0 text-[11px] font-bold text-slate-400">
                      {fmtNum(t._count._all)} {totalTop ? `(${Math.round((t._count._all / totalTop) * 100)}%)` : ''}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${totalTop ? (t._count._all / totalTop) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
            {resolvedTop.length === 0 && <p className="py-6 text-center text-xs text-slate-400">لا توجد زيارات بعد — شارك موقعك وابدأ بالحصود</p>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-extrabold text-slate-900">حسب الجهاز</h2>
            <div className="space-y-3">
              {devices.map((d) => (
                <div key={d.device}>
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>{d.device === 'mobile' ? '📱 جوال' : d.device === 'desktop' ? '🖥️ حاسوب' : '📟 لوحي'}</span>
                    <span>{d.pct}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-extrabold text-slate-900">حسب القسم</h2>
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
              {sections.length === 0 && <p className="text-xs text-slate-400">لا توجد بيانات بعد</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
