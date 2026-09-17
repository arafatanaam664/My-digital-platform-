import type { Metadata } from 'next';
import Link from 'next/link';
import { siteUrl } from '@/data/countdown';
import { getCountry } from '@/data/countdown';
import { SALARY_PROGRAMS } from '@/data/salaries';
import { nextMonthlyPayment } from '@/lib/schedules';
import { SCHOOL_YEAR } from '@/data/school-calendar';
import Breadcrumbs from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import RiyadhClock from '@/components/RiyadhClock';
import { resolveHoliday, daysBetween, formatDateFull, formatDateShort, isoDay } from '@/lib/countdown';
import { gregToHijri, HIJRI_MONTHS } from '@/tools/hijri';

export const metadata: Metadata = {
  title: 'التاريخ اليوم — الهجري والميلادي بتوقيت الرياض 2026',
  description:
    'معرفة التاريخ اليوم بالتقويمين الهجري والميلادي بتوقيت مدينة الرياض: اليوم واليوم في الشهر الهجري، عدد أيام الشهر الهجري، الأيام المتبقية، ترتيب اليوم في السنة الميلادية — مع قائمة أقرب المواعيد القادمة: الرواتب، المناسبات، والإجازات الدراسية.',
};

function hijriInRiyadh(date: Date): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
    timeZone: 'Asia/Riyadh',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value;
  return { y: parseInt(get('year') || '0', 10), m: parseInt(get('month') || '0', 10), d: parseInt(get('day') || '0', 10) };
}

function gregorianInRiyadh(date: Date): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Riyadh',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value;
  return { y: parseInt(get('year') || '0', 10), m: parseInt(get('month') || '0', 10), d: parseInt(get('day') || '0', 10) };
}

