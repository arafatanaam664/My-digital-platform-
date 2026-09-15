import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import ConfirmDelete from '../_components/ConfirmDelete';
import { createUser, deleteUser, updateUser } from '@/actions/users';
import { fmtDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30';
const labelCls = 'mb-1.5 block text-xs font-bold text-slate-600';

export default async function UsersPage() {
  const me = await getSessionUser();
  const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">إدارة المستخدمين</h1>
        <p className="mt-1 text-xs text-slate-500">المسؤول: صلاحيات كاملة · المحرر: نفس الصلاحيات في هذا الإصدار (يمكن التمييز لاحقاً)</p>
      </div>

      <form action={createUser} className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5">
        <h2 className="mb-4 text-sm font-extrabold text-slate-900">+ مستخدم جديد</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className={labelCls}>الاسم *</span>
            <input name="name" required className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>البريد الإلكتروني *</span>
            <input name="email" type="email" dir="ltr" required className={inputCls + ' text-left'} />
          </label>
          <label className="block">
            <span className={labelCls}>كلمة المرور * (8+ أحرف)</span>
            <input name="password" type="password" dir="ltr" required minLength={8} className={inputCls + ' text-left'} />
          </label>
          <label className="block">
            <span className={labelCls}>الدور</span>
            <select name="role" defaultValue="admin" className={inputCls}>
              <option value="admin">مسؤول</option>
              <option value="editor">محرر</option>
            </select>
          </label>
        </div>
        <button className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-indigo-700">إضافة المستخدم</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 text-[11px] text-slate-400">
            <tr>
              <th className="px-4 py-3 font-bold">المستخدم</th>
              <th className="px-4 py-3 font-bold">الدور</th>
              <th className="px-4 py-3 font-bold">الحالة</th>
              <th className="px-4 py-3 font-bold">آخر دخول</th>
              <th className="px-4 py-3 font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                <td className="px-4 py-3">
                  <div className="font-extrabold text-slate-800">
                    {u.name} {u.id === me?.id && <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600">أنت</span>}
                  </div>
                  <div className="text-[10px] text-slate-400" dir="ltr">
                    {u.email}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{u.role === 'admin' ? '👑 مسؤول' : '✏️ محرر'}</td>
                <td className="px-4 py-3">
                  <span className={'rounded-md px-2 py-1 text-[10px] font-bold ' + (u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600')}>
                    {u.isActive ? 'نشط' : 'معطل'}
                  </span>
                </td>
                <td className="px-4 py-3 text-[11px] text-slate-400">{u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : '—'}</td>
                <td className="px-4 py-3">
                  <form action={updateUser} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <select name="role" defaultValue={u.role} className="rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-bold">
                      <option value="admin">مسؤول</option>
                      <option value="editor">محرر</option>
                    </select>
                    <label className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                      <input type="checkbox" name="isActive" defaultChecked={u.isActive} className="h-3.5 w-3.5 accent-indigo-600" /> نشط
                    </label>
                    <input name="password" placeholder="كلمة مرور جديدة" dir="ltr" className="w-32 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px]" />
                    <button className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-slate-700">حفظ</button>
                    {u.id !== me?.id ? <ConfirmDelete action={deleteUser.bind(null, u.id)} confirmText={`حذف مستخدم «${u.name}»؟`} /> : null}
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
