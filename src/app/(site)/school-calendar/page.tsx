import type { Metadata } from 'next';
import Link from 'next/link';
import { SCHOOL_YEAR } from '@/data/school-calendar';
import { siteUrl } from '@/data/countdown';
import Breadcrumbs from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import CountdownTimer from '@/components/CountdownTimer';
import FaqSection from '@/components/FaqSection';
import { daysBetween, formatDateFull, formatDateShort, weekdayOf, isoDay } from '@/lib/countdown';
import { gregToHijri, HIJRI_MONTHS } from '@/tools/hijri';

export const metadata: Metadata = {
  title: 'التقويم الدراسي السعودي 1448-1449هـ (2026-2027) — مواعيد الدراسة والإجازات',
  description:
    'التقويم الدراسي السعودي الرسمي للعام 1448-1449هـ (2026-2027م) وفق وزارة التعليم: بداية العام الدراسي 23 أغسطس 2026، إجازة منتصف الفصل الأول 25 أكتوبر 2026، إجازة منتصف العام 24 يناير 2027، إجازة منتصف الفصل الثاني 28 مارس 2027، ونهاية العام 27 مايو 2027 — مع عدّاد تنازلي مباشر لأقرب موعد.',
};

const FAQS = [
  {
    q: 'متى بداية العام الدراسي 1448-1449هـ؟',
    a: 'بداية العام الدراسي 1448-1449هـ (الفصل الدراسي الأول) يوم الأحد 23 أغسطس 2026م، بعد عودة المعلمين والمعلمات في 16 أغسطس 2026م.',
  },
  {
    q: 'متى إجازة منتصف الفصل الدراسي الأول؟',
    a: 'إجازة 4 أيام تبدأ يوم الأحد 25 أكتوبر 2026م (14 جمادى الأولى 1448هـ) وفق تقويم وزارة التعليم.',
  },
  {
    q: 'متى إجازة منتصف العام الدراسي؟',
    a: 'إجازة 9 أيام تبدأ يوم الأحد 24 يناير 2027م (16 شعبان 1448هـ) بين الفصلين الأول والثاني.',
  },
  {
    q: 'متى نهاية العام الدراسي 1448-1449هـ؟',
    a: 'نهاية اختبارات الفصل الدراسي الثالث يوم الخميس 27 مايو 2027م، وتبدأ بعدها إجازة الصيف لمدة 75 يوماً حتى بداية العام الدراسي التالي.',
  },
  {
    q: 'هل يتغير التقويم الدراسي؟',
    a: 'التقويم المعتمد يصدر عن وزارة التعليم في بداية كل عام، وقد تُعلن تعديلات طفيفة وفق اعتبارات دينية أو قومية — التواريخ المعروضة هنا وفق التقويم المعلن ولأغراض معلوماتية.',
  },
];

