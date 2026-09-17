'use client';

import { useMemo, useState } from 'react';
import { ToolPanel, Field, inputCls, ResultBox } from './ui';

/* ===== خرائط الأحرف اللاتينية (تُبنى برمجياً من نقاط الكود) ===== */

const A_LOWER = 0x61;
const A_UPPER = 0x41;
const ZERO = 0x30;

function rangeMap(startLower: number, startUpper: number, digits?: number): (ch: string) => string {
  return (ch: string) => {
    const c = ch.charCodeAt(0);
    if (c >= A_LOWER && c <= A_LOWER + 25) return String.fromCharCode(startLower + (c - A_LOWER));
    if (c >= A_UPPER && c <= A_UPPER + 25) return String.fromCharCode(startUpper + (c - A_UPPER));
    if (digits !== undefined && c >= ZERO && c <= ZERO + 9) return String.fromCharCode(digits + (c - ZERO));
    return ch;
  };
}

const boldMap = rangeMap(0x1d41a, 0x1d400, 0x1d7ce);
const italicMap = rangeMap(0x1d44a, 0x1d434);
const doubleStruckMap = rangeMap(0x1d5b4, 0x1d5a0);
const scriptMap = rangeMap(0x1d4ae, 0x1d49c);
const boldScriptMap = rangeMap(0x1d4e4, 0x1d4d0);
const frakturMap = rangeMap(0x1d580, 0x1d56c);
const monoMap = rangeMap(0x1d68a, 0x1d670, 0x1d7e6);
const smallCapsMap = (ch: string): string => {
  const c = ch.charCodeAt(0);
  if (c >= A_LOWER && c <= A_LOWER + 25) return String.fromCharCode(0x1d00 + (c - A_LOWER));
  return ch;
};
const fullwidthMap = (ch: string): string => {
  const c = ch.charCodeAt(0);
  if (c >= A_UPPER && c <= A_UPPER + 25) return String.fromCharCode(0xff21 + (c - A_UPPER));
  if (c >= A_LOWER && c <= A_LOWER + 25) return String.fromCharCode(0xff41 + (c - A_LOWER));
  if (c >= ZERO && c <= ZERO + 9) return String.fromCharCode(0xff10 + (c - ZERO));
  return ch;
};
const strikeMap = (ch: string): string => (ch === ' ' ? ' ' : ch + '\u0336');

const SUPER: Record<string, string> = {
  a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', d: 'ᵈ', e: 'ᵉ', f: 'ᶠ', g: 'ᵍ', h: 'ʰ', i: 'ⁱ', j: 'ʲ', k: 'ᵏ', l: 'ˡ', m: 'ᵐ',
  n: 'ⁿ', o: 'ᵒ', p: 'ᵖ', r: 'ʳ', s: 'ˢ', t: 'ᵗ', u: 'ᵘ', v: 'ᵛ', w: 'ʷ', x: 'ˣ', y: 'ʸ', z: 'ᶻ',
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
};
const SUB: Record<string, string> = {
  a: 'ₐ', e: 'ₑ', h: 'ₕ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ', l: 'ₗ', m: 'ₘ', n: 'ₙ', o: 'ₒ', p: 'ₚ', r: 'ᵣ',
  s: 'ₛ', t: 'ₜ', u: 'ᵤ', v: 'ᵥ', x: 'ₓ',
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
};
const CIRCLED: Record<string, string> = {
  a: 'Ⓐ', b: 'Ⓑ', c: 'Ⓒ', d: 'Ⓓ', e: 'Ⓔ', f: 'Ⓕ', g: 'Ⓖ', h: 'Ⓗ', i: 'Ⓘ', j: 'Ⓙ', k: 'Ⓚ', l: 'Ⓛ',
  m: 'Ⓜ', n: 'Ⓝ', o: 'Ⓞ', p: 'Ⓟ', q: 'Ⓠ', r: 'Ⓡ', s: 'Ⓢ', t: 'Ⓣ', u: 'Ⓤ', v: 'Ⓥ', w: 'Ⓦ', x: 'Ⓧ',
  y: 'Ⓨ', z: 'Ⓩ',
};

