'use client';

import { useMemo, useState } from 'react';
import { Field, ResultBox, Stat, ToolPanel, inputCls } from './ui';
import { gregorianNameArabic, weekdayArabic } from './hijri';

export default function AgeCalculator() {
  const [birth, setBirth] = useState('');

  const r = useMemo(() => {
    if (!birth) return null;
    const b = new Date(`${birth}T00:00:00`);
    if (isNaN(b.getTime())) return null;
    const now = new Date();
    let years = now.getFullYear() - b.getFullYear();
    let months = now.getMonth() - b.getMonth();
    let days = now.getDate() - b.getDate();
    if (days < 0) {
      months -= 1;
      days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    const totalDays = Math.floor((now.getTime() - b.getTime()) / 86_400_000);
    const totalYears = Math.floor(totalDays / 365.25);

    // next birthday
    let nb = new Date(now.getFullYear(), b.getMonth(), b.getDate());
    if (nb < now) nb = new Date(now.getFullYear() + 1, b.getMonth(), b.getDate());
    const daysToBirthday = Math.ceil((nb.getTime() - now.getTime()) / 86_400_000);

    return { years, months, days, totalDays, totalYears, daysToBirthday, b, nb };
  }, [birth]);

  return (
    <ToolPanel title="حاسبة العمر" desc="أدخل تاريخ ميلادك واحصل على عمرك بدقة بالأيام">
      <div className="space-y-4">
        <Field label="تاريخ الميلاد">
          <input type="date" className={inputCls} value={birth} onChange={(e) => setBirth(e.target.value)} max="2026-12-31" min="1900-01-01" />
        </Field>
        {r && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="سنوات" value={r.years} accent />
              <Stat label="شهور" value={r.months} />
              <Stat label="أيام" value={r.days} />
              <Stat label="إجمالي الأيام" value={r.totalDays.toLocaleString('en')} />
            </div>
            <ResultBox>
              عمرك الكامل: <b>{r.years} سنة و{r.months} شهراً و{r.days} يوماً</b> (أي نحو {Math.floor(r.totalYears)} سنة).
              <div className="mt-1">
                🎉 عيد ميلادك القادم ({r.nb.getFullYear()}) بعد <b>{r.daysToBirthday} يوماً</b> — {gregorianNameArabic(r.nb)}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                وُلدت في يوم {weekdayArabic(r.b)} — {gregorianNameArabic(r.b)}
              </div>
            </ResultBox>
          </>
        )}
      </div>
    </ToolPanel>
  );
}
