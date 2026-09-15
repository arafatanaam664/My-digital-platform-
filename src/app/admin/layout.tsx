import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'لوحة التحكم', robots: { index: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-100">{children}</div>;
}
