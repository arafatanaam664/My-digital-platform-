import type { Country, Holiday } from './types';
import { COUNTRIES_1 } from './countries1';
import { COUNTRIES_2 } from './countries2';

export type { Country, Holiday, Faq } from './types';

/** كل الدول المتاحة في قسم العد التنازلي */
export const COUNTRIES: Country[] = [...COUNTRIES_1, ...COUNTRIES_2];

export function getCountry(slug: string): Country | undefined {
  return COUNTRIES.find((c) => c.slug === slug);
}

export function getHoliday(country: Country, slug: string): Holiday | undefined {
  return country.holidays.find((h) => h.slug === slug);
}

export function totalHolidays(): number {
  return COUNTRIES.reduce((acc, c) => acc + c.holidays.length, 0);
}

/** رابط أساسي للموقع — للبيانات المنظمة (يُحدد عبر NEXT_PUBLIC_SITE_URL عند النشر) */
export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}
