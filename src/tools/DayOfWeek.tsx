'use client';

import { useMemo, useState } from 'react';
import { Field, ResultBox, ToolPanel, inputCls } from './ui';
import { gregToHijri, hijriNameArabic, weekdayArabic } from './hijri';

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DayOfWeek() {
  const [date, setDate] = useState(todayISO());

  const r = useMemo(() => {
    if (!date) return null;
    const d = new Date(`${date}T12:00:00`);
    if (isNaN(d.getTime())) return null;
    return { d, weekday: weekdayArabic(d), hijri: hijriNameArabic(d), h: gregToHijri(d) };
  }, [date]);

  return (
    <ToolPanel title="يوم الأسبوعو لأي تاريخ" desc="هل تحاول التذكر: ما كان يوم 15 مارس 2020؟ أدخل التاريخ واعرف فوراً">
      <div className="space-y-4">
        <Field label="اختر التاريخ">
          <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        {r && (
          <ResultBox>
            <div className="text-2xl font-extrabold text-indigo-700">{r.weekday}</div>
            <div className="mt-2 text-sm">
              {r.d.toLocaleDateString('ar-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' })} — الموافق {r.hijri} هـ
            </div>
          </ResultBox>
        )}
      </div>
    </ToolPanel>
  );
}
