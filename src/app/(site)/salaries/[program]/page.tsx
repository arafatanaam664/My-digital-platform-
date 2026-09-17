import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SALARY_PROGRAMS, getSalaryProgram } from '@/data/salaries';
import { siteUrl } from '@/data/countdown';
import Breadcrumbs from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import CountdownTimer from '@/components/CountdownTimer';
import FaqSection from '@/components/FaqSection';
import Markdown from '@/components/Markdown';
import { nextMonthlyPayment } from '@/lib/schedules';
import { daysBetween, formatDateFull, formatDateShort, isoDay } from '@/lib/countdown';
import { gregToHijri, HIJRI_MONTHS } from '@/tools/hijri';

interface Props {
  params: { program: string };
}

export function generateStaticParams() {
  return SALARY_PROGRAMS.map((p) => ({ program: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getSalaryProgram(params.program);
  if (!p) return {};
  const date = nextMonthlyPayment(p.dayOfMonth);
  const hijri = gregToHijri(date);
  return {
    title: `متى ${p.name} ${date.getFullYear()}؟ موعد الصرف القادم`,
    description: `${p.name} يُصرف يوم ${p.dayOfMonth} من كل شهر ميلادي — أقرب موعد صرف: ${formatDateShort(date)} (${hijri.d} ${HIJRI_MONTHS[hijri.m - 1]} ${hijri.y}هـ). راقب العدّاد التنازلي المباشر مع التفاصيل الكاملة والأسئلة الشائعة.`,
  };
}

export default function SalaryProgramPage({ params }: Props) {
  const p = getSalaryProgram(params.program);
  if (!p) notFound();

  const now = new Date();
  const base = siteUrl();
  const date = nextMonthlyPayment(p.dayOfMonth, now);
  const hijri = gregToHijri(date);
  const days = daysBetween(now, date);

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: `متى ${p.name}؟ موعد الصرف القادم`,
        description: `موعد صرف ${p.name} القادم بالتاريخين الميلادي والهجري مع العد التنازلي المباشر.`,
        url: `${base}/salaries/${p.slug}`,
        inLanguage: 'ar',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: base },
          { '@type': 'ListItem', position: 2, name: 'الرواتب والدعم', item: `${base}/salaries` },
          { '@type': 'ListItem', position: 3, name: p.name },
        ],
      },
      {
        '@type': 'Event',
        name: `صرف ${p.name}`,
        description: p.rule,
        startDate: isoDay(date),
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
          '@type': 'Place',
          name: 'المملكة العربية السعودية',
          address: { '@type': 'PostalAddress', addressCountry: 'SA' },
        },
      },
      {
        '@type': 'ItemList',
        name: 'برامج رواتب ودعم أخرى',
        numberOfItems: SALARY_PROGRAMS.length - 1,
        itemListElement: SALARY_PROGRAMS.filter((x) => x.slug !== p.slug).map((x, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: x.name,
          url: `${base}/salaries/${x.slug}`,
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
              { label: 'الرواتب والدعم', href: '/salaries' },
              { label: p.name },
            ]}
          />
          <div className="mt-5 flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-4xl shadow-sm" aria-hidden>
              {p.icon}
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                متى {p.name}؟
              </h1>
              <p className="mt-1.5 text-sm font-semibold text-slate-500">{p.authority}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-site py-10">
        {/* العدّاد + الموعد */}
        <div className="mx-auto max-w-2xl space-y-4">
          <CountdownTimer targetIso={date.toISOString()} />
          <div className="card flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-4 text-center">
            <div className="text-sm text-slate-600">
              <span className="font-bold text-slate-900">{formatDateFull(date)}</span>
            </div>
            <div className="text-sm text-slate-600">
              بالتقويم الهجري: <span className="font-bold text-slate-900">{hijri.d} {HIJRI_MONTHS[hijri.m - 1]} {hijri.y}هـ</span>
            </div>
            <div className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-extrabold text-white shadow-sm">
              {days === 0 ? 'يوم الصرف هو اليوم 💰' : `متبقي ${days} يوم`}
            </div>
          </div>
        </div>

        {/* القاعدة + الوصف */}
        <article className="mx-auto mt-10 max-w-3xl space-y-5">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5">
            <h2 className="font-extrabold text-slate-900">القاعدة الشهرية</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">{p.rule}</p>
          </div>
          <div className="text-sm leading-8 text-slate-700">
            <Markdown>{p.description}</Markdown>
          </div>
        </article>

        {/* الأسئلة الشائعة + FAQPage */}
        <div className="mx-auto max-w-3xl">
          <FaqSection faqs={p.faq} />
        </div>

        {/* برامج أخرى */}
        <section className="mt-12 border-t border-slate-200/70 pt-10">
          <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">برامج رواتب ودعم أخرى</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {SALARY_PROGRAMS.filter((x) => x.slug !== p.slug).map((x) => {
              const xd = nextMonthlyPayment(x.dayOfMonth, now);
              return (
                <Link
                  key={x.slug}
                  href={`/salaries/${x.slug}`}
                  className="badge border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700"
                >
                  {x.icon} {x.name} — {formatDateShort(xd)}
                </Link>
              );
            })}
          </div>
        </section>

        {/* روابط داخلية */}
        <section className="mt-10 border-t border-slate-200/70 pt-10">
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
          </div>
        </section>
      </div>
    </div>
  );
}
