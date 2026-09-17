import type { Metadata } from 'next';
import Link from 'next/link';
import { siteUrl } from '@/data/countdown';
import Breadcrumbs from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'الأسئلة الشائعة — رواتب، تقويم هجري، إجازات، وأدوات',
  description:
    'إجابات شاملة على أكثر الأسئلة شيوعاً: مواعيد صرف الرواتب (حكومة، معاشات، حساب مواطن، ساس، إسكان)، مواعيد المناسبات الهجرية لعام 1448هـ، الإجازات الرسمية في السعودية، وكيفية استخدام أدوات الموقع (محوّل التاريخ، حاسبة العمر، وغيرها).',
};

interface Group {
  title: string;
  icon: string;
  faqs: { q: string; a: string }[];
}

const GROUPS: Group[] = [
  {
    title: 'مواعيد صرف الرواتب والدعم',
    icon: '💰',
    faqs: [
      {
        q: 'متى يُصرف راتب الموظف الحكومي في السعودية؟',
        a: 'يوم الخميس 27 من كل شهر ميلادي، مع تطبيق قاعدة الإجازة الأسبوعية: إذا صادف يوم 27 يوم جمعة يُقدّم الصرف إلى الخميس قبله، وإذا صادف يوم سبت يؤجل إلى الأحد التالي.',
      },
      {
        q: 'متى يُصرف المعاش التقاعدي (رواتب المتقاعدين)؟',
        a: 'يوم 1 من كل شهر ميلادي، مع القاعدة نفسها: إن كان اليوم 1 يوم سبت يُؤجل الصرف إلى الأحد التالي (1 مايو 2027 مثالاً: يصادف السبت فيُصرف يوم الأحد 2 مايو).',
      },
      {
        q: 'متى تُصرف منح حساب المواطن؟',
        a: 'يوم 10 من كل شهر ميلادي تقريباً، مع إزاحة أيام الإجازة الأسبوعية: إذا صادف يوم 10 يوم سبت يُصرف في الأحد التالي (11 أكتوبر 2026 مثالاً).',
      },
      {
        q: 'متى يُصرف معاش الضمان الاجتماعي المطوّر (SSN)؟',
        a: 'يوم 1 من كل شهر ميلادي للمستفيدين المستحقين، مع إزاحة أيام الإجازة الأسبوعية (السبت ← الأحد، الجمعة ← الخميس).',
      },
      {
        q: 'متى تُصرف أرباح صندوق الإسكان؟',
        a: 'يوم الخميس 24 من كل شهر ميلادي، مع القاعدة نفسها: إن صادف 24 يوم جمعة يُقدّم إلى الخميس قبله، وإن صادف سبت يؤجل إلى الأحد التالي (24 سبتمبر 2026 مثالاً).',
      },
    ],
  },
  {
    title: 'التقويم الهجري لعام 1448هـ',
    icon: '🌙',
    faqs: [
      {
        q: 'متى بدأت سنة 1448هـ؟',
        a: 'بدأت سنة 1448هـ في يوم الثلاثاء 1 محرم 1448 الموافق 16 يونيو 2026م وفق تقويم أم القرى.',
      },
      {
        q: 'متى يبدأ رمضان 1448هـ؟',
        a: 'من المتوقع أن يبدأ شهر رمضان 1448هـ يوم الأحد 17 فبراير 2027م (1 رمضان 1448هـ) — التواريخ تقريبية حتى تثبت رؤية الهلال.',
      },
      {
        q: 'متى عيد الفطر 1448هـ؟',
        a: 'عيد الفطر 1448هـ يوافق 1 شوال 1448 وهو يوم الثلاثاء 9 مارس 2027م تقريباً، وتستمر الإجازة 4 أيام على الأقل.',
      },
      {
        q: 'متى عيد الأضحى 1448هـ؟',
        a: 'عيد الأضحى 1448هـ يوافق 10 ذو الحجة 1448 وهو يوم الأحد 16 مايو 2027م تقريباً، وتسبقه وقفة عرفة يوم السبت 15 مايو 2027م.',
      },
      {
        q: 'كيف تُحدد تواريخ المناسبات الدينية؟',
        a: 'تُحدد وفق تقويم أم القرى بالتاريخ المتوقع، ويُعلن التأكد بعد رؤية الهلال — لذلك قد يختلف الموعد الرسمي بيوم واحد عن التاريخ التقديري المعروض في الموقع.',
      },
    ],
  },
  {
    title: 'الإجازات الرسمية في السعودية',
    icon: '🇸🇦',
    faqs: [
      {
        q: 'متى اليوم الوطني السعودي 2026؟',
        a: 'يوم الأربعاء 23 سبتمبر 2026م — إجازة رسمية واحدة يتخللها فعاليات وطنية في جميع مدن المملكة.',
      },
      {
        q: 'متى يوم التأسيس السعودي؟',
        a: 'يوم الأحد 22 فبراير 2026م (و22 فبراير من كل عام) — إجازة رسمية منذ الأمر الملكي الصادر في 27 يناير 2022م.',
      },
      {
        q: 'ما هو يوم العلم في السعودية؟',
        a: 'يوم العلم يوافق 22 سبتمبر من كل عام (اليوم الدراسي الأول في المدارس الحكومية) ويُقام فيه تكريم المعلمين والمعلمات — وليس إجازة رسمية بل يوم مدرسي مميز.',
      },
      {
        q: 'كم يوماً تستمر إجازة العيد؟',
        a: 'بحسب قرار مجلس الوزراء تكون إجازة عيدي الفطر والأضحى بحد أدنى 4 أيام عمل وبحد أقصى 5 أيام عمل، وقد تعلن إجازات إضافية في بعض السنوات.',
      },
    ],
  },
  {
    title: 'أدوات الموقع',
    icon: '🧮',
    faqs: [
      {
        q: 'كيف أحوّل بين التاريخ الهجري والميلادي؟',
        a: 'استخدم أداة «محوّل التاريخ الهجري والميلادي» في قسم التقويم والأدوات: أدخل أي تاريخ بالتقويمين واحصل على المقابل فوراً وفق تقويم أم القرى.',
      },
      {
        q: 'هل تواريخ المناسبات في الموقع دقيقة؟',
        a: 'التواريخ الوطنية والدراسية ثابتة وموثقة، أما التواريخ الدينية فمعروضة بالتقويم المتوقع (أم القرى) وقد تختلف يومياً عن الإعلان الرسمي بعد رؤية الهلال.',
      },
      {
        q: 'كيف أحسب عمري بالتقويم الهجري؟',
        a: 'أداة «حاسبة العمر» تعرض عمرك بالتقويمين الميلادي والهجري معاً: أدخل تاريخ ميلادك وستظهر سنواتك وشهورك وأيامك بالتقويمين.',
      },
      {
        q: 'كيف أعرف ما يوم الأسبوعو لتاريخ معين؟',
        a: 'أداة «يوم الأسبوعو لأي تاريخ» تعيد يوم أي تاريخ مضى أو قادم فوراً — مثالية للتواريخ التي تحفظها بالتقويم الميلادي وتريد معرفة يومها.',
      },
    ],
  },
];

