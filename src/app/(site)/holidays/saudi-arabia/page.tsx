import type { Metadata } from 'next';
import Link from 'next/link';
import { getCountry, siteUrl } from '@/data/countdown';
import { SCHOOL_YEAR } from '@/data/school-calendar';
import Breadcrumbs from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import CountdownTimer from '@/components/CountdownTimer';
import FaqSection from '@/components/FaqSection';
import { resolveHoliday, daysBetween, formatDateFull, formatDateShort, weekdayOf, isoDay } from '@/lib/countdown';
import { gregToHijri, HIJRI_MONTHS } from '@/tools/hijri';

export const metadata: Metadata = {
  title: 'الإجازات الرسمية في السعودية 2026-2027 — قائمة كاملة بالتواريخ',
  description:
    'قائمة كاملة بالإجازات الرسمية في المملكة العربية السعودية 2026-2027: الدينية (رأس السنة الهجرية، عيد الفطر، وقفة عرفة، عيد الأضحى) والوطنية (يوم التأسيس، اليوم الوطني) والدراسية (إجازات التقويم الدراسي) — مع مدة كل إجازة وتاريخها الميلادي والهجري وعدّاد تنازلي لأقرب إجازة.',
};

interface Row {
  key: string;
  name: string;
  icon: string;
  category: 'دينية' | 'وطنية' | 'دراسية';
  date: Date;
  durationLabel: string;
  description: string;
  href: string;
}

const FAQS = [
  {
    q: 'ما هي الإجازات الرسمية في السعودية 2026-2027؟',
    a: 'الإجازات الدينية: رأس السنة الهجرية (1 محرم)، عيد الفطر (1-4 شوال)، وقفة عرفة (9 ذو الحجة)، عيد الأضحى (10-13 ذو الحجة). والوطنية: يوم التأسيس (22 فبراير) واليوم الوطني (23 سبتمبر). إضافة إلى الإجازات الدراسية وفق تقويم وزارة التعليم.',
  },
  {
    q: 'كم يوم إجازة عيد الفطر وعيد الأضحى؟',
    a: 'بحسب قرار مجلس الوزراء (يناير 2024) تكون إجازة كل من عيدي الفطر والأضحى بحد أدنى 4 أيام عمل وبحد أقصى 5 أيام عمل، وقد تُعلن إجازات إضافية في بعض السنوات.',
  },
  {
    q: 'متى اليوم الوطني السعودي 2026؟',
    a: 'يوم الأربعاء 23 سبتمبر 2026م — إجازة رسمية واحدة، وتُقام فيه الفعاليات الوطنية في كل مدن المملكة.',
  },
  {
    q: 'هل يوم التأسيس إجازة رسمية؟',
    a: 'نعم، يوم التأسيس (22 فبراير من كل عام) إجازة رسمية مدفوعة الأجر للقطاعين العام والخاص بموجب الأمر الملكي الصادر في 27 يناير 2022م.',
  },
  {
    q: 'كيف أعرف مواعيد الإجازات قبل صدورها؟',
    a: 'الإجازات الدينية تُحسب وفق تقويم أم القرى وقد يختلف الموعد المعلَن بيوم واحد حسب رؤية الهلال، أما الوطنية والدراسية فتواريخها ثابتة مسبقاً — راقب صفحة العدّادات للتحديثات.',
  },
];

