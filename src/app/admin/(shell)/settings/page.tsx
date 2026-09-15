import { getSettings } from '@/lib/settings';
import { saveSettings } from '@/actions/settings';

export const dynamic = 'force-dynamic';

const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30';
const labelCls = 'mb-1.5 block text-xs font-bold text-slate-600';

export default async function SettingsPage() {
  const s = await getSettings();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">إعدادات الموقع</h1>
        <p className="mt-1 text-xs text-slate-500">هذه الإعدادات تتحكم في هوية الموقع العامة وإعلاناته وتحليلاته</p>
      </div>

      <form action={saveSettings} className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-extrabold text-slate-900">هوية الموقع</h2>
          <div className="space-y-4">
            <label className="block">
              <span className={labelCls}>اسم الموقع</span>
              <input name="siteName" defaultValue={s.siteName} className={inputCls} />
            </label>
            <label className="block">
              <span className={labelCls}>الشعار النصي (Tagline) — يظهر في الرئيسية</span>
              <input name="tagline" defaultValue={s.tagline} className={inputCls} />
            </label>
            <label className="block">
              <span className={labelCls}>وصف الموقع (يظهر في الفوتر ونتائج البحث)</span>
              <textarea name="description" rows={3} defaultValue={s.description} className={inputCls} />
            </label>
            <label className="block">
              <span className={labelCls}>نص حقوق النشر في أسفل الصفحة</span>
              <input name="footerText" defaultValue={s.footerText} className={inputCls} />
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-extrabold text-slate-900">التواصل الاجتماعي (روابط اختيارية)</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className={labelCls}>قناة تليجرام</span>
              <input name="telegram" dir="ltr" defaultValue={s.telegram} className={inputCls + ' text-left'} placeholder="https://t.me/..." />
            </label>
            <label className="block">
              <span className={labelCls}>حساب إكس / تويتر</span>
              <input name="twitter" dir="ltr" defaultValue={s.twitter} className={inputCls + ' text-left'} placeholder="https://x.com/..." />
            </label>
            <label className="block">
              <span className={labelCls}>قناة يوتيوب</span>
              <input name="youtube" dir="ltr" defaultValue={s.youtube} className={inputCls + ' text-left'} placeholder="https://youtube.com/..." />
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-extrabold text-slate-900">الإعلانات والتحليلات</h2>
          <div className="space-y-4">
            <label className="block">
              <span className={labelCls}>كود AdSense (الصق الكود الكامل بعد السكربت الأول، أو الكود كاملاً)</span>
              <textarea name="adsCode" dir="ltr" rows={4} defaultValue={s.adsCode} className={inputCls + ' font-mono text-left text-xs'} placeholder={'<script ...>...</script>'} />
            </label>
            <label className="block">
              <span className={labelCls}>معرف Google Analytics (G-XXXXXX) — اختياري</span>
              <input name="gtagId" dir="ltr" defaultValue={s.gtagId} className={inputCls + ' text-left'} placeholder="G-XXXXXXXXXX" />
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <input type="checkbox" name="analyticsEnabled" defaultChecked={s.analyticsEnabled === '1'} className="h-4 w-4 accent-indigo-600" />
              تفعيل نظام التحليلات المدمج (يتتبع الزيارات اليومية وعدد زيارات كل صفحة ومقال — يُستخدم في لوحة التحكم)
            </label>
          </div>
        </div>

        <button className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-indigo-700">حفظ الإعدادات</button>
      </form>
    </div>
  );
}
