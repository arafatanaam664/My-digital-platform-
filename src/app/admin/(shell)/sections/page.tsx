import { prisma } from '@/lib/db';
import ConfirmDelete from '../_components/ConfirmDelete';
import {
  createSection,
  createSubsection,
  deleteSection,
  deleteSubsection,
  updateSection,
  updateSubsection,
} from '@/actions/sections';

export const dynamic = 'force-dynamic';

const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30';
const labelCls = 'mb-1.5 block text-xs font-bold text-slate-600';

export default async function SectionsPage() {
  const sections = await prisma.section.findMany({
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
    include: {
      subsections: { orderBy: [{ order: 'asc' }, { id: 'asc' }] },
      items: { select: { id: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">إدارة الأقسام</h1>
        <p className="mt-1 text-xs leading-6 text-slate-500">
          كل نيتش = <b>قسم رئيسي</b>، بداخله <b>أقسام فرعية</b> (مقالات / أدلة / أدوات / ما تشاء). عند دخول نيتش جديد أنشئ قسماً رئيسياً جديداً وأضف
          أقسامه الفرعية — الموقع والربط الداخلي يتحدثان تلقائياً.
        </p>
      </div>

      {/* Add section */}
      <form action={createSection} className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5">
        <h2 className="mb-4 text-sm font-extrabold text-slate-900">+ قسم رئيسي جديد (نيتش)</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <label className="block lg:col-span-2">
            <span className={labelCls}>الاسم *</span>
            <input name="name" required className={inputCls} placeholder="مثال: التقويم والمواعيد" />
          </label>
          <label className="block">
            <span className={labelCls}>Slug (إنجليزي)</span>
            <input name="slug" dir="ltr" className={inputCls + ' text-left'} placeholder="calendar" />
          </label>
          <label className="block">
            <span className={labelCls}>أيقونة (Emoji)</span>
            <input name="icon" className={inputCls} placeholder="🗓️" />
          </label>
          <label className="block">
            <span className={labelCls}>الترتيب</span>
            <input name="order" type="number" defaultValue={0} className={inputCls} />
          </label>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 accent-indigo-600" /> نشط (ظاهر للزوار)
            </label>
          </div>
        </div>
        <label className="mt-4 block">
          <span className={labelCls}>وصف القسم</span>
          <textarea name="description" rows={2} className={inputCls} />
        </label>
        <button className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-indigo-700">إنشاء القسم</button>
      </form>

      {/* Sections list */}
      <div className="space-y-5">
        {sections.map((sec) => (
          <div key={sec.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-xl shadow-sm">{sec.icon}</span>
                <div>
                  <div className="text-sm font-extrabold text-slate-900">
                    {sec.name}{' '}
                    <span className="text-[10px] font-semibold text-slate-400" dir="ltr">
                      /s/{sec.slug}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {(sec.subsections?.length ?? 0)} قسم فرعي · {(sec.items?.length ?? 0)} عنصر محتوى {sec.isActive ? '' : '· ⚠️ غير نشط'}
                  </div>
                </div>
              </div>
              <a href={`/s/${sec.slug}`} target="_blank" className="rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-indigo-600 shadow-sm hover:bg-indigo-50">
                عرض القسم ↗
              </a>
            </div>

            <div className="space-y-5 p-5">
              {/* Edit section */}
              <form action={updateSection} className="grid gap-4 rounded-xl border border-slate-100 bg-slate-50/40 p-4 sm:grid-cols-2 lg:grid-cols-6">
                <input type="hidden" name="id" value={sec.id} />
                <label className="block lg:col-span-2">
                  <span className={labelCls}>الاسم</span>
                  <input name="name" defaultValue={sec.name} required className={inputCls} />
                </label>
                <label className="block">
                  <span className={labelCls}>Slug</span>
                  <input name="slug" dir="ltr" defaultValue={sec.slug} className={inputCls + ' text-left'} />
                </label>
                <label className="block">
                  <span className={labelCls}>أيقونة</span>
                  <input name="icon" defaultValue={sec.icon} className={inputCls} />
                </label>
                <label className="block">
                  <span className={labelCls}>الترتيب</span>
                  <input name="order" type="number" defaultValue={sec.order} className={inputCls} />
                </label>
                <div className="flex items-end justify-between gap-3">
                  <label className="flex items-center gap-2 pb-2 text-xs font-bold text-slate-600">
                    <input type="checkbox" name="isActive" defaultChecked={sec.isActive} className="h-4 w-4 accent-indigo-600" /> نشط
                  </label>
                  <div className="flex gap-2">
                    <button className="rounded-lg bg-slate-800 px-3 py-2 text-[11px] font-bold text-white hover:bg-slate-700">حفظ</button>
                    <ConfirmDelete action={deleteSection.bind(null, sec.id)} confirmText={`حذف قسم «${sec.name}»؟ (يُرفض إن كان يحتوي محتوى)`} />
                  </div>
                </div>
              </form>

              {/* Subsections */}
              <div>
                <h3 className="mb-3 text-xs font-extrabold text-slate-500">الأقسام الفرعية</h3>
                <div className="space-y-3">
                  {(sec.subsections ?? []).map((sub) => (
                    <form key={sub.id} action={updateSubsection} className="grid gap-3 rounded-xl border border-slate-100 p-3 sm:grid-cols-2 lg:grid-cols-6">
                      <input type="hidden" name="id" value={sub.id} />
                      <label className="block lg:col-span-2">
                        <span className={labelCls}>الاسم</span>
                        <input name="name" defaultValue={sub.name} required className={inputCls} />
                      </label>
                      <label className="block">
                        <span className={labelCls}>Slug</span>
                        <input name="slug" dir="ltr" defaultValue={sub.slug} className={inputCls + ' text-left'} />
                      </label>
                      <label className="block">
                        <span className={labelCls}>النوع (للتصنيف)</span>
                        <select name="type" defaultValue={sub.type} className={inputCls}>
                          <option value="articles">مقالات</option>
                          <option value="guides">أدلة</option>
                          <option value="tools">أدوات</option>
                          <option value="pages">صفحات</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className={labelCls}>الترتيب</span>
                        <input name="order" type="number" defaultValue={sub.order} className={inputCls} />
                      </label>
                      <div className="flex items-end justify-between gap-2">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                          <input type="checkbox" name="isActive" defaultChecked={sub.isActive} className="h-4 w-4 accent-indigo-600" /> نشط
                        </label>
                        <div className="flex gap-1.5">
                          <button className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-slate-700">حفظ</button>
                          <ConfirmDelete action={deleteSubsection.bind(null, sub.id)} confirmText={`حذف «${sub.name}»؟ (يُرفض إن كان يحتوي محتوى)`} />
                        </div>
                      </div>
                      <div className="lg:col-span-6 -mt-1">
                        <input type="hidden" name="description" defaultValue={sub.description || ''} />
                      </div>
                    </form>
                  ))}

                  {/* Add subsection */}
                  <form action={createSubsection} className="grid gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-2 lg:grid-cols-6">
                    <input type="hidden" name="sectionId" value={sec.id} />
                    <label className="block lg:col-span-2">
                      <span className={labelCls}>+ قسم فرعي جديد (اسمه)</span>
                      <input name="name" required className={inputCls} placeholder="مثال: أدلة وخطوات" />
                    </label>
                    <label className="block">
                      <span className={labelCls}>Slug</span>
                      <input name="slug" dir="ltr" className={inputCls + ' text-left'} placeholder="guides" />
                    </label>
                    <label className="block">
                      <span className={labelCls}>النوع</span>
                      <select name="type" defaultValue="articles" className={inputCls}>
                        <option value="articles">مقالات</option>
                        <option value="guides">أدلة</option>
                        <option value="tools">أدوات</option>
                        <option value="pages">صفحات</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className={labelCls}>الترتيب</span>
                      <input name="order" type="number" defaultValue={0} className={inputCls} />
                    </label>
                    <div className="flex items-end justify-between gap-2">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                        <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 accent-indigo-600" /> نشط
                      </label>
                      <button className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-indigo-700">إضافة</button>
                    </div>
                    <div className="lg:col-span-6 -mt-1">
                      <input type="hidden" name="description" defaultValue="" />
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ))}
        {sections.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-400">
            لا توجد أقسام بعد — أنشئ قسمك الأول (نيتشك الأول) من النموذج بالأعلى
          </div>
        )}
      </div>
    </div>
  );
}
