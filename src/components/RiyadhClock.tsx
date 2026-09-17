'use client';

import { useEffect, useState } from 'react';

const timeFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Riyadh',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const dateFmt = new Intl.DateTimeFormat('ar', {
  timeZone: 'Asia/Riyadh',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** ساعة حية بتوقيت الرياض (UTC+3) — تعمل في متصفح الزائر بغض النظر عن موقعه. */
export default function RiyadhClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5" dir="ltr">
      <div className="flex items-baseline justify-center gap-2">
        <span className="font-mono text-4xl font-extrabold tabular-nums tracking-tight text-slate-900 sm:text-5xl">
          {now ? timeFmt.format(now) : '—:—:—'}
        </span>
        <span className="text-xs font-bold text-slate-400">+03:00</span>
      </div>
      <div className="mt-2 text-center text-sm font-bold text-indigo-700" dir="rtl">
        {now ? dateFmt.format(now) : ''}
      </div>
      <div className="mt-1 text-center text-[11px] text-slate-400" dir="rtl">
        توقيت مدينة الرياض (UTC+3) — لا يتأثر بموقعك الجغرافي
      </div>
    </div>
  );
}
