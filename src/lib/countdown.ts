import type { Holiday } from '@/data/countdown/types';
import { gregToHijri, type HijriParts } from '@/tools/hijri';

/** تاريخ ميلادي ثابت — هذا العام أو القادم */
export function nextFixed(month: number, day: number, now = new Date()): Date {
  const y = now.getFullYear();
  let d = new Date(y, month - 1, day, 0, 0, 0, 0);
  if (d.getTime() < now.getTime()) d = new Date(y + 1, month - 1, day, 0, 0, 0, 0);
  return d;
}

/** تاريخ هجري (أم القرى) — المسح حتى 400 يوم (السنة الهجرية 354-355 يوماً) */
export function nextHijri(hijriMonth: number, hijriDay: number, now = new Date()): Date | null {
  for (let i = 0; i < 400; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, 0, 0, 0, 0);
    const h = gregToHijri(d);
    if (h.m === hijriMonth && h.d === hijriDay) return d;
  }
  return null;
}

/**
 * شم النسيم: مناسبة متحركة — دائماً يوم ثلاثاء، وتقع قبل عيد القيامة القبطي (الأرثوذكسي) بخمسة أيام.
 * جدول التواريخ الميلادية للفترة 2025-2045 (مواعيد عيد القيامة الأرثوذكسي موثقة من
 * timeanddate.com وqppstudio.net وmonthlycalendar.net).
 */
const SHAM_NASIM_DATES: Record<number, [number, number]> = {
  2025: [4, 15],
  2026: [4, 7],
  2027: [4, 27],
  2028: [4, 11],
  2029: [4, 3],
  2030: [4, 23],
  2031: [4, 8],
  2032: [4, 27],
  2033: [4, 19],
  2034: [4, 4],
  2035: [4, 24],
  2036: [4, 15],
  2037: [3, 31],
  2038: [4, 20],
  2039: [4, 12],
  2040: [5, 1],
  2041: [4, 16],
  2042: [4, 8],
  2043: [4, 28],
  2044: [4, 19],
  2045: [4, 4],
};

export function nextShamNasim(now = new Date()): Date | null {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const n0 = startOfDay(now).getTime();
  for (let y = now.getFullYear(); y <= 2045; y++) {
    const md = SHAM_NASIM_DATES[y];
    if (!md) continue;
    const d = new Date(y, md[0] - 1, md[1], 0, 0, 0, 0);
    if (d.getTime() >= n0) return d;
  }
  return null;
}

export interface ResolvedHoliday {
  date: Date | null;
  hijri: HijriParts | null;
}

/** يحلّل تاريخ المناسبة القادمة حسب نوعها */
export function resolveHoliday(h: Holiday, now = new Date()): ResolvedHoliday {
  let date: Date | null = null;
  if (h.dateType === 'fixed' && h.month && h.day) date = nextFixed(h.month, h.day, now);
  else if (h.dateType === 'hijri' && h.hijriMonth && h.hijriDay) date = nextHijri(h.hijriMonth, h.hijriDay, now);
  else if (h.dateType === 'sham-nasim') date = nextShamNasim(now);
  const hijri = date ? gregToHijri(date) : null;
  return { date, hijri };
}

const gregFull = new Intl.DateTimeFormat('ar-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const gregShort = new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });
const weekdayFmt = new Intl.DateTimeFormat('ar', { weekday: 'long' });

export function formatDateFull(d: Date): string {
  return gregFull.format(d);
}
export function formatDateShort(d: Date): string {
  return gregShort.format(d);
}
export function weekdayOf(d: Date): string {
  return weekdayFmt.format(d);
}

export function daysBetween(now: Date, target: Date): number {
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const b = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
