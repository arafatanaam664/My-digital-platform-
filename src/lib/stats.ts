import { prisma } from './db';

export interface DayPoint {
  d: string; // YYYY-MM-DD
  c: number;
}

function startOfDay(offsetDays = 0): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - offsetDays);
  return d;
}

export async function getKpis() {
  const today = startOfDay(0);
  const week = startOfDay(6);
  const month = new Date();
  month.setDate(1);
  month.setHours(0, 0, 0, 0);
  const year = new Date();
  year.setMonth(0, 1);
  year.setHours(0, 0, 0, 0);

  const [vToday, vWeek, vMonth, vYear] = await Promise.all([
    prisma.pageView.count({ where: { createdAt: { gte: today } } }),
    prisma.pageView.count({ where: { createdAt: { gte: week } } }),
    prisma.pageView.count({ where: { createdAt: { gte: month } } }),
    prisma.pageView.count({ where: { createdAt: { gte: year } } }),
  ]);

  const since30 = startOfDay(29);
  const uniq30 = (await prisma.$queryRaw`
    SELECT COUNT(DISTINCT session_id) AS c FROM page_views WHERE created_at >= ${since30} AND session_id IS NOT NULL
  `) as Array<{ c: number | string }>;

  const [itemsCount, sectionsCount, toolsCount] = await Promise.all([
    prisma.contentItem.count({ where: { status: 'published' } }),
    prisma.section.count({ where: { isActive: true } }),
    prisma.contentItem.count({ where: { status: 'published', type: 'tool' } }),
  ]);

  return {
    vToday,
    vWeek,
    vMonth,
    vYear,
    uniq30: Number(uniq30[0]?.c ?? 0),
    itemsCount,
    sectionsCount,
    toolsCount,
  };
}

export async function getDailySeries(days: number): Promise<DayPoint[]> {
  const since = startOfDay(days - 1);
  const rows = (await prisma.$queryRaw`
    SELECT date(created_at) AS d, COUNT(*) AS c FROM page_views WHERE created_at >= ${since} GROUP BY d
  `) as Array<{ d: string; c: number | string }>;
  const map = new Map<string, number>();
  for (const r of rows) map.set(String(r.d).slice(0, 10), Number(r.c));
  const out: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ d: key, c: map.get(key) ?? 0 });
  }
  return out;
}

export async function getTopPages(since: Date, take = 15) {
  return prisma.pageView.groupBy({
    by: ['path'],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
    orderBy: { _count: { path: 'desc' } },
    take,
  });
}

export async function getDeviceSplit(since: Date) {
  const rows = await prisma.pageView.groupBy({
    by: ['device'],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
  });
  const total = rows.reduce((a, r) => a + r._count._all, 0);
  return rows
    .map((r) => ({ device: r.device || 'other', count: r._count._all, pct: total ? Math.round((r._count._all / total) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);
}

export async function getBrowserSplit(since: Date) {
  const rows = await prisma.pageView.groupBy({
    by: ['browser'],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
  });
  const total = rows.reduce((a, r) => a + r._count._all, 0);
  return rows
    .map((r) => ({ browser: r.browser || 'other', count: r._count._all, pct: total ? Math.round((r._count._all / total) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);
}

export async function getSectionSplit(since: Date) {
  const rows = (await prisma.$queryRaw`
    SELECT s.name AS name, COUNT(pv.id) AS c
    FROM page_views pv
    JOIN sections s ON s.id = pv.section_id
    WHERE pv.created_at >= ${since}
    GROUP BY s.id
    ORDER BY c DESC
  `) as Array<{ name: string; c: number | string }>;
  const total = rows.reduce((a, r) => a + Number(r.c), 0);
  return rows.map((r) => ({ name: String(r.name), count: Number(r.c), pct: total ? Math.round((Number(r.c) / total) * 100) : 0 }));
}

export function sinceFromRange(range: string): Date {
  const days = range === '7' ? 7 : range === '90' ? 90 : range === '365' ? 365 : 30;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days + 1);
  return d;
}

export const RANGE_LABEL: Record<string, string> = {
  '7': 'آخر 7 أيام',
  '30': 'آخر 30 يوماً',
  '90': 'آخر 90 يوماً',
  '365': 'آخر 365 يوماً',
};
