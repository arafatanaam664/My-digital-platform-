import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { COUNTRIES, getCountry, getHoliday, siteUrl } from '@/data/countdown';
import Breadcrumbs from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import CountdownTimer from '@/components/CountdownTimer';
import FaqSection from '@/components/FaqSection';
import Markdown from '@/components/Markdown';
import {
  resolveHoliday,
  daysBetween,
  formatDateFull,
  formatDateShort,
  weekdayOf,
  isoDay,
} from '@/lib/countdown';
import { hijriNameArabic } from '@/tools/hijri';

interface Props {
  params: { country: string; holiday: string };
}

export function generateStaticParams() {
  const out: Array<{ country: string; holiday: string }> = [];
  for (const c of COUNTRIES) {
    for (const h of c.holidays) out.push({ country: c.slug, holiday: h.slug });
  }
  return out;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const country = getCountry(params.country);
  if (!country) return {};
  const h = getHoliday(country, params.holiday);
  if (!h) return {};
  const r = resolveHoliday(h);
  if (!r.date) {
    return { title: `كم باقي على ${h.name} في ${country.name}؟` };
  }
  const year = r.date.getFullYear();
  const hijri = r.hijri ? ` الموافق ${hijriNameArabic(r.date)}` : '';
  return {
    title: `كم باقي على ${h.name} في ${country.name} ${year}؟ العد التنازلي`,
    description: `${h.name} في ${country.name} يصادف ${formatDateShort(r.date)} (يوم ${weekdayOf(r.date)})${hijri}. راقب العد التنازلي المباشر لمعرفة كم باقي على ${h.name} يوماً وساعة ودقيقة — مع التفاصيل الكاملة والأسئلة الشائعة.`,
  };
}

export default function HolidayCountdownPage({ params }: Props) {
  const country = getCountry(params.country);
  if (!country) notFound();
  const h = getHoliday(country, params.holiday);
  if (!h) notFound();

  const now = new Date();
  const base = siteUrl();
  const r = resolveHoliday(h, now);
  const date = r.date;
  const days = date ? daysBetween(now, date) : null;
  const path = `/countdowns/${country.slug}/${h.slug}`;

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: `كم باقي على ${h.name} في ${country.name}؟`,
        description: `${h.name} في ${country.name} — الموعد والعد التنازلي المباشر بالتاريخين الميلادي والهجري.`,
        url: `${base}${path}`,
        inLanguage: 'ar',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: base },
          { '@type': 'ListItem', position: 2, name: 'عدّادات المناسبات', item: `${base}/countdowns` },
          { '@type': 'ListItem', position: 3, name: country.name, item: `${base}/countdowns/${country.slug}` },
          { '@type': 'ListItem', position: 4, name: h.name },
        ],
      },
      {
        '@type': 'Event',
        name: `${h.name} في ${country.name}`,
        description: `${h.name} يصادف ${date ? formatDateFull(date) : ''} في ${country.name}.`,
        startDate: date ? isoDay(date) : undefined,
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
          '@type': 'Place',
          name: country.name,
          address: { '@type': 'PostalAddress', addressCountry: country.code },
        },
      },
      {
        '@type': 'ItemList',
        name: `مناسبات أخرى في ${country.name}`,
        numberOfItems: country.holidays.length - 1,
        itemListElement: country.holidays
          .filter((x) => x.slug !== h.slug)
          .map((x, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: x.name,
            url: `${base}/countdowns/${country.slug}/${x.slug}`,
          })),
      },
    ],
  };

  return (
    <div>
      <JsonLd data={graph} />

      <div className="border-b border-slate-200/70 bg-gradient-to-b from-indigo-50/70 to-white">
        <div className="container-site py-10">
          <Breadcrumbs
            items={[
              { label: 'عدّادات المناسبات', href: '/countdowns' },
              { label: country.name, href: `/countdowns/${country.slug}` },
              { label: h.name },
            ]}
          />
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            كم باقي على {h.name} في {country.name}؟
          </h1>
          <p className="mt-2 text-sm font-bold text-indigo-700">
            {country.flag} {country.name}
            {date && <span className="font-semibold text-slate-500"> — {formatDateShort(date)}</span>}
          </p>
        </div>
      </div>

      <div className="container-site py-10">
        {/* العدّاد */}
        {date ? (
          <div className="mx-auto max-w-2xl space-y-4">
            <CountdownTimer targetIso={date.toISOString()} />
            <div className="card flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-4 text-center">
              <div className="text-sm text-slate-600">
                <span className="font-bold text-slate-900">{formatDateShort(date)}</span>
                <span className="text-slate-400"> ({weekdayOf(date)})</span>
              </div>
              {r.hijri && (
                <div className="text-sm text-slate-600">
                  بالتقويم الهجري: <span className="font-bold text-slate-900">{hijriNameArabic(date)}</span>
                </div>
              )}
              <div className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-extrabold text-white shadow-sm">
                {days === 0 ? 'اليوم هو يوم المناسبة 🎉' : `متبقي ${days} يوم`}
              </div>
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
            تاريخ المناسبة قيد التحديث.
          </p>
        )}

        {/* الوصف الغني */}
        <article className="mx-auto mt-10 max-w-3xl">
          <Markdown>{h.description}</Markdown>
        </article>

        {/* الأسئلة الشائعة + FAQPage */}
        <div className="mx-auto max-w-3xl">
          <FaqSection faqs={h.faq} />
        </div>

        {/* روابط داخلية: مناسبات نفس الدولة */}
        <section className="mt-12 border-t border-slate-200/70 pt-10">
          <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">
            مناسبات أخرى في {country.name}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {country.holidays
              .filter((x) => x.slug !== h.slug)
              .map((x) => (
                <Link
                  key={x.slug}
                  href={`/countdowns/${country.slug}/${x.slug}`}
                  className="badge border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700"
                >
                  كم باقي على {x.name}؟
                </Link>
              ))}
          </div>
        </section>

        {/* روابط داخلية: دول أخرى */}
        <section className="mt-10 border-t border-slate-200/70 pt-10">
          <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">المناسبة نفسها في دول أخرى</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {COUNTRIES.filter((c) => c.slug !== country.slug && c.holidays.some((x) => x.slug === h.slug)).map(
              (c) => (
                <Link
                  key={c.slug}
                  href={`/countdowns/${c.slug}/${h.slug}`}
                  className="badge border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700"
                >
                  {c.flag} {c.name}
                </Link>
              ),
            )}
            {COUNTRIES.filter((c) => c.slug !== country.slug).length > 0 && (
              <Link
                href="/countdowns"
                className="badge border border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm transition hover:bg-indigo-100"
              >
                كل الدول ←
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
