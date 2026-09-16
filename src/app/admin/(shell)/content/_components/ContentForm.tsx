'use client';

import { useMemo, useRef, useState } from 'react';
import { createContent, updateContent } from '@/actions/content';
import { slugify } from '@/lib/utils';
import Markdown from '@/components/Markdown';
import ImageUploader from './ImageUploader';

export interface SectionOption {
  id: number;
  name: string;
  icon: string;
  subsections: Array<{ id: number; name: string; slug: string; type: string }>;
}

export interface ToolOption {
  key: string;
  name: string;
  icon: string;
}

export interface ItemInitial {
  id?: number;
  type: string;
  title: string;
  slug: string;
  sectionId: number;
  subsectionId: number;
  excerpt: string;
  body: string;
  toolKey: string;
  metaTitle: string;
  metaDescription: string;
  featuredImage: string;
  tags: string;
  status: string;
  publishedAt: string; // datetime-local value or ''
  order: number;
  views: number;
}

const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30';
const labelCls = 'mb-1.5 block text-xs font-bold text-slate-600';

function toLocalInputValue(d?: string | Date | null): string {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export default function ContentForm({
  initial,
  sections,
  tools,
}: {
  initial: ItemInitial;
  sections: SectionOption[];
  tools: ToolOption[];
}) {
  const isEdit = !!initial.id;
  const [sectionId, setSectionId] = useState(initial.sectionId || sections[0]?.id || 0);
  const [featuredImage, setFeaturedImage] = useState(initial.featuredImage || '');
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const bodyImgRef = useRef<HTMLInputElement>(null);
  const [bodyImgBusy, setBodyImgBusy] = useState(false);
  const [bodyImgError, setBodyImgError] = useState('');
  const subsections = useMemo(() => sections.find((s) => s.id === sectionId)?.subsections ?? [], [sections, sectionId]);

  async function insertBodyImage(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      setBodyImgError('حجم الصورة يتجاوز 8MB');
      return;
    }
    setBodyImgBusy(true);
    setBodyImgError('');
    try {
      const fd = new FormData();
      fd.append('file', f);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const j = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !j.url) throw new Error(j.error || `فشل الرفع (${res.status})`);
      const ta = bodyRef.current;
      const md = `\n![صورة](${j.url})\n`;
      if (!ta) {
        window.alert('أدخل النص أولاً ثم أعد رفع الصورة');
        return;
      }
      const start = ta.selectionStart ?? ta.value.length;
      const end = ta.selectionEnd ?? start;
      ta.value = ta.value.slice(0, start) + md + ta.value.slice(end);
      const pos = start + md.length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    } catch (e) {
      setBodyImgError(e instanceof Error ? e.message : 'فشل الرفع');
    } finally {
      setBodyImgBusy(false);
      if (bodyImgRef.current) bodyImgRef.current.value = '';
    }
  }

  return (
    <form
      action={isEdit ? updateContent : createContent}
      className="space-y-5"
      onSubmit={(e) => {
        const fd = new FormData(e.currentTarget);
        if (!String(fd.get('title'))?.trim()) {
          e.preventDefault();
          window.alert('العنوان مطلوب');
          return;
        }
      }}
    >
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-extrabold text-slate-900">المحتوى الأساسي</h2>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelCls}>نوع المحتوى *</span>
                  <select name="type" defaultValue={initial.type} className={inputCls}>
                    <option value="article">مقال</option>
                    <option value="guide">دليل</option>
                    <option value="tool">أداة تفاعلية</option>
                    <option value="page">صفحة ثابتة</option>
                  </select>
                </label>
                <label className="block">
                  <span className={labelCls}>ترتيب العرض (الأصغر أولاً)</span>
                  <input type="number" name="order" defaultValue={initial.order} className={inputCls} />
                </label>
              </div>

              <label className="block">
                <span className={labelCls}>العنوان *</span>
                <input name="title" defaultValue={initial.title} required className={inputCls} placeholder="مثال: محول التاريخ الهجري والميلادي" />
              </label>

              <div className="flex flex-wrap items-end gap-3">
                <label className="block min-w-[220px] flex-1">
                  <span className={labelCls}>
                    الرابط (Slug) — إن تركته فارغاً سيُولَّد تلقائياً من العنوان
                  </span>
                  <input name="slug" defaultValue={initial.slug} dir="ltr" className={inputCls + ' text-left'} placeholder="my-post-slug" />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const titleEl = document.querySelector<HTMLInputElement>('input[name="title"]');
                    const slugEl = document.querySelector<HTMLInputElement>('input[name="slug"]');
                    if (titleEl && slugEl) slugEl.value = slugify(titleEl.value);
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  توليد من العنوان
                </button>
              </div>

              <label className="block">
                <span className={labelCls}>المقطع التعريفي (يظهر في البطاقات ونتائج البحث)</span>
                <textarea name="excerpt" defaultValue={initial.excerpt} rows={2} className={inputCls} />
              </label>

              {initial.type === 'tool' && (
                <label className="block">
                  <span className={labelCls}>اختر الأداة (البرمجة جاهزة مسبقاً)</span>
                  <select name="toolKey" defaultValue={initial.toolKey} required className={inputCls}>
                    <option value="">— اختر —</option>
                    {tools.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.icon} {t.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div>
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <span className={labelCls + ' mb-0'}>المحتوى (يدعم Markdown — عناوين، جداول، قوائم، صور، وروابط داخلية مثل /tools/hijri-gregorian)</span>
                  <div className="flex items-center gap-2">
                    {bodyImgError && <span className="text-[11px] font-bold text-rose-600">{bodyImgError}</span>}
                    <input ref={bodyImgRef} type="file" accept="image/*" className="hidden" onChange={(e) => insertBodyImage(e.target.files)} />
                    <button
                      type="button"
                      disabled={bodyImgBusy}
                      onClick={() => bodyImgRef.current?.click()}
                      className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-[11px] font-extrabold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                    >
                      {bodyImgBusy ? 'جارٍ الرفع…' : '⬆️ إدراج صورة من جهازك'}
                    </button>
                  </div>
                </div>
                <textarea ref={bodyRef} name="body" defaultValue={initial.body} rows={16} dir="auto" className={inputCls + ' font-mono text-xs leading-6'} />
                <p className="mt-1 text-[10px] font-semibold text-slate-400">
                  الزر يرفع الصورة ثم يدرج كودها <span dir="ltr">![صورة](رابط)</span> عند موضع المؤشر داخل النص
                </p>
              </div>
              <BodyPreview body={initial.body} />
            </div>
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-extrabold text-slate-900">التصنيف والنشر</h2>
            <div className="space-y-4">
              <label className="block">
                <span className={labelCls}>القسم الرئيسي (النيتش) *</span>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(+e.target.value)}
                  className={inputCls}
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.name}
                    </option>
                  ))}
                </select>
                <input type="hidden" name="sectionId" defaultValue={sectionId} />
              </label>
              <label className="block">
                <span className={labelCls}>القسم الفرعي *</span>
                <select name="subsectionId" defaultValue={initial.subsectionId} required className={inputCls}>
                  <option value="">— اختر —</option>
                  {subsections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelCls}>الحالة</span>
                <select name="status" defaultValue={initial.status} className={inputCls}>
                  <option value="draft">مسودة (غير ظاهر للزوار)</option>
                  <option value="published">منشور</option>
                </select>
              </label>
              <label className="block">
                <span className={labelCls}>تاريخ النشر</span>
                <input type="datetime-local" name="publishedAt" defaultValue={toLocalInputValue(initial.publishedAt)} className={inputCls} />
              </label>
              <label className="block">
                <span className={labelCls}>وسوم (مفصولة بفواصل)</span>
                <input name="tags" defaultValue={initial.tags} className={inputCls} placeholder="تقويم, هجري, أدوات" />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-extrabold text-slate-900">SEO — تحسين محركات البحث</h2>
            <div className="space-y-4">
              <label className="block">
                <span className={labelCls}>عنوان SEO (يظهر في جوجل)</span>
                <input name="metaTitle" defaultValue={initial.metaTitle} className={inputCls} />
              </label>
              <label className="block">
                <span className={labelCls}>وصف SEO (150 حرفاً مثالياً)</span>
                <textarea name="metaDescription" defaultValue={initial.metaDescription} rows={3} className={inputCls} />
              </label>
              <div>
                <span className={labelCls}>رابط صورة مميزة (اختياري)</span>
                <input
                  name="featuredImage"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  dir="ltr"
                  className={inputCls + ' text-left'}
                  placeholder="https://..."
                />
                <div className="mt-2">
                  <ImageUploader value={featuredImage} onChange={setFeaturedImage} />
                </div>
              </div>
            </div>
          </div>

          {isEdit && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-center">
              <div className="text-2xl font-extrabold text-indigo-700">{initial.views.toLocaleString('en')}</div>
              <div className="mt-1 text-[11px] font-bold text-indigo-400">إجمالي الزيارات حتى الآن</div>
            </div>
          )}

          <div className="flex gap-3">
            <button type="submit" className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-700">
              {isEdit ? 'حفظ التعديلات' : 'نشر المحتوى'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function BodyPreview({ body }: { body: string }) {
  const [open, setOpen] = useState(false);
  if (!body?.trim()) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2.5 text-right text-xs font-bold text-slate-500 hover:text-indigo-700"
      >
        {open ? 'إغلاق المعاينة ▲' : 'معاينة المحتوى (Markdown) ▼'}
      </button>
      {open && (
        <div className="border-t border-slate-200 p-5">
          <Markdown>{body}</Markdown>
        </div>
      )}
    </div>
  );
}
