export interface Faq {
  q: string;
  a: string;
}

export interface Holiday {
  /** فريد داخل الدولة */
  slug: string;
  name: string;
  /** fixed: تاريخ ميلادي ثابت — hijri: تاريخ هجري (أم القرى) — sham-nasim: متحرك (خمسة أيام قبل عيد القيامة القبطي، دائماً يوم ثلاثاء) */
  dateType: 'fixed' | 'hijri' | 'sham-nasim';
  month?: number;
  day?: number;
  hijriMonth?: number;
  hijriDay?: number;
  /** وصف غني (Markdown) بكلمات بحثية */
  description: string;
  faq: Faq[];
}

export interface Country {
  slug: string;
  name: string;
  flag: string;
  /** ISO 3166-1 alpha-2 — للبيانات المنظمة */
  code: string;
  intro: string;
  holidays: Holiday[];
}
