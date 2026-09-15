import { prisma } from './db';

export interface PathInfo {
  contentId: number | null;
  sectionId: number | null;
  type: string;
  title: string | null;
}

const cache = new Map<string, { at: number; info: PathInfo }>();
const TTL = 120_000;

async function lookup(path: string): Promise<PathInfo> {
  const norm = path.split('?')[0].replace(/\/+$/, '') || '/';
  if (norm === '/') return { contentId: null, sectionId: null, type: 'home', title: 'الرئيسية' };
  if (norm === '/search') return { contentId: null, sectionId: null, type: 'search', title: 'البحث' };

  const seg = norm.split('/').filter(Boolean);

  if (seg[0] === 's' && seg.length === 2) {
    const s = await prisma.section.findUnique({ where: { slug: seg[1] } });
    return { contentId: null, sectionId: s?.id ?? null, type: 'section', title: s?.name ?? seg[1] };
  }
  if (seg[0] === 's' && seg.length === 3) {
    const sub = await prisma.subsection.findUnique({ where: { slug: seg[2] }, include: { section: true } });
    return {
      contentId: null,
      sectionId: sub?.sectionId ?? null,
      type: 'subsection',
      title: sub ? `${sub.section?.name ?? ''} / ${sub.name}` : seg[2],
    };
  }

  const typeMap: Record<string, string> = { articles: 'article', guides: 'guide', tools: 'tool', pages: 'page' };
  const type = typeMap[seg[0]];
  if (type && seg[1]) {
    const item = await prisma.contentItem.findUnique({
      where: { slug: seg[1] },
      include: { section: true },
    });
    return {
      contentId: item?.id ?? null,
      sectionId: item?.sectionId ?? null,
      type: 'content',
      title: item?.title ?? seg[1],
    };
  }

  return { contentId: null, sectionId: null, type: 'other', title: norm };
}

export async function resolvePath(path: string): Promise<PathInfo> {
  const cached = cache.get(path);
  if (cached && Date.now() - cached.at < TTL) return cached.info;
  const info = await lookup(path);
  cache.set(path, { at: Date.now(), info });
  return info;
}

export async function recordView(data: {
  path: string;
  referrer: string | null;
  userAgent: string | null;
  device: string | null;
  browser: string | null;
  sessionId: string | null;
}) {
  const info = await resolvePath(data.path);
  await prisma.pageView.create({
    data: {
      path: data.path,
      referrer: data.referrer,
      userAgent: data.userAgent,
      device: data.device,
      browser: data.browser,
      sessionId: data.sessionId,
      contentId: info.contentId,
      sectionId: info.sectionId,
      type: info.type,
    },
  });
  if (info.contentId) {
    await prisma.contentItem
      .update({ where: { id: info.contentId }, data: { views: { increment: 1 } } })
      .catch(() => {});
  }
}
