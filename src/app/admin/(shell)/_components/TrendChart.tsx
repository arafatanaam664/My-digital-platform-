'use client';

import dynamic from 'next/dynamic';

const AreaChartImpl = dynamic(() => import('./AreaChartImpl'), {
  ssr: false,
  loading: () => <div className="grid h-72 place-items-center text-xs text-slate-400">جاري تحميل المخطط...</div>,
});

export default function TrendChart({ data }: { data: Array<{ d: string; c: number }> }) {
  return <AreaChartImpl data={data} />;
}
