import Link from 'next/link';
import type { Metadata } from 'next';
import { COUNTRIES, totalHolidays, siteUrl } from '@/data/countdown';
import Breadcrumbs from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { resolveHoliday, daysBetween, formatDateShort, weekdayOf } from '@/lib/countdown';

export const metadata: Metadata = {
  title: 'عدّاد تنازلي على الأعياد والمناسبات حول العالم — كم باقي على العيد؟',
  description:
    'عدّادات تنازلية مباشرة على الأعياد والمناسبات الرسمية حسب الدولة: كم باقي على عيد الفطر وعيد الأضحى واليوم الوطني والأعياد القومية في السعودية واليمن ومصر والإمارات والكويت وقطر وعُمان والبحرين والأردن والمغرب وتركيا والهند — بالتاريخ الميلادي والهجري.',
};

export default function CountdownsHubPage() {
  const now = new Date();

  /** أقرب مناسبة قادمة في كل دولة */
  const withNext = COUNTRIES.map((c) => {
    let best: { date: Date; name: string } | null = null;
    for (const h of c.holidays) {
      const r = resolveHoliday(h, now);
      if (r.date && (!best || r.date.getTime() < best.date.getTime())) best = { date: r.date, name: h.name };
    }
    return { country: c, next: best };
  });

  const year = now.getFullYear();
  const base = siteUrl();

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: metadata.title,
        description: metadata.description,
        url: `${base}/countdowns`,
        inLanguage: 'ar',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: base },
          { '@type': 'ListItem', position: 2, name: 'التقويم والمواعيد', item: `${base}/s/calendar` },
          { '@type': 'ListItem', position: 3, name: 'عدّادات المناسبات' },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'العد التنازلي على الأعياد والمناسبات حسب الدولة',
        numberOfItems: COUNTRIES.length,
        itemListElement: COUNTRIES.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: `عد تنازلي على مناسبات ${c.name}`,
          url: `${base}/countdowns/${c.slug}`,
        })),
      },
    ],
  };

  return (
    <div>
      <JsonLd data={graph} />

      {/* رأس الصفحة */}
      <div className="border-b border-slate-200/70 bg-gradient-to-b from-indigo-50/70 to-white">
        <div className="container-site py-10">
          <Breadcrumbs
            items={[
              { label: 'التقويم والمواعيد', href: '/s/calendar' },
              { label: 'عدّادات المناسبات' },
            ]}
          />
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            ⏳ عدّادات تنازلية على الأعياد والمناسبات حول العالم
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
            كم باقي على عيد الفطر؟ متى عيد الأضحى بالتاريخ الميلادي؟ متى اليوم الوطني في دولتك؟ اختر
            دولتك من القائمة التالية، وراقب العدّاد التنازلي المباشر لكل مناسبة بالتاريخين الميلادي
            والهجري. نغطي {COUNTRIES.length} دول و{totalHolidays()} مناسبة بأحدث التواريخ.
          </p>
        </div>
      </div>

      <div className="container-site py-10">
        {/* شبكة الدول */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {withNext.map(({ country, next }) => (
            <Link
              key={country.slug}
              href={`/countdowns/${country.slug}`}
              className="card card-hover flex flex-col gap-3 p-5"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-50 text-2xl" aria-hidden>
                  {country.flag}
                </span>
                <div className="min-w-0">
                  <div className="truncate font-extrabold text-slate-900">{country.name}</div>
                  <div className="text-[11px] font-semibold text-slate-400">
                    {country.holidays.length} مناسبة
                  </div>
                </div>
              </div>
              {next && (
                <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-6 text-slate-600">
                  <span className="font-bold text-slate-800">الأقرب الآن:</span> {next.name} —{' '}
                  <span className="font-bold text-indigo-700">
                    {daysBetween(now, next.date)} يوم
                  </span>{' '}
                  ({formatDateShort(next.date)})
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* لماذا هذا القسم */}
        <section className="mt-12 grid gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <div className="text-2xl" aria-hidden>🕌</div>
            <h2 className="mt-2 font-extrabold text-slate-900">تواريخ هجرية دقيقة</h2>
            <p className="mt-1.5 text-xs leading-6 text-slate-500">
              الأعياد الإسلامية تُحسب وفق تقويم أم القرى (هلال السعودية): عيد الفطر، عيد الأضحى، يوم
              عرفة، رمضان، عاشوراء والمولد النبوي.
            </p>
          </div>
          <div className="card p-5">
            <div className="text-2xl" aria-hidden></div>
            <h2 className="mt-2 font-extrabold text-slate-900">التاريخان معاً</h2>
            <p className="mt-1.5 text-xs leading-6 text-slate-500">
              كل مناسبة تعرض بالتاريخ الميلادي والهجري مع اليوم الأسبوعي، لتعرف بالضبط «موعد ...
              بالميلادي» و«بالهجري».
            </p>
          </div>
          <div className="card p-5">
            <div className="text-2xl" aria-hidden>🎯</div>
            <h2 className="mt-2 font-extrabold text-slate-900">تحديث مباشر كل ثانية</h2>
            <p className="mt-1.5 text-xs leading-6 text-slate-500">
              العدّاد يعمل مباشرة في متصفحك، ويحدّث اليوم والأسبوع القادم تلقائياً — بدون إعادة
              تحميل الصفحة.
            </p>
          </div>
        </section>

        {/* روابط سريعة لأكثر الأعياد بحثاً */}
        <section className="mt-12">
          <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">
            الأكثر بحثاً — عدّادات الأعياد في {year}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {COUNTRIES.map((c) => {
              const top = c.holidays.filter((h) =>
                ['eid-al-fitr', 'eid-al-adha', 'national-day', 'republic-day', 'ramadan-start'].includes(h.slug),
              );
              return (
                <span key={c.slug} className="flex flex-wrap items-center gap-1.5">
                  {top.map((h) => (
                    <Link
                      key={h.slug}
                      href={`/countdowns/${c.slug}/${h.slug}`}
                      className="badge border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700"
                    >
                      {c.flag} {h.name}
                    </Link>
                  ))}
                </span>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