function applyMap(text: string, map: (ch: string) => string): string {
  let out = '';
  for (const ch of text) out += map(ch);
  return out;
}

/* ===== الأنماط ===== */

interface Style {
  label: string;
  transform: (t: string) => string;
}

const STYLES: Style[] = [
  { label: 'سميك (Bold)', transform: (t) => applyMap(t, boldMap) },
  { label: 'مائل (Italic)', transform: (t) => applyMap(t, italicMap) },
  { label: 'خط مزدوج', transform: (t) => applyMap(t, doubleStruckMap) },
  { label: 'خطي (Script)', transform: (t) => applyMap(t, scriptMap) },
  { label: 'خطي سميك', transform: (t) => applyMap(t, boldScriptMap) },
  { label: 'خط جرمان', transform: (t) => applyMap(t, frakturMap) },
  { label: 'أحادي المسافة (Mono)', transform: (t) => applyMap(t, monoMap) },
  { label: 'أحرف صغيرة', transform: (t) => applyMap(t, smallCapsMap) },
  { label: 'فوق (Superscript)', transform: (t) => applyMap(t, (c) => SUPER[c.toLowerCase()] ?? c) },
  { label: 'تحت (Subscript)', transform: (t) => applyMap(t, (c) => SUB[c.toLowerCase()] ?? c) },
  { label: 'بدائرة (Circled)', transform: (t) => applyMap(t, (c) => CIRCLED[c.toLowerCase()] ?? c) },
  { label: 'مسطّر', transform: (t) => applyMap(t, strikeMap) },
  { label: 'عرض مضاعف', transform: (t) => applyMap(t, fullwidthMap) },
];

const WRAPPERS: Style[] = [
  { label: 'جناحي فاخر', transform: (t) => `꧁ ༒${t}༒ ꧂` },
  { label: 'نجمة متلألئة', transform: (t) => `✦ ${t} ✦` },
  { label: 'برق', transform: (t) => `⚡ ${t} ⚡` },
  { label: 'سيوف', transform: (t) => `⚔️ ${t} ⚔️` },
  { label: 'تاج ملكي', transform: (t) => `👑 ${t} 👑` },
  { label: 'لمعات', transform: (t) => `✨ ${t} ✨` },
  { label: 'نجوم', transform: (t) => `🌟 ${t} 🌟` },
  { label: 'أزهار', transform: (t) => `❀ ${t} ❀` },
];

export default function NameDecoration() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const all = useMemo(() => {
    if (!text.trim()) return [];
    const t = text.trim();
    return [
      ...STYLES.map((s) => ({ ...s, output: s.transform(t) })),
      ...WRAPPERS.map((s) => ({ ...s, output: s.transform(t) })),
    ];
  }, [text]);

  async function copy(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
  }

  return (
    <ToolPanel
      title="مُزيّن الأسماء"
      desc="حوّل اسمك إلى صيغ زخرفية بأحرف يونيكود — عريض، مائل، خطي، فوق، تحت، ومزخرف بالرموز (جناح، تاج، سيوف، برق) — يناسب أسماء الألعاب والمجتمعات."
    >
      <Field label="اكتب الاسم">
        <input
          className={inputCls}
          dir="auto"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="مثال: Ahmed — أحمد"
          maxLength={40}
        />
      </Field>

      {all.length > 0 && (
        <div className="mt-4 space-y-2">
          {all.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-slate-400">{s.label}</div>
                <div className="mt-0.5 truncate text-base font-semibold text-slate-800" dir="auto">
                  {s.output}
                </div>
              </div>
              <button
                type="button"
                onClick={() => copy(s.label, s.output)}
                className={
                  'shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ' +
                  (copied === s.label
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700')
                }
              >
                {copied === s.label ? '✓ نُسِخ' : 'نسخ'}
              </button>
            </div>
          ))}
        </div>
      )}

      {text.trim() && (
        <ResultBox className="mt-4">
          النص الأصلي بعد الزينة يعمل في معظم تطبيقات الألعاب والشبكات الاجتماعية. بعض المنصات قد
          تُبطل رموزاً معينة، لذا جرّب الصيغة قبل اعتمادها نهائياً.
        </ResultBox>
      )}
    </ToolPanel>
  );
}
