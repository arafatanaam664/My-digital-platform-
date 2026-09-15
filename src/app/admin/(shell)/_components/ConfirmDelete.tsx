'use client';

import { useTransition } from 'react';

interface Props {
  action: () => Promise<void>;
  confirmText?: string;
  label?: string;
  className?: string;
}

export default function ConfirmDelete({ action, confirmText = 'هل أنت متأكد؟ لا يمكن التراجع.', label = 'حذف', className }: Props) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm(confirmText)) {
          startTransition(async () => {
            try {
              await action();
            } catch (e) {
              window.alert(e instanceof Error ? e.message : 'حدث خطأ');
            }
          });
        }
      }}
      className={
        'rounded-lg px-3 py-1.5 text-[11px] font-bold transition ' +
        (className || 'bg-rose-50 text-rose-600 hover:bg-rose-100') +
        (pending ? ' opacity-50' : '')
      }
    >
      {pending ? '...' : label}
    </button>
  );
}
