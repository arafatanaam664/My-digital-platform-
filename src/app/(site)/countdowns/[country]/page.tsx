import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { COUNTRIES, getCountry, siteUrl } from '@/data/countdown';
import Breadcrumbs from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { resolveHoliday, daysBetween, formatDateShort, formatDateFull } from '@/lib/countdown';

interface Props {
  params: { country: string };
}

export function generateStaticParams() {
  return COUNTRIES.map((c) => ({ country: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const country = getCountry(params.country);
  if (!country) return {};
  const year = new Date().getFullYear();
  return {
    title: `أعياد ومناسبات ${country.name} ${year} — الموعد والعد التنازلي`,
    description: `كل مواعيد الأعياد والمناسبات الرسمية في ${country.name} بالتاريخ الميلادي والهجري مع عدّاد تنازلي مباشر: ${country.holidays
      .slice(0, 6)
      .map((h) => h.name)
      .join('، ')} — كم باقي على كل عيد؟`,
  };
}

export default function CountryCountdownPage({ params }: Props) {
  const country = getCountry(params.country);
  if (!country) notFound();

  const now = new Date();
  const year = now.getFullYear();
  const base = siteUrl();

  const holidays = country.holidays.map((h) => {
    const r = resolveHoliday(h, now);
    return {
      h,
      date: r.date,
      hijri: r.hijri,
      days: r.date ? daysBetween(now, r.date) : null,
    };
  });
  holidays.sort((a, b) => (a.date?.getTime() ?? Infinity) - (b.date?.getTime() ?? Infinity));

  const next = holidays[0];

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: `${country.name} — الأعياد والمناسبات والعد التنازلي`,
        description: country.intro,
        url: `${base}/countdowns/${country.slug}`,
        inLanguage: 'ar',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: base },
          { '@type': 'ListItem', position: 2, name: 'عدّادات المناسبات', item: `${base}/countdowns` },
          { '@type': 'ListItem', position: 3, name: country.name },
        ],
      },
      {
        '@type': 'ItemList',
        name: `مناسبات ${country.name}`,
        numberOfItems: holidays.length,
        itemListElement: holidays.map(({ h, date }, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: `${h.name} في ${country.name}`,
          url: `${base}/countdowns/${country.slug}/${h.slug}`,
          ...(date ? { startDate: date.toISOString().slice(0, 10) } : {}),
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
              { label: 'عدّادات المناسبات', href: '/countdowns' },
              { label: country.name },
            ]}
          />
          <div className="mt-5 flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-4xl shadow-sm" aria-hidden>
              {country.flag}
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                أعياد ومناسبات {country.name} {year}
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-7 text-slate-500">{country.intro}</p>
            </div>
          </div>
          {next?.date && (
            <Link
              href={`/countdowns/${country.slug}/${next.h.slug}`}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-800 shadow-sm transition hover:bg-indigo-100"
            >
              <span aria-hidden>⏳</span>
              الأقرب الآن: {next.h.name} — متبقي {next.days} يوم ({formatDateShort(next.date)})
              <span aria-hidden className="text-xs">←</span>
            </Link>
          )}
        </div>
      </div>

      <div className="container-site py-10">
        {/* شبكة المناسبات */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {holidays.map(({ h, date, days }) => (
            <Link
              key={h.slug}
              href={`/countdowns/${country.slug}/${h.slug}`}
              className="card card-hover flex flex-col gap-2 p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-extrabold leading-6 text-slate-900">{h.name}</h2>
                <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                  {h.dateType === 'hijri' ? 'هجري' : h.dateType === 'sham-nasim' ? 'متحرك' : 'ميلادي'}
                </span>
              </div>
              {date ? (
                <div className="text-xs leading-6 text-slate-500">
                  <span className="font-bold text-slate-700">{formatDateFull(date)}</span>
                  <br />
                  <span className="text-indigo-700 font-bold">
                    {days === 0 ? 'اليوم هو يوم المناسبة!' : `متبقي ${days} يوم`}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-slate-400">تاريخ قيد التحديث</div>
              )}
            </Link>
          ))}
        </div>

        {/* دول أخرى */}
        <section className="mt-12 border-t border-slate-200/70 pt-10">
          <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">عدّادات دول أخرى</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {COUNTRIES.filter((c) => c.slug !== country.slug).map((c) => (
              <Link
                key={c.slug}
                href={`/countdowns/${c.slug}`}
                className="badge border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700"
              >
                {c.flag} {c.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
