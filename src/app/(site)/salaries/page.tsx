import Link from 'next/link';
import type { Metadata } from 'next';
import { SALARY_PROGRAMS } from '@/data/salaries';
import { siteUrl } from '@/data/countdown';
import Breadcrumbs from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import CountdownTimer from '@/components/CountdownTimer';
import { nextMonthlyPayment } from '@/lib/schedules';
import { daysBetween, formatDateFull, formatDateShort, isoDay } from '@/lib/countdown';
import { gregToHijri, HIJRI_MONTHS } from '@/tools/hijri';

export const metadata: Metadata = {
  title: 'مواعيد صرف الرواتب السعودية 2026 — حساب المواطن، المتقاعدين، الضمان، وسكني',
  description:
    'جدول مواعيد صرف الرواتب والدعم الحكومية في السعودية: رواتب الموظفين الحكوميين (27 من كل شهر)، حساب المواطن (10 من كل شهر)، رواتب المتقاعدين والضمان الاجتماعي المطوّر (1 من كل شهر)، والدعم السكني (24 من كل شهر) — مع عدّاد تنازلي مباشر لأقرب موعد صرف.',
};

export default function SalariesPage() {
  const now = new Date();
  const base = siteUrl();

  const rows = SALARY_PROGRAMS.map((p) => {
    const date = nextMonthlyPayment(p.dayOfMonth, now);
    const hijri = gregToHijri(date);
    return { p, date, hijri, days: daysBetween(now, date) };
  });
  rows.sort((a, b) => a.date.getTime() - b.date.getTime());
  const nearest = rows[0];

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: metadata.title,
        description: metadata.description,
        url: `${base}/salaries`,
        inLanguage: 'ar',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: base },
          { '@type': 'ListItem', position: 2, name: 'التقويم والمواعيد', item: `${base}/s/calendar` },
          { '@type': 'ListItem', position: 3, name: 'الرواتب والدعم' },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'برامج الرواتب والدعم الحكومية في السعودية',
        numberOfItems: SALARY_PROGRAMS.length,
        itemListElement: SALARY_PROGRAMS.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: p.name,
          url: `${base}/salaries/${p.slug}`,
        })),
      },
    ],
  };

  return (
    <div>
      <JsonLd data={graph} />

      {/* الرأس */}
      <div className="border-b border-slate-200/70 bg-gradient-to-b from-indigo-50/70 to-white">
        <div className="container-site py-10">
          <Breadcrumbs
            items={[
              { label: 'التقويم والمواعيد', href: '/s/calendar' },
              { label: 'الرواتب والدعم' },
            ]}
          />
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            💰 مواعيد صرف الرواتب والدعم الحكومية
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
            جدول مواعيد صرف الرواتب والدعم الشهرية في السعودية: رواتب الموظفين الحكوميين، حساب
            المواطن، رواتب المتقاعدين، الضمان الاجتماعي المطوّر، والدعم السكني — بالتاريخين
            الميلادي والهجري، ومع تعويض نهاية الأسبوع (الجمعة ← الخميس، السبت ← الأحد).
          </p>
        </div>
      </div>

      <div className="container-site space-y-12 py-10">
        {/* أقرب موعد صرف */}
        <section>
          <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">أقرب موعد صرف</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-2xl shadow-sm" aria-hidden>
                  {nearest.p.icon}
                </span>
                <div>
                  <div className="font-extrabold text-slate-900">{nearest.p.name}</div>
                  <div className="text-xs text-slate-500">
                    {formatDateFull(nearest.date)}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <CountdownTimer targetIso={nearest.date.toISOString()} />
              </div>
            </div>
            <div className="flex flex-col justify-center rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm leading-7 text-slate-600">{nearest.p.rule}</p>
              <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                <span className="font-bold text-slate-900">{formatDateShort(nearest.date)}</span>
                <span className="text-slate-400"> (</span>
                {nearest.hijri.d} {HIJRI_MONTHS[nearest.hijri.m - 1]} {nearest.hijri.y}هـ
                <span className="text-slate-400">)</span>
                <span className="mr-2 font-bold text-indigo-700">متبقي {nearest.days} يوم</span>
              </div>
              <Link
                href={`/salaries/${nearest.p.slug}`}
                className="link-soft mt-3 text-sm font-bold text-indigo-700"
              >
                التفاصيل الكاملة والأسئلة الشائعة ←
              </Link>
            </div>
          </div>
        </section>

        {/* جدول كل البرامج */}
        <section>
          <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">جدول مواعيد الصرف الشهرية</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map(({ p, date, hijri, days }) => (
              <Link
                key={p.slug}
                href={`/salaries/${p.slug}`}
                className="card card-hover flex flex-col gap-3 p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-50 text-2xl" aria-hidden>
                    {p.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-extrabold text-slate-900">{p.name}</div>
                    <div className="text-[11px] font-semibold text-slate-400">{p.authority}</div>
                  </div>
                </div>
                <div className="text-xs leading-6 text-slate-500">
                  يُصرف يوم <span className="font-bold text-slate-800">{p.dayOfMonth}</span> من كل شهر ميلادي
                  <br />
                  {formatDateShort(date)} — {hijri.d} {HIJRI_MONTHS[hijri.m - 1]} {hijri.y}هـ
                </div>
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-extrabold text-white">
                    {days === 0 ? 'يُصرف اليوم' : `متبقي ${days} يوم`}
                  </span>
                  <span className="text-[11px] font-bold text-indigo-700">التفاصيل ←</span>
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-xs leading-6 text-amber-900">
            <span className="font-bold">ملاحظة:</span> مواعيد الصرف المعروضة تقريبية بناءً على
            المواعيد الشهرية المعتادة لكل برنامج. قد تتغير المواعيد الفعلية بإعلان رسمي من الجهة
            المصدرة (وزارة المالية، المؤسسة العامة للتقاعد، وزارة الموارد البشرية، برنامج سكني…).
          </p>
        </section>

        {/* روابط داخلية */}
        <section className="border-t border-slate-200/70 pt-10">
          <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">مواعيد أخرى قد تهمك</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/holidays/saudi-arabia" className="badge border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700">
              🇸🇦 الإجازات الرسمية في السعودية
            </Link>
            <Link href="/school-calendar" className="badge border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700">
              🏫 التقويم الدراسي 1448-1449هـ
            </Link>
            <Link href="/today" className="badge border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700">
              📅 التاريخ اليوم
            </Link>
            <Link href="/countdowns/saudi-arabia" className="badge border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700">
              ⏳ عدّادات المناسبات السعودية
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
