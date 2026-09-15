import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { fmtDate, itemUrl, TYPE_LABEL } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function Footer() {
  const s = await getSettings();
  const [sections, latest] = await Promise.all([
    prisma.section.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: { subsections: { where: { isActive: true }, orderBy: { order: 'asc' } } },
    }),
    prisma.contentItem.findMany({
      where: { status: 'published' },
      orderBy: { publishedAt: 'desc' },
      take: 6,
    }),
  ]);

  const socials = [
    { key: 'telegram', label: 'تليجرام', icon: '✈️' },
    { key: 'twitter', label: 'إكس / تويتر', icon: '𝕏' },
    { key: 'youtube', label: 'يوتيوب', icon: '▶️' },
  ].filter((x) => s[x.key]);

  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-lg text-white">🧭</span>
            <span className="text-lg font-extrabold text-slate-900">{s.siteName}</span>
          </div>
          <p className="mt-3 text-sm leading-7 text-slate-500">{s.description}</p>
          {socials.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {socials.map((x) => (
                <a
                  key={x.key}
                  href={s[x.key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
                >
                  {x.icon} {x.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {sections.slice(0, 3).map((sec) => (
          <div key={sec.id}>
            <Link href={`/s/${sec.slug}`} className="text-sm font-extrabold text-slate-900 hover:text-indigo-700">
              {sec.icon} {sec.name}
            </Link>
            <ul className="mt-3 space-y-2">
              {(sec.subsections ?? []).map((sub) => (
                <li key={sub.id}>
                  <Link href={`/s/${sec.slug}/${sub.slug}`} className="text-sm text-slate-500 hover:text-indigo-700">
                    {sub.name}
                  </Link>
                </li>
              ))}
              {(sec.subsections?.length ?? 0) === 0 && <li className="text-sm text-slate-400">قريباً</li>}
            </ul>
          </div>
        ))}

        <div>
          <div className="text-sm font-extrabold text-slate-900">أحدث المحتوى</div>
          <ul className="mt-3 space-y-2">
            {latest.map((it) => (
              <li key={it.id}>
                <Link href={itemUrl(it)} className="line-clamp-2 text-sm text-slate-500 hover:text-indigo-700">
                  {it.title}
                </Link>
              </li>
            ))}
            {latest.length === 0 && <li className="text-sm text-slate-400">لا يوجد محتوى بعد</li>}
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-slate-400">
          <span>
            © {new Date().getFullYear()} {s.siteName} — {s.footerText}
          </span>
          <span>
            المحتوى:{' '}
            {latest.length > 0 && <span className="text-slate-500">{TYPE_LABEL[latest[0].type]}: {fmtDate(latest[0].publishedAt)}</span>}
          </span>
        </div>
      </div>
    </footer>
  );
}
