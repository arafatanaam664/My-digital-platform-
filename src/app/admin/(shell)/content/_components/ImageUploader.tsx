'use client';

import { useRef, useState } from 'react';

/**
 * Uploads an image to Cloudflare R2 via /api/upload and reports the public URL.
 * Falls back gracefully when R2 is not configured (local dev).
 */
export default function ImageUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onFile(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      setError('حجم الصورة يتجاوز 8MB');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', f);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const j = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !j.url) throw new Error(j.error || `فشل الرفع (${res.status})`);
      onChange(j.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل الرفع');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files)} />
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2 text-xs font-extrabold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
        >
          {busy ? 'جارٍ الرفع…' : '⬆️ رفع صورة من جهازك'}
        </button>
        {value ? (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            dir="ltr"
            className="max-w-[220px] truncate text-[11px] font-bold text-indigo-600 underline"
          >
            {value}
          </a>
        ) : null}
      </div>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="معاينة الصورة المميزة" className="max-h-44 rounded-xl border border-slate-200 object-cover" />
      ) : null}
      {error ? <p dir="auto" className="text-[11px] font-bold text-rose-600">{error}</p> : null}
    </div>
  );
}
