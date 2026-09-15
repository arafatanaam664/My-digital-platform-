import { cn } from '@/lib/utils';

export function ToolPanel({
  title,
  desc,
  children,
}: {
  title?: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {(title || desc) && (
        <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
          {title && <h3 className="text-sm font-bold text-slate-800">{title}</h3>}
          {desc && <p className="mt-0.5 text-xs leading-5 text-slate-500">{desc}</p>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30';

export const btnCls =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50';

export const selectCls = inputCls;

export function ResultBox({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm leading-7 text-slate-700', className)}>
      {children}
    </div>
  );
}

export function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
      <div className={cn('text-2xl font-extrabold', accent ? 'text-indigo-600' : 'text-slate-800')}>{value}</div>
      <div className="mt-1 text-[11px] font-medium text-slate-500">{label}</div>
    </div>
  );
}
