import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import ContentForm, { type SectionOption, type ToolOption, type ItemInitial } from '../../_components/ContentForm';
import { TOOL_LIST } from '@/tools/registry';
import { itemUrl, TYPE_LABEL } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function toLocalInputValue(d?: Date | null): string {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export default async function EditContentPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  const item = await prisma.contentItem.findUnique({ where: { id } });
  if (!item) notFound();

  const rows = await prisma.section.findMany({
    orderBy: { order: 'asc' },
    include: { subsections: { orderBy: { order: 'asc' } } },
  });
  const sections: SectionOption[] = rows.map((s) => ({
    id: s.id,
    name: s.name,
    icon: s.icon,
    subsections: (s.subsections ?? []).map((x) => ({ id: x.id, name: x.name, slug: x.slug, type: x.type })),
  }));

  const tools: ToolOption[] = TOOL_LIST;
  const initial: ItemInitial = {
    id: item.id,
    type: item.type,
    title: item.title,
    slug: item.slug,
    sectionId: item.sectionId,
    subsectionId: item.subsectionId,
    excerpt: item.excerpt || '',
    body: item.body,
    toolKey: item.toolKey || '',
    metaTitle: item.metaTitle || '',
    metaDescription: item.metaDescription || '',
    featuredImage: item.featuredImage || '',
    tags: item.tags || '',
    status: item.status,
    publishedAt: toLocalInputValue(item.publishedAt),
    order: item.order,
    views: item.views,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            تعديل: {item.title}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {TYPE_LABEL[item.type]} · <span dir="ltr">{itemUrl(item)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/content" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
            ← رجوع للقائمة
          </Link>
          <Link href={itemUrl(item)} target="_blank" className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700">
            عرض الصفحة ↗
          </Link>
        </div>
      </div>
      <ContentForm initial={initial} sections={sections} tools={tools} />
    </div>
  );
}
