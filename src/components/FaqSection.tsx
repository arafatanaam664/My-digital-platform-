import type { Faq } from '@/data/countdown/types';
import { JsonLd } from './JsonLd';

/**
 * قسم أسئلة شائعة: أكورديون (details/summary) + بيانات منظمة FAQPage
 * — يرفع فرص الظهور في النتائج المميزة (Featured Snippets) لمحركات البحث.
 */
export default function FaqSection({ faqs }: { faqs: Faq[] }) {
  if (faqs.length === 0) return null;

  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <section className="mt-12" id="faq">
      <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">الأسئلة الشائعة</h2>
      <div className="mt-4 space-y-3">
        {faqs.map((f, i) => (
          <details key={i} className="card group px-5 py-4" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold text-slate-900">
              <span>{f.q}</span>
              <span aria-hidden className="shrink-0 text-xl leading-none text-indigo-600 transition-transform duration-200 group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-7 text-slate-600">{f.a}</p>
          </details>
        ))}
      </div>
      <JsonLd data={data} />
    </section>
  );
}
