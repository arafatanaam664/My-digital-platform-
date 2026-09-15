import { prisma } from './db';

const DEFAULTS: Record<string, string> = {
  siteName: 'منصة الأفق',
  tagline: 'كل ما تحتاجه في مكان واحد: أدوات تفاعلية، أدلة عملية، ومحتوى مفيد',
  description:
    'منصة عربية تفاعلية تجمع الأدوات والأدلة والمقالات في أقسام منظمة، لتجيب عن أسئلتك وتوفر وقتك.',
  footerText: 'جميع الحقوق محفوظة',
  analyticsEnabled: '1',
  adsCode: '',
  gtagId: '',
  telegram: '',
  twitter: '',
  youtube: '',
};

let cache: { at: number; data: Record<string, string> } | null = null;

export async function getSettings(force = false): Promise<Record<string, string>> {
  if (!force && cache && Date.now() - cache.at < 30_000) return cache.data;
  const rows = await prisma.setting.findMany();
  const data: Record<string, string> = { ...DEFAULTS };
  for (const r of rows) if (r.value !== null) data[r.key] = r.value;
  cache = { at: Date.now(), data };
  return data;
}

export function invalidateSettings() {
  cache = null;
}

export const SETTING_KEYS = Object.keys(DEFAULTS);
