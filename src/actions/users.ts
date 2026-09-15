'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { hashPassword, requireUser } from '@/lib/auth';

export async function createUser(fd: FormData) {
  await requireUser();
  const name = String(fd.get('name') || '').trim();
  const email = String(fd.get('email') || '').trim().toLowerCase();
  const password = String(fd.get('password') || '');
  const role = String(fd.get('role') || 'editor');
  if (!name || !email || password.length < 8) throw new Error('جميع الحقول مطلوبة وكلمة المرور 8 أحرف على الأقل');

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('هذا البريد مستخدم بالفعل');

  await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password), role },
  });
  revalidatePath('/admin/users');
}

export async function updateUser(fd: FormData) {
  await requireUser();
  const id = parseInt(String(fd.get('id') || '0'), 10);
  if (!id) return;
  const data: Record<string, unknown> = {};
  const role = String(fd.get('role') || '');
  const active = fd.get('isActive');
  const password = String(fd.get('password') || '');
  if (role) data.role = role;
  if (active !== null) data.isActive = active === 'on';
  if (password) data.passwordHash = await hashPassword(password);
  await prisma.user.update({ where: { id }, data });
  revalidatePath('/admin/users');
}

export async function deleteUser(id: number) {
  const me = await requireUser();
  if (id === me.id) throw new Error('لا يمكنك حذف حسابك الحالي');
  await prisma.user.delete({ where: { id } }).catch(() => {});
  revalidatePath('/admin/users');
}
