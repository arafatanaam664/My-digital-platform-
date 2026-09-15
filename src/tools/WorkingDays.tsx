'use client';

import { useMemo, useState } from 'react';
import { Field, ResultBox, Stat, ToolPanel, inputCls } from './ui';

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function WorkingDays() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState(todayISO());
  const [weekend, setWeekend] = useState<'fr-sat' | 'sat-sun'>('fr-sat');

  const r = useMemo(() => {
    if (!from || !to) return null;
    let a = new Date(`${from}T00:00:00`);
    let b = new Date(`${to}T00:00:00`);
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
    if (a > b) [a, b] = [b, a];
    let working = 0;
    let weekendDays = 0;
    const excluded = weekend === 'fr-sat' ? [5, 6] : [0, 6];
    for (let t = a.getTime(); t <= b.getTime(); t += 86_400_000) {
      const wd = new Date(t).getDay();
      if (excluded.includes(wd)) weekendDays++;
      else working++;
    }
    const total = working + weekendDays;
    return { working, weekendDays, total, a, b };
  }, [from, to, weekend]);

  return (
    <ToolPanel title="حاسبة الأيام العملية" desc="احسب عدد أيام العمل بين تاريخين (مع خيار نهاية الأسبوعو المناسبة لدولتك)">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="من تاريخ">
            <input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="إلى تاريخ">
            <input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
        <Field label="أيام العطلة الأسبوعية">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setWeekend('fr-sat')}
              className={
                weekend === 'fr-sat'
                  ? 'flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white'
                  : 'flex-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200'
              }
            >
              الجمعة والسبت (الخليج)
            </button>
            <button
              type="button"
              onClick={() => setWeekend('sat-sun')}
              className={
                weekend === 'sat-sun'
                  ? 'flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white'
                  : 'flex-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200'
              }
            >
              السبت والأحد (أوروبا)
            </button>
          </div>
        </Field>
        {r && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="إجمالي الأيام" value={r.total.toLocaleString('en')} />
              <Stat label="أيام عمل" value={r.working.toLocaleString('en')} accent />
              <Stat label="أيام عطلة" value={r.weekendDays.toLocaleString('en')} />
            </div>
            <ResultBox>
              من <b>{r.a.toLocaleDateString('ar-u-nu-latn')}</b> إلى <b>{r.b.toLocaleDateString('ar-u-nu-latn')}</b> يوجد{' '}
              <b>{r.working.toLocaleString('en')} يوم عمل</b>.
            </ResultBox>
          </>
        )}
      </div>
    </ToolPanel>
  );
}
