'use client';

import { useEffect, useMemo, useState } from 'react';
import { Field, ResultBox, Stat, ToolPanel, inputCls } from './ui';
import { hijriNameArabic, weekdayArabic } from './hijri';

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Countdown() {
  const [target, setTarget] = useState(todayISO());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const result = useMemo(() => {
    if (!target) return null;
    const t = new Date(`${target}T00:00:00`);
    if (isNaN(t.getTime())) return null;
    const d = t.getTime() - now;
    const abs = Math.abs(d);
    const days = Math.floor(abs / 86_400_000);
    const weeks = Math.floor(days / 7);
    const hours = Math.floor((abs % 86_400_000) / 3_600_000);
    const mins = Math.floor((abs % 3_600_000) / 60_000);
    return { d, days, weeks, hours, mins, t, past: d < 0 };
  }, [target, now]);

  return (
    <ToolPanel title="عدّاد تنازلي" desc="أدخل أي تاريخ (يوم ميلاد، امتحان، عيد، موعد سفر...) لمعرفة الوقت المتبقي">
      <div className="space-y-4">
        <Field label="التاريخ المستهدف">
          <input type="date" className={inputCls} value={target} onChange={(e) => setTarget(e.target.value)} />
        </Field>
        {result && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="أيام" value={result.days} accent />
              <Stat label="أسابيع" value={result.weeks} />
              <Stat label="ساعات" value={result.hours} />
              <Stat label="دقائق" value={result.mins} />
            </div>
            <ResultBox>
              {result.past ? 'انقضى هذا الموعد منذ ' : 'يتبقى '}
              <b>{result.days} يوماً</b> ({result.weeks} أسبوعاً)
              {!result.past && <span> — يُحدَّث تلقائياً كل 30 ثانية</span>}
              <div className="mt-1 text-xs text-slate-500">
                الموعد: يوم {weekdayArabic(result.t)} — {hijriNameArabic(result.t)} هـ
              </div>
            </ResultBox>
          </>
        )}
      </div>
    </ToolPanel>
  );
}