export default function SchoolCalendarPage() {
  const now = new Date();
  const base = siteUrl();

  const rows = SCHOOL_YEAR.events.map((ev) => {
    const date = new Date(ev.date + 'T00:00:00');
    const hijri = gregToHijri(date);
    return { ev, date, hijri, days: daysBetween(now, date) };
  });
  const next = rows.find((r) => r.days >= 0) ?? null;

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: metadata.title,
        description: metadata.description,
        url: `${base}/school-calendar`,
        inLanguage: 'ar',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: base },
          { '@type': 'ListItem', position: 2, name: 'التقويم والمواعيد', item: `${base}/s/calendar` },
          { '@type': 'ListItem', position: 3, name: 'التقويم الدراسي' },
        ],
      },
      ...(next
        ? [
            {
              '@type': 'Event',
              name: next.ev.name,
              description: next.ev.description,
              startDate: isoDay(next.date),
              eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
              location: {
                '@type': 'Place',
                name: 'المملكة العربية السعودية',
                address: { '@type': 'PostalAddress', addressCountry: 'SA' },
              },
            },
          ]
        : []),
      {
        '@type': 'ItemList',
        name: 'التقويم الدراسي 1448-1449هـ',
        numberOfItems: rows.length,
        itemListElement: rows.map(({ ev, date }, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: ev.name,
          startDate: isoDay(date),
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
              { label: 'التقويم الدراسي' },
            ]}
          />
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            🏫 التقويم الدراسي السعودي {SCHOOL_YEAR.label}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
            مواعيد بداية الدراسة والإجازات الرسمية وفق تقويم وزارة التعليم السعودي لجميع مراحل
            التعليم العام (الابتدائي، المتوسط، الثانوي) — بالتاريخين الميلادي والهجري.
          </p>
        </div>
      </div>

      <div className="container-site space-y-12 py-10">
        {/* أقرب موعد دراسي */}
        {next && (
          <section>
            <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">أقرب موعد دراسي</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-2xl shadow-sm" aria-hidden>
                    {next.ev.icon}
                  </span>
                  <div>
                    <div className="font-extrabold text-slate-900">{next.ev.name}</div>
                    <div className="text-xs text-slate-500">
                      {formatDateFull(next.date)}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <CountdownTimer targetIso={next.date.toISOString()} />
                </div>
              </div>
              <div className="flex flex-col justify-center rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm leading-7 text-slate-600">{next.ev.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-extrabold text-white shadow-sm">
                    {next.days === 0 ? 'يبدأ اليوم' : `متبقي ${next.days} يوم`}
                  </span>
                  {next.ev.durationDays > 0 && (
                    <span className="rounded-lg bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-600">
                      إجازة {next.ev.durationDays} {next.ev.durationDays === 1 ? 'يوم' : 'أيام'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* الجدول الكامل */}
        <section>
          <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">جدول التقويم الدراسي</h2>
          <div className="mt-4 space-y-3">
            {rows.map(({ ev, date, hijri, days }) => (
              <div key={ev.slug} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-50 text-2xl" aria-hidden>
                    {ev.icon}
                  </span>
                  <div>
                    <div className="font-extrabold text-slate-900">
                      {ev.name}
                      {ev.durationDays > 0 && (
                        <span className="mr-2 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                          إجازة {ev.durationDays} {ev.durationDays === 1 ? 'يوم' : 'أيام'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs leading-6 text-slate-500">
                      {formatDateShort(date)} — {hijri.d} {HIJRI_MONTHS[hijri.m - 1]} {hijri.y}هـ — {weekdayOf(date)}
                    </div>
                  </div>
                </div>
                <span
                  className={
                    'shrink-0 rounded-lg px-4 py-1.5 text-xs font-extrabold ' +
                    (days < 0
                      ? 'bg-slate-100 text-slate-400'
                      : days === 0
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-50 text-indigo-700')
                  }
                >
                  {days < 0 ? 'انتهت' : days === 0 ? 'اليوم' : `متبقي ${days} يوم`}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* عن التقويم */}
        <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
          <h2 className="font-extrabold text-slate-900">عن التقويم الدراسي</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            يُحدد التقويم الدراسي في المملكة العربية السعودية من قبل وزارة التعليم لجميع مراحل
            التعليم العام في جميع المناطق الإدارية. يتضمن التقويم مواعيد بداية ونهاية كل فصل
            دراسي، وإجازات منتصف الفصل، والإجازات الرسمية الدينية والوطنية. التقويم المعروض هنا
            وفق تقويم وزارة التعليم المعلن، والتواريخ تقريبية ولأغراض معلوماتية — يُنصح بمتابعة
            الإعلانات الرسمية من الوزارة.
          </p>
        </section>

        <div className="mx-auto max-w-3xl">
          <FaqSection faqs={FAQS} />
        </div>

        {/* روابط داخلية */}
        <section className="border-t border-slate-200/70 pt-10">
          <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">مواعيد أخرى قد تهمك</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/holidays/saudi-arabia" className="badge border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700">
              🇸🇦 الإجازات الرسمية في السعودية
            </Link>
            <Link href="/salaries" className="badge border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700">
              💰 مواعيد صرف الرواتب
            </Link>
            <Link href="/countdowns/saudi-arabia" className="badge border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700">
              ⏳ عدّادات المناسبات السعودية
            </Link>
            <Link href="/today" className="badge border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700">
              📅 التاريخ اليوم
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
