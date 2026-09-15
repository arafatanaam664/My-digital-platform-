/* Integration test for the data layer: CRUD + includes + groupBy + analytics.
   Run:  npx tsx scripts/test-orm.mts          → SQLite (prisma/dev.db)
         DB_TEST_PG=1 npx tsx scripts/test-orm.mts → Postgres (in-memory via pg-mem) */
import { createOrm } from '../src/lib/db';

type Prisma = ReturnType<typeof createOrm>;

let prisma: Prisma;

if (process.env.DB_TEST_PG === '1') {
  const { newDb } = await import('pg-mem');
  const fs = await import('fs');
  const path = await import('path');
  const ddl = fs.readFileSync(path.join(process.cwd(), 'prisma', 'postgres-schema.sql'), 'utf8');
  const mem = newDb();
  await mem.public.none(ddl);
  const { createPgDriver } = await import('../src/lib/drivers/pg');
  const { runSeed } = await import('./seed.mts');
  const { Pool } = mem.adapters.createPg() as unknown as { Pool: new () => object };
  prisma = createOrm(createPgDriver(new Pool() as never, { autoDdl: false }));
  await runSeed(prisma as never);
  console.log('— running against in-memory Postgres (pg-mem) —');
} else {
  prisma = (await import('../src/lib/db')).prisma;
}

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, extra?: unknown) {
  if (cond) {
    pass++;
    console.log('  ✔', name);
  } else {
    fail++;
    console.log('  ✘', name, extra ?? '');
  }
}

async function main() {
  // clean leftovers from previous runs (idempotent re-runs)
  await prisma.contentItem.deleteMany({ where: { slug: 'test-item-x1' } });
  await prisma.pageView.deleteMany({ where: { sessionId: 'test-sess-orm' } });

  console.log('— content CRUD —');
  const created = (await prisma.contentItem.create({
    data: {
      slug: 'test-item-x1',
      type: 'article',
      title: 'مقال اختبار',
      excerpt: 'excerpt',
      body: 'body',
      sectionId: 1,
      subsectionId: 1,
      status: 'draft',
      tags: 'a, b',
    },
  })) as any;
  check('create returns id', !!created.id);
  check('create defaults (views=0)', created.views === 0);

  const updated = (await prisma.contentItem.update({
    where: { id: created.id },
    data: { title: 'مقال اختبار معدّل', status: 'published', publishedAt: new Date() },
  })) as any;
  check('update title', updated?.title === 'مقال اختبار معدّل');
  check('update status', updated?.status === 'published');
  check('updatedAt is Date', updated?.updatedAt instanceof Date);

  const found = (await prisma.contentItem.findUnique({
    where: { slug: 'test-item-x1' },
    include: { section: true, subsection: true },
  })) as any;
  check('findUnique by slug', found?.id === created.id);
  check('include section', found?.section?.name === 'التقويم والمواعيد');
  check('include subsection', found?.subsection?.name === 'مقالات');

  const many = (await prisma.contentItem.findMany({
    where: { status: 'published', OR: [{ title: { contains: 'الأسبوع' } }, { title: { contains: 'الأسبوعي' } }] },
    orderBy: [{ views: 'desc' }, { publishedAt: 'desc' }],
    take: 10,
  })) as any[];
  check('findMany with OR', many.length >= 2, many.length);

  const rel = (await prisma.contentItem.findMany({
    where: { section: { isActive: true }, status: 'published' },
    take: 3,
  })) as any[];
  check('relation filter (section.isActive)', rel.length === 3 && rel.every((r) => r.status === 'published'));

  const count = await prisma.contentItem.count({ where: { status: 'published' } });
  check('count published', count >= 10, count);

  console.log('— sections includes —');
  const sec = (await prisma.section.findUnique({
    where: { slug: 'calendar' },
    include: {
      subsections: { where: { isActive: true }, orderBy: { order: 'asc' }, include: { items: { where: { status: 'published' }, take: 3 } } },
      items: { where: { status: 'published' }, orderBy: { publishedAt: 'desc' }, take: 2 },
    },
  })) as any;
  check('section found', sec?.name === 'التقويم والمواعيد');
  check('subsections loaded', Array.isArray(sec?.subsections) && sec.subsections.length === 3);
  check('subsections have items include', sec?.subsections?.every((s: any) => Array.isArray(s.items)));
  check('section items take=2 per parent', sec?.items?.length === 2);

  const sub = (await prisma.subsection.findUnique({
    where: { slug: 'calendar-tools' },
    include: { section: { include: { subsections: { where: { isActive: true } } } } },
  })) as any;
  check('nested include (subsection.section.subsections)', sub?.section?.subsections?.length === 3);

  console.log('— page views / analytics —');
  const pv = (await prisma.pageView.create({
    data: {
      path: '/admin/content',
      type: 'other',
      device: 'mobile',
      browser: 'chrome',
      sessionId: 'test-sess-orm',
      referrer: 'https://google.com',
      userAgent: 'test',
    },
  })) as any;
  check('pageView create', !!pv.id);
  const pvCount = await prisma.pageView.count({ where: { createdAt: { gte: new Date(Date.now() - 86400_000) } } });
  check('pageView count today', pvCount >= 1, pvCount);
  const grouped = await prisma.pageView.groupBy({
    by: ['path'],
    where: { createdAt: { gte: new Date(Date.now() - 86400_000) } },
    _count: { _all: true },
    orderBy: { _count: { path: 'desc' } },
    take: 5,
  });
  check('groupBy path', grouped.length >= 1 && (grouped[0] as any)._count._all >= 1);
  const raw = await prisma.$queryRaw`SELECT COUNT(*) AS c FROM page_views WHERE created_at >= ${new Date(Date.now() - 86400_000)}`;
  check('$queryRaw', Number((raw[0] as any).c) >= 1);

  console.log('— settings upsert —');
  await prisma.setting.upsert({ where: { key: 'siteName' }, update: { value: 'منصة الأفق' }, create: { key: 'siteName', value: 'منصة الأفق' } });
  const st = await prisma.setting.findUnique({ where: { key: 'siteName' } });
  check('setting upsert', st?.value === 'منصة الأفق');

  console.log('— users —');
  const u = await prisma.user.findUnique({ where: { email: 'admin@platform.local' } });
  check('admin user exists', !!u);

  console.log('— cleanup —');
  await prisma.contentItem.delete({ where: { id: created.id } });
  const after = await prisma.contentItem.findUnique({ where: { id: created.id } });
  check('delete works', after === null);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
