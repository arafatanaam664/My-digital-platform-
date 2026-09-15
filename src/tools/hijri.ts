// Utilities for Hijri (Umm al-Qura) <-> Gregorian conversion using Intl.

const islamicNumeric = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
});

const arabicHijri = new Intl.DateTimeFormat('ar-u-ca-islamic-umalqura', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const arabicGregorian = new Intl.DateTimeFormat('ar-u-nu-latn', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const arabicWeekday = new Intl.DateTimeFormat('ar', { weekday: 'long' });

export interface HijriParts {
  y: number;
  m: number;
  d: number;
}

export function gregToHijri(date: Date): HijriParts {
  const parts = islamicNumeric.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value;
  return { y: parseInt(get('year') || '0', 10), m: parseInt(get('month') || '0', 10), d: parseInt(get('day') || '0', 10) };
}

export function hijriNameArabic(date: Date): string {
  return arabicHijri.format(date);
}

export function gregorianNameArabic(date: Date): string {
  return arabicGregorian.format(date);
}

export function weekdayArabic(date: Date): string {
  return arabicWeekday.format(date);
}

export const HIJRI_MONTHS = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الآخر',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
];

// Build a lookup: "YYYY-m-d" (hijri) -> "YYYY-MM-DD" (gregorian), cached once.
let hijriMapPromise: Promise<Map<string, string>> | null = null;

function buildHijriMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const start = Date.UTC(1970, 0, 1);
  const end = Date.UTC(2070, 11, 31);
  const step = 86_400_000;
  for (let t = start; t <= end; t += step) {
    const d = new Date(t);
    const h = gregToHijri(d);
    const key = `${h.y}-${h.m}-${h.d}`;
    if (!map.has(key)) map.set(key, d.toISOString().slice(0, 10));
  }
  return Promise.resolve(map);
}

export function hijriToGregorian(y: number, m: number, d: number): Promise<string | null> {
  if (!hijriMapPromise) hijriMapPromise = buildHijriMap();
  return hijriMapPromise.then((map) => map.get(`${y}-${m}-${d}`) ?? null);
}
