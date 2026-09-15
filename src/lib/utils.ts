// ---------- slug + transliteration ----------

const AR_MAP: Record<string, string> = {
  'ا': 'a', 'أ': 'a', 'إ': 'a', 'آ': 'aa', 'ٱ': 'a',
  'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh',
  'د': 'd', 'ذ': 'th', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
  'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh',
  'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'y', 'ء': '', 'ئ': 'y',
  'ؤ': 'w', 'ة': 'eh',
};

export function slugify(text: string): string {
  let s = (text || '').trim();
  if (/[؀-ۿ]/.test(s)) {
    s = s
      .split('')
      .map((ch) => (/[؀-ۿ]/.test(ch) ? AR_MAP[ch] ?? '' : ch))
      .join('')
      .replace(/eh/g, 'ah');
  }
  s = s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'content';
}

// ---------- user agent ----------

export function parseUA(ua: string): { device: string; browser: string } {
  let device = 'desktop';
  if (/mobile|iphone|android.*mobile|ipod/i.test(ua)) device = 'mobile';
  else if (/tablet|ipad|android(?!.*mobile)/i.test(ua)) device = 'tablet';

  let browser = 'other';
  if (/edg\//i.test(ua)) browser = 'edge';
  else if (/opr|opera/i.test(ua)) browser = 'opera';
  else if (/chrome|crios/i.test(ua)) browser = 'chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'firefox';
  else if (/safari/i.test(ua)) browser = 'safari';

  return { device, browser };
}

export const DEVICE_LABEL: Record<string, string> = {
  mobile: 'جوال',
  desktop: 'حاسوب',
  tablet: 'لوحي',
  other: 'أخرى',
};

export const BROWSER_LABEL: Record<string, string> = {
  chrome: 'Chrome',
  safari: 'Safari',
  firefox: 'Firefox',
  edge: 'Edge',
  opera: 'Opera',
  other: 'أخرى',
};

// ---------- dates & labels ----------

const dateFmt = new Intl.DateTimeFormat('ar-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  return dateFmt.format(new Date(d));
}

export function fmtDateTime(d: Date | string | null | undefined): string {
  if (!d) return '';
  return new Intl.DateTimeFormat('ar-u-nu-latn', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(d));
}

export function fmtNum(n: number): string {
  return new Intl.NumberFormat('en').format(n);
}

export const TYPE_LABEL: Record<string, string> = {
  article: 'مقال',
  guide: 'دليل',
  tool: 'أداة',
  page: 'صفحة',
};

export const TYPE_URL: Record<string, string> = {
  article: '/articles',
  guide: '/guides',
  tool: '/tools',
  page: '/pages',
};

export function itemUrl(t: { type: string; slug: string }): string {
  return `${TYPE_URL[t.type] || '/articles'}/${t.slug}`;
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
