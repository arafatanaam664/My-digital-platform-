'use client';

import { useMemo, useState } from 'react';
import { Field, ResultBox, ToolPanel, btnCls, inputCls, selectCls } from './ui';
import { gregToHijri, hijriNameArabic, hijriToGregorian, HIJRI_MONTHS, gregorianNameArabic, weekdayArabic } from './hijri';

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function HijriConverter() {
  const [tab, setTab] = useState<'g2h' | 'h2g'>('g2h');
  const [gDate, setGDate] = useState(todayISO());
  const [hY, setHY] = useState(1448);
  const [hM, setHM] = useState(1);
  const [hD, setHD] = useState(1);
  const [hResult, setHResult] = useState<string | null>(null);
  const [hError, setHError] = useState('');

  const g2h = useMemo(() => {
    if (!gDate) return null;
    const d = new Date(`${gDate}T12:00:00`);
    if (isNaN(d.getTime())) return null;
    const h = gregToHijri(d);
    return {
      d,
      h,
      name: hijriNameArabic(d),
      weekday: weekdayArabic(d),
    };
  }, [gDate]);

  return (
    <ToolPanel title="محوّل التاريخ الهجري ↔ الميلادي" desc="حوّل أي تاريخ فورياً بين التقويمين (تقويم أم القرى المستخدم في السعودية)">
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab('g2h')}
          className={
            tab === 'g2h'
              ? 'rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white'
              : 'rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200'
          }
        >
          ميلادي ← هجري
        </button>
        <button
          type="button"
          onClick={() => setTab('h2g')}
          className={
            tab === 'h2g'
              ? 'rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white'
              : 'rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200'
          }
        >
          هجري ← ميلادي
        </button>
      </div>

      {tab === 'g2h' ? (
        <div className="space-y-4">
          <Field label="اختر التاريخ الميلادي">
            <input type="date" className={inputCls} value={gDate} onChange={(e) => setGDate(e.target.value)} max="2070-12-31" min="1970-01-01" />
          </Field>
          {g2h && (
            <ResultBox>
              <div className="text-base font-extrabold text-indigo-700">{g2h.name} هـ</div>
              <div className="mt-1">
                الموافق {g2h.h.d} {HIJRI_MONTHS[g2h.h.m - 1]} سنة {g2h.h.y} هـ — يوم <b>{g2h.weekday}</b>
              </div>
            </ResultBox>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Field label="السنة الهجرية">
              <select className={selectCls} value={hY} onChange={(e) => setHY(+e.target.value)}>
                {Array.from({ length: 81 }, (_, i) => 1400 + i).map((y) => (
                  <option key={y} value={y}>
                    {y} هـ
                  </option>
                ))}
              </select>
            </Field>
            <Field label="الشهر">
              <select className={selectCls} value={hM} onChange={(e) => setHM(+e.target.value)}>
                {HIJRI_MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="اليوم">
              <select className={selectCls} value={hD} onChange={(e) => setHD(+e.target.value)}>
                {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <button
            type="button"
            className={btnCls}
            onClick={async () => {
              setHError('');
              setHResult(null);
              const iso = await hijriToGregorian(hY, hM, hD);
              if (!iso) {
                setHError('هذا التاريخ غير موجود (بعض الشهور الهجرية لا تتجاوز 29 يوماً في بعض السنوات).');
                return;
              }
              const d = new Date(`${iso}T12:00:00`);
              setHResult(`${gregorianNameArabic(d)} — يوم ${weekdayArabic(d)}`);
            }}
          >
            تحويل التاريخ
          </button>
          {hResult && <ResultBox className="font-bold text-indigo-700">{hResult}</ResultBox>}
          {hError && <p className="text-xs font-medium text-rose-600">{hError}</p>}
        </div>
      )}
    </ToolPanel>
  );
}