export default function TodayPage() {
  const now = new Date();
  const base = siteUrl();

  const g = gregorianInRiyadh(now);
  const h = hijriInRiyadh(now);
  const gregDate = new Date(Date.UTC(g.y, g.m - 1, g.d, 12));

  const weekday = new Intl.DateTimeFormat('ar', { timeZone: 'Asia/Riyadh', weekday: 'long' }).format(now);
  const gregMonth = new Intl.DateTimeFormat('ar', { timeZone: 'Asia/Riyadh', month: 'long' }).format(now);
  const hijriMonth = HIJRI_MONTHS[h.m - 1] ?? '';

  // طول الشهر الهجري والأيام المتبقية فيه (عدّاد يومي عبر تقويم أم القرى)
  let remainingInclToday = 1;
  for (let i = 1; i <= 31; i++) {
    const probe = new Date(Date.UTC(g.y, g.m - 1, g.d + i, 12));
    const ph = hijriInRiyadh(probe);
    if (ph.m !== h.m || ph.y !== h.y) break;
    remainingInclToday++;
  }
  const hijriMonthLength = h.d - 1 + remainingInclToday;
  const daysLeftInHijri = remainingInclToday - 1;
  const dayOfYear = Math.floor((Date.UTC(g.y, g.m - 1, g.d) - Date.UTC(g.y, 0, 1)) / 86400000) + 1;
  const daysInYear = (Date.UTC(g.y + 1, 0, 1) - Date.UTC(g.y, 0, 1)) / 86400000;

  // قائمة أقرب المواعيد القادمة
  const candidates: { name: string; icon: string; date: Date; href: string; note: string }[] = [];
  for (const p of SALARY_PROGRAMS) {
    const np = nextMonthlyPayment(p.dayOfMonth, now);
    if (np) candidates.push({ name: `صرف ${p.name}`, icon: p.icon, date: np, href: `/salaries/${p.slug}`, note: 'موعد صرف' });
  }
  const sa = getCountry('saudi-arabia');
  if (sa) {
    for (const hol of sa.holidays) {
      const r = resolveHoliday(hol, now);
      if (!r.date) continue;
      const days = daysBetween(now, r.date);
      if (days >= 0 && days <= 120) {
        candidates.push({ name: hol.name, icon: '🕌', date: r.date, href: `/countdowns/saudi-arabia/${hol.slug}`, note: 'مناسبة' });
      }
    }
  }
  for (const ev of SCHOOL_YEAR.events) {
    const date = new Date(ev.date + 'T12:00:00');
    const days = daysBetween(now, date);
    if (days >= 0 && days <= 120) {
      candidates.push({ name: ev.name, icon: ev.icon, date, href: '/school-calendar', note: 'التقويم الدراسي' });
    }
  }
  candidates.sort((a, b) => a.date.getTime() - b.date.getTime());
  const nextDates = candidates.slice(0, 6);

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: metadata.title,
        description: metadata.description,
        url: `${base}/today`,
        inLanguage: 'ar',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: base },
          { '@type': 'ListItem', position: 2, name: 'التقويم والمواعيد', item: `${base}/s/calendar` },
          { '@type': 'ListItem', position: 3, name: 'التاريخ اليوم' },
        ],
      },
      {
        '@type': 'Event',
        name: `التاريخ اليوم: ${weekday} ${g.d} ${gregMonth} ${g.y}م / ${h.d} ${hijriMonth} ${h.y}هـ`,
        startDate: isoDay(gregDate),
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
          '@type': 'Place',
          name: 'الرياض، المملكة العربية السعودية',
          address: { '@type': 'PostalAddress', addressCountry: 'SA' },
        },
      },
    ],
  };

  const details: { label: string; value: string }[] = [
    { label: 'اليوم', value: weekday },
    { label: 'الشهر الهجري', value: hijriMonth },
    { label: 'الشهر الميلادي', value: gregMonth },
    { label: `طول شهر ${hijriMonth}`, value: `${hijriMonthLength} يوماً` },
    { label: 'المتبقي من الشهر الهجري', value: `${daysLeftInHijri} ${daysLeftInHijri === 0 ? 'يوم' : 'أيام'}` },
    { label: 'ترتيب اليوم في السنة', value: `اليوم ${dayOfYear} من ${daysInYear}` },
  ];

  return (
    <div>
      <JsonLd data={graph} />

      {/* الرأس */}
      <div className="border-b border-slate-200/70 bg-gradient-to-b from-indigo-50/70 to-white">
        <div className="container-site py-10">
          <Breadcrumbs
            items={[
              { label: 'التقويم والمواعيد', href: '/s/calendar' },
              { label: 'التاريخ اليوم' },
            ]}
          />
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            📅 التاريخ اليوم
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
            التاريخ اليوم بالتقويمين الهجري والميلادي بتوقيت مدينة الرياض، مع تفاصيل الشهر
            الهجري وترتيب اليوم في السنة، وقائمة أقرب المواعيد القادمة.
          </p>
        </div>
      </div>

      <div className="container-site space-y-12 py-10">
        {/* بطاقتا التاريخ */}
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="card flex flex-col justify-center p-6">
            <div className="text-xs font-extrabold uppercase tracking-wide text-indigo-600">التاريخ الهجري</div>
            <div className="mt-3 text-3xl font-extrabold text-slate-900">
              {h.d} {hijriMonth} {h.y}هـ
            </div>
            <div className="mt-2 text-sm text-slate-500">{weekday} — الشهر {h.m} من العام الهجري {h.y}هـ</div>
          </div>
          <div className="card flex flex-col justify-center p-6">
            <div className="text-xs font-extrabold uppercase tracking-wide text-indigo-600">التاريخ الميلادي</div>
            <div className="mt-3 text-3xl font-extrabold text-slate-900">
              {formatDateShort(gregDate)}
            </div>
            <div className="mt-2 text-sm text-slate-500">
              {weekday} — {gregMonth} {g.y}م
            </div>
          </div>
        </section>

        {/* الساعة الحية */}
        <section className="mx-auto max-w-xl">
          <RiyadhClock />
        </section>

        {/* التفاصيل */}
        <section>
          <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">تفاصيل اليوم</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {details.map((d) => (
              <div key={d.label} className="card p-4">
                <div className="text-xs font-bold text-slate-400">{d.label}</div>
                <div className="mt-1 text-lg font-extrabold text-slate-900">{d.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* أقرب المواعيد */}
        <section>
          <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">أقرب المواعيد القادمة</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {nextDates.map((c) => {
              const days = daysBetween(now, c.date);
              return (
                <Link
                  key={c.href + c.date.toISOString()}
                  href={c.href}
                  className="card card-hover flex items-center gap-3 p-4"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-xl" aria-hidden>
                    {c.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-extrabold text-slate-900">{c.name}</div>
                    <div className="truncate text-xs text-slate-500">
                      {formatDateFull(c.date)} — {c.note}
                    </div>
                  </div>
                  <span className="ms-auto shrink-0 rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-extrabold text-indigo-700">
                    {days === 0 ? 'اليوم' : `${days} يوم`}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* روابط داخلية */}
        <section className="border-t border-slate-200/70 pt-10">
          <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">استكشف المزيد</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/countdowns" className="badge border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700">
              ⏳ عدّادات المناسبات
            </Link>
            <Link href="/salaries" className="badge border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700">
              💰 مواعيد صرف الرواتب
            </Link>
            <Link href="/school-calendar" className="badge border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700">
              🏫 التقويم الدراسي
            </Link>
            <Link href="/holidays/saudi-arabia" className="badge border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700">
              🇸🇦 الإجازات الرسمية
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
