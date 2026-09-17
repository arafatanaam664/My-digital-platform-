'use client';

import { useEffect, useState } from 'react';

interface Parts {
  d: number;
  h: number;
  m: number;
  s: number;
}

function compute(targetIso: string): Parts | null {
  const target = new Date(targetIso).getTime();
  if (Number.isNaN(target)) return null;
  let diff = Math.max(0, target - Date.now());
  const d = Math.floor(diff / 86_400_000);
  diff -= d * 86_400_000;
  const h = Math.floor(diff / 3_600_000);
  diff -= h * 3_600_000;
  const m = Math.floor(diff / 60_000);
  diff -= m * 60_000;
  const s = Math.floor(diff / 1_000);
  return { d, h, m, s };
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * عدّاد تنازلي مباشر (يحدّث كل ثانية) حتى تاريخ مستهدف محلول مسبقاً.
 * يعرض قيمة محايدة عند أول رسم (SSR/تضمين) لتفادي اختلاف الإحداثة، ثم يبدأ التحديث على المتصفح.
 */
export default function CountdownTimer({ targetIso }: { targetIso: string }) {
  const [parts, setParts] = useState<Parts | null>(null);

  useEffect(() => {
    const tick = () => setParts(compute(targetIso));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  const cells = [
    { label: 'يوم', value: parts?.d ?? null },
    { label: 'ساعة', value: parts?.h ?? null },
    { label: 'دقيقة', value: parts?.m ?? null },
    { label: 'ثانية', value: parts?.s ?? null },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4" role="timer" aria-label="العد التنازلي حتى المناسبة">
      {cells.map((c) => (
        <div key={c.label} className="card flex flex-col items-center gap-1.5 px-1 py-4 sm:py-6">
          <span dir="ltr" className="text-3xl font-black tabular-nums tracking-tight text-indigo-700 sm:text-5xl">
            {c.value === null ? '—' : pad(c.value)}
          </span>
          <span className="text-[11px] font-bold text-slate-400 sm:text-xs">{c.label}</span>
        </div>
      ))}
    </div>
  );
}
