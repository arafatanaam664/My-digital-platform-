import type { Metadata } from 'next';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL('http://localhost:3000'),
    title: {
      default: `${s.siteName} — ${s.tagline}`,
      template: `%s | ${s.siteName}`,
    },
    description: s.description,
    openGraph: {
      title: s.siteName,
      description: s.description,
      locale: 'ar_AR',
      type: 'website',
    },
  };
}

const TRACKER = `(function(){
  try {
    var d = document.getElementById('track-data');
    if (!d) return;
    var info = JSON.parse(d.textContent || '{}');
    var sid = 'anon';
    try {
      sid = sessionStorage.getItem('pv_sid');
      if (!sid) {
        sid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 's' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem('pv_sid', sid);
      }
    } catch (e) {}
    var payload = JSON.stringify({ path: info.path, referrer: document.referrer || '', s: sid });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/analytics', payload);
    else fetch('/api/analytics', { method: 'POST', body: payload, keepalive: true });
  } catch (e) {}
})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-white font-sans text-slate-800 antialiased">
        {children}
        {s.gtagId ? (
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${s.gtagId}`} />
        ) : null}
        {s.gtagId ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${s.gtagId}');`,
            }}
          />
        ) : null}
        {s.adsCode ? <script dangerouslySetInnerHTML={{ __html: s.adsCode }} /> : null}
        {s.analyticsEnabled === '1' ? <script dangerouslySetInnerHTML={{ __html: TRACKER }} /> : null}
      </body>
    </html>
  );
}