const ALL_FAQS = GROUPS.flatMap((g) => g.faqs);

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="card group px-5 py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold text-slate-900">
        <span>{q}</span>
        <span aria-hidden className="shrink-0 text-xl leading-none text-indigo-600 transition-transform duration-200 group-open:rotate-45">
          +
        </span>
      </summary>
      <p className="mt-3 text-sm leading-7 text-slate-600">{a}</p>
    </details>
  );
}

export default function FaqPage() {
  const base = siteUrl();
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: metadata.title,
        description: metadata.description,
        url: `${base}/faq`,
        inLanguage: 'ar',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: base },
          { '@type': 'ListItem', position: 2, name: 'التقويم والمواعيد', item: `${base}/s/calendar` },
          { '@type': 'ListItem', position: 3, name: 'الأسئلة الشائعة' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: ALL_FAQS.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
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
              { label: 'الأسئلة الشائعة' },
            ]}
          />
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            ❓ الأسئلة الشائعة
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
            إجابات موحدة على أكثر الأسئلة شيوعاً حول مواعيد الرواتب والمناسبات الهجرية والإجازات
            الرسمية وأدوات الموقع — مرتبة حسب الموضوع.
          </p>
        </div>
      </div>

      <div className="container-site space-y-12 py-10">
        {GROUPS.map((g) => (
          <section key={g.title}>
            <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">
              <span aria-hidden className="ms-1">{g.icon}</span> {g.title}
            </h2>
            <div className="mt-4 space-y-3">
              {g.faqs.map((f) => (
                <FaqItem key={f.q} q={f.q} a={f.a} />
              ))}
            </div>
          </section>
        ))}

        {/* روابط داخلية */}
        <section className="border-t border-slate-200/70 pt-10">
          <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">صفحات مفصلة</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/salaries" className="badge border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700">
              💰 مواعيد صرف الرواتب
            </Link>
            <Link href="/countdowns" className="badge border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700">
              ⏳ عدّادات المناسبات
            </Link>
            <Link href="/school-calendar" className="badge border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700">
              🏫 التقويم الدراسي
            </Link>
            <Link href="/holidays/saudi-arabia" className="badge border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700">
              🇸🇦 الإجازات الرسمية
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
