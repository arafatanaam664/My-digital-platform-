'use client';

import { useMemo, useState } from 'react';
import { Field, ToolPanel, inputCls } from './ui';
import { gregToHijri, HIJRI_MONTHS } from './hijri';

const WEEKDAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

function todayParts() {
  const d = new Date();
  return { y: d.getFullYear(), m: d.getMonth() + 1 };
}

export default function MonthCalendar() {
  const t = todayParts();
  const [year, setYear] = useState(t.y);
  const [month, setMonth] = useState(t.m);

  const grid = useMemo(() => {
    const first = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = (first.getDay() + 1) % 7; // Saturday start
    const cells: Array<{ d: Date; day: number; hijriD: number; hijriM: number } | null> = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month - 1, day, 12, 0, 0);
      const h = gregToHijri(d);
      cells.push({ d, day, hijriD: h.d, hijriM: h.m });
    }
    return cells;
  }, [year, month]);

  const today = new Date();
  const isToday = (d: Date) =>
    d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();

  return (
    <ToolPanel title="تقويم الشهر" desc="استعرض أي شهر بالتاريخين الهجري والميلادي مع أيام الأسبوعو">
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Field label="الشهر">
          <select className={inputCls} value={month} onChange={(e) => setMonth(+e.target.value)}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {HIJRI_MONTHS[m - 1] === '' ? '' : new Intl.DateTimeFormat('ar-u-nu-latn', { month: 'long' }).format(new Date(2024, m - 1, 15))}
              </option>
            ))}
          </select>
        </Field>
        <Field label="السنة">
          <select className={inputCls} value={year} onChange={(e) => setYear(+e.target.value)}>
            {Array.from({ length: 17 }, (_, i) => 2020 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[560px] rounded-xl border border-slate-200">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {WEEKDAYS.map((w) => (
              <div key={w} className="px-2 py-2 text-center text-[11px] font-bold text-slate-500">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {grid.map((c, i) =>
              c ? (
                <div
                  key={i}
                  className={
                    'min-h-[64px] border-b border-l border-slate-100 px-2 py-1.5 last:border-l-0 ' +
                    (isToday(c.d) ? 'bg-indigo-50' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40')
                  }
                >
                  <div className={'text-sm font-extrabold ' + (isToday(c.d) ? 'text-indigo-600' : 'text-slate-700')}>{c.day}</div>
                  <div className="text-[10px] text-slate-400">
                    {c.hijriD} {HIJRI_MONTHS[c.hijriM - 1]}
                  </div>
                </div>
              ) : (
                <div key={i} className="min-h-[64px] border-b border-l border-slate-100 bg-slate-50/20" />
              )
            )}
          </div>
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-5 text-slate-400">
        الأرقام الصغيرة تحت كل يوم هي التاريخ الهجري المقابل (تقويم أم القرى). الأسبوعو يبدأ يوم السبت.
      </p>
    </ToolPanel>
  );
}