export default function SaudiHolidaysPage() {
  const now = new Date();
  const base = siteUrl();
  const sa = getCountry('saudi-arabia');

  const rows: Row[] = [];
  if (sa) {
    const religious: Record<string, { icon: string; duration: string; desc: string }> = {
      'islamic-new-year': {
        icon: '📅',
        duration: 'يوم واحد',
        desc: 'بداية العام الهجري الجديد وفق تقويم أم القرى — عطلة رسمية تحيي ذكرى هجرة النبي ﷺ من مكة إلى المدينة المنورة.',
      },
      'eid-al-fitr': {
        icon: '🎉',
        duration: '4 أيام (قابلة للتمديد)',
        desc: 'يبدأ عيد الفطر في 1 شوال بعد صيام شهر رمضان — تُقام صلاة العيد وتُمنح إجازة بحد أدنى 4 أيام.',
      },
      'day-of-arafah': {
        icon: '🕋',
        duration: 'يوم واحد',
        desc: 'يوم عرفة، أعظم أيام السنة عند المسلمين، يقف فيه حجاج بيت الله الحرام على عرفات ويُستحب صيامه لغير الحجاج.',
      },
      'eid-al-adha': {
        icon: '🐏',
        duration: '4 أيام (قابلة للتمديد)',
        desc: 'يبدأ عيد الأضحى في 10 ذو الحجة ويستمر أيام التشريق — تُقام صلاة العيد وتُذبح الأضاحي.',
      },
    };
    const national: Record<string, { icon: string; duration: string; desc: string }> = {
      'national-day': {
        icon: '🇸🇦',
        duration: 'يوم واحد',
        desc: 'ذكرى توحيد المملكة العربية السعودية على يد الملك عبدالعزيز آل سعود عام 1351هـ/1932م — عطلة وطنية تُقام فيها الفعاليات في كل المدن.',
      },
      'day-of-affirmation': {
        icon: '🏛️',
        duration: 'يوم واحد',
        desc: 'ذكرى تأسيس الدولة السعودية الأولى عام 1139هـ على يد الإمام محمد بن سعود — يوم وطني يُحيي فيه السعوديون إرثهم التاريخي.',
      },
    };
    for (const h of sa.holidays) {
      const r = resolveHoliday(h, now);
      if (!r.date) continue;
      const rel = religious[h.slug];
      const nat = national[h.slug];
      if (rel) {
        rows.push({
          key: h.slug,
          name: h.name,
          icon: rel.icon,
          category: 'دينية',
          date: r.date,
          durationLabel: rel.duration,
          description: rel.desc,
          href: `/countdowns/saudi-arabia/${h.slug}`,
        });
      } else if (nat) {
        rows.push({
          key: h.slug,
          name: h.name,
          icon: nat.icon,
          category: 'وطنية',
          date: r.date,
          durationLabel: nat.duration,
          description: nat.desc,
          href: `/countdowns/saudi-arabia/${h.slug}`,
        });
      }
    }
  }
  for (const ev of SCHOOL_YEAR.events) {
    if (ev.durationDays === 0) continue;
    const date = new Date(ev.date + 'T00:00:00');
    rows.push({
      key: ev.slug,
      name: ev.name,
      icon: ev.icon,
      category: 'دراسية',
      date,
      durationLabel: ev.durationDays === 1 ? 'يوم واحد' : `${ev.durationDays} أيام`,
      description: ev.description,
      href: '/school-calendar',
    });
  }
  rows.sort((a, b) => a.date.getTime() - b.date.getTime());
  const next = rows.find((r) => daysBetween(now, r.date) >= 0) ?? rows[0];

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: metadata.title,
        description: metadata.description,
        url: `${base}/holidays/saudi-arabia`,
        inLanguage: 'ar',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: base },
          { '@type': 'ListItem', position: 2, name: 'التقويم والمواعيد', item: `${base}/s/calendar` },
          { '@type': 'ListItem', position: 3, name: 'الإجازات الرسمية' },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'الإجازات الرسمية في السعودية 2026-2027',
        numberOfItems: rows.length,
        itemListElement: rows.map((r, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: r.name,
          startDate: isoDay(r.date),
          url: r.href,
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
              { label: 'الإجازات الرسمية' },
            ]}
          />
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            🇸🇦 الإجازات الرسمية في السعودية 2026-2027
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
            قائمة كاملة بالإجازات الدينية والوطنية والدراسية في المملكة العربية السعودية مع مدة
            كل إجازة وتاريخها بالتقويمين الميلادي والهجري — وفق تقويم أم القرى وتقويم وزارة التعليم.
          </p>
        </div>
      </div>

      <div className="container-site space-y-12 py-10">
        {/* أقرب إجازة */}
        {next && (
          <section>
            <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">أقرب إجازة رسمية</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-2xl shadow-sm" aria-hidden>
                    {next.icon}
                  </span>
                  <div>
                    <div className="font-extrabold text-slate-900">{next.name}</div>
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
                <p className="text-sm leading-7 text-slate-600">{next.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-extrabold text-white shadow-sm">
                    {daysBetween(now, next.date) === 0 ? 'تبدأ اليوم' : `متبقي ${daysBetween(now, next.date)} يوم`}
                  </span>
                  <span className="rounded-lg bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-600">
                    المدة: {next.durationLabel}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* القائمة الكاملة */}
        <section>
          <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">القائمة الكاملة (الدينية + الوطنية + الدراسية)</h2>
          <div className="mt-4 space-y-3">
            {rows.map((r) => {
              const hijri = gregToHijri(r.date);
              const days = daysBetween(now, r.date);
              return (
                <div key={r.key} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-50 text-2xl" aria-hidden>
                      {r.icon}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-slate-900">{r.name}</span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                          {r.category}
                        </span>
                        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                          {r.durationLabel}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs leading-6 text-slate-500">
                        {formatDateShort(r.date)} — {hijri.d} {HIJRI_MONTHS[hijri.m - 1]} {hijri.y}هـ — {weekdayOf(r.date)}
                      </div>
                    </div>
                  </div>
                  {days >= 0 ? (
                    <span className="shrink-0 rounded-lg bg-indigo-50 px-4 py-1.5 text-xs font-extrabold text-indigo-700">
                      {days === 0 ? 'اليوم' : `متبقي ${days} يوم`}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-lg bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-400">انتهت</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* عن */}
        <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
          <h2 className="font-extrabold text-slate-900">عن الإجازات الرسمية في السعودية</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            تُحدد الإجازات الرسمية في المملكة العربية السعودية وفق تقويم أم القرى وتشمل الإجازات
            الدينية (رأس السنة الهجرية، عيد الفطر، وقفة عرفة، عيد الأضحى) والإجازات الوطنية (يوم
            التأسيس، اليوم الوطني) والإجازات الدراسية وفق تقويم وزارة التعليم. تُعلن الإجازات
            من الجهات المختصة وقد تختلف مدتها من عام لآخر. التواريخ المعروضة تقريبية ولأغراض
            معلوماتية، ويُنصح بمتابعة الإعلانات الرسمية.
          </p>
        </section>

        <div className="mx-auto max-w-3xl">
          <FaqSection faqs={FAQS} />
        </div>

        {/* روابط داخلية */}
        <section className="border-t border-slate-200/70 pt-10">
          <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">مواعيد أخرى قد تهمك</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/countdowns/saudi-arabia" className="badge border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700">
              ⏳ عدّادات المناسبات السعودية
            </Link>
            <Link href="/salaries" className="badge border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700">
              💰 مواعيد صرف الرواتب
            </Link>
            <Link href="/school-calendar" className="badge border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700">
              🏫 التقويم الدراسي 1448-1449هـ
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
