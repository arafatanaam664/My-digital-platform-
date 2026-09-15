import { prisma } from '@/lib/db';
import ContentForm, { type SectionOption, type ToolOption, type ItemInitial } from '../_components/ContentForm';
import { TOOL_LIST } from '@/tools/registry';

export const dynamic = 'force-dynamic';

export default async function NewContentPage() {
  const rows = await prisma.section.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    include: { subsections: { where: { isActive: true }, orderBy: { order: 'asc' } } },
  });
  const sections: SectionOption[] = rows.map((s) => ({
    id: s.id,
    name: s.name,
    icon: s.icon,
    subsections: (s.subsections ?? []).map((x) => ({ id: x.id, name: x.name, slug: x.slug, type: x.type })),
  }));

  if (sections.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
        أنشئ قسماً رئيسياً وقسامه الفرعية أولاً من صفحة{' '}
        <a href="/admin/sections" className="font-bold text-indigo-600">
          الأقسام
        </a>
        .
      </div>
    );
  }

  const tools: ToolOption[] = TOOL_LIST;
  const first = sections[0];
  const initial: ItemInitial = {
    type: 'article',
    title: '',
    slug: '',
    sectionId: first.id,
    subsectionId: first.subsections[0]?.id ?? 0,
    excerpt: '',
    body: '',
    toolKey: '',
    metaTitle: '',
    metaDescription: '',
    featuredImage: '',
    tags: '',
    status: 'published',
    publishedAt: '',
    order: 0,
    views: 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">إضافة محتوى جديد</h1>
        <p className="mt-1 text-xs text-slate-500">
          اختر النوع، املأ البيانات، وحدد القسم الرئيسي والفرعي — وسيظهر المحتوى تلقائياً في الموقع والربط الداخلي
        </p>
      </div>
      <ContentForm initial={initial} sections={sections} tools={tools} />
    </div>
  );
}
