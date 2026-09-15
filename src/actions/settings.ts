'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { invalidateSettings, SETTING_KEYS } from '@/lib/settings';

export async function saveSettings(fd: FormData) {
  await requireUser();
  for (const key of SETTING_KEYS) {
    const value = String(fd.get(key) ?? '').trim();
    if (key === 'analyticsEnabled') {
      // checkbox: store '1' or '0'
      const on = fd.get('analyticsEnabled') === 'on';
      const current = await prisma.setting.findUnique({ where: { key } });
      const val = on ? '1' : '0';
      if (current && current.value === val) continue;
      if (current) await prisma.setting.update({ where: { key }, data: { value: val } });
      else await prisma.setting.create({ data: { key, value: val } });
      continue;
    }
    const current = await prisma.setting.findUnique({ where: { key } });
    const val = value || null;
    if (current && current.value === val) continue;
    if (current) await prisma.setting.update({ where: { key }, data: { value: val } });
    else await prisma.setting.create({ data: { key, value: val } });
  }
  invalidateSettings();
  revalidatePath('/', 'layout');
  for (const p of ['/', '/s', '/articles', '/guides', '/tools', '/pages']) revalidatePath(p, 'page');
}
