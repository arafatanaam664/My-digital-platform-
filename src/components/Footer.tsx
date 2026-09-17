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
    <footer className="mt-20 bg-slate-900 text-slate-400">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        {/* العلامة */}
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-xl text-white">🧭</span>
            <span className="text-lg font-extrabold text-white">{s.siteName}</span>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-400">{s.description}</p>
          {socials.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {socials.map((x) => (
                <a
                  key={x.key}
                  href={s[x.key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-indigo-500 hover:text-white"
                >
                  {x.icon} {x.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* الأقسام */}
        {sections.slice(0, 3).map((sec) => (
          <div key={sec.id}>
            <Link
              href={`/s/${sec.slug}`}
              className="text-sm font-extrabold text-white transition hover:text-indigo-300"
            >
              {sec.icon} {sec.name}
            </Link>
            <ul className="mt-4 space-y-2.5">
              {(sec.subsections ?? []).map((sub) => (
                <li key={sub.id}>
                  <Link href={`/s/${sec.slug}/${sub.slug}`} className="text-sm text-slate-400 transition hover:text-indigo-300">
                    {sub.name}
                  </Link>
                </li>
              ))}
              {(sec.subsections?.length ?? 0) === 0 && <li className="text-sm text-slate-600">قريباً</li>}
            </ul>
          </div>
        ))}

        {/* أحدث المحتوى */}
        <div>
          <div className="text-sm font-extrabold text-white">أحدث المحتوى</div>
          <ul className="mt-4 space-y-2.5">
            {latest.map((it) => (
              <li key={it.id}>
                <Link href={itemUrl(it)} className="line-clamp-2 text-sm text-slate-400 transition hover:text-indigo-300">
                  {it.title}
                </Link>
              </li>
            ))}
            {latest.length === 0 && <li className="text-sm text-slate-600">لا يوجد محتوى بعد</li>}
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-slate-500">
          <span>
            © {new Date().getFullYear()} {s.siteName} — {s.footerText}
          </span>
          {latest[0] && (
            <span>
              آخر تحديث: {TYPE_LABEL[latest[0].type]} · {fmtDate(latest[0].publishedAt)}
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}
