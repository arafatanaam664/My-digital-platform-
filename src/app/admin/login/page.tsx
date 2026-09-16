'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [checked, setChecked] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'فشل تسجيل الدخول');
        return;
      }
      // Verify the browser actually kept the session cookie (blocked in some
      // embedded/cross-origin contexts — third-party cookie blocking).
      const chk = await fetch('/api/debug/session').then((r) => r.json().catch(() => null));
      if (chk && chk.cookie !== 'valid') {
        setBlocked(true);
        setChecked(true);
        return;
      }
      router.replace('/admin/dashboard');
    } catch {
      setError('حدث خطأ، حاول مجدداً');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-indigo-600 text-2xl text-white shadow-md">🧭</span>
          <h1 className="mt-4 text-xl font-extrabold text-slate-900">تسجيل الدخول</h1>
          <p className="mt-1 text-xs text-slate-500">لوحة تحكم المنصة</p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600">البريد الإلكتروني</span>
            <input
              type="email"
              required
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@platform.local"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-left text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600">كلمة المرور</span>
            <input
              type="password"
              required
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-left text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </label>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">{error}</p>}
          {checked && blocked && (
            <div dir="auto" className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-800">
              <p>✅ تم التحقق من كلمة المرور بنجاح، لكن متصفحك <b>منع حفظ كوكي الجلسة</b> لأن الموقع مفتوح في إطار مضمّن (حماية من كوكيز الطرف الثالث).</p>
              <p>الحل: افتح الموقع في <b>تبويب جديد</b> وسجّل الدخول هناك.</p>
              <button
                type="button"
                onClick={() => window.open(window.location.origin, '_blank')}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-extrabold text-white hover:bg-amber-700"
              >
                 فتح الموقع في تبويب جديد
              </button>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
