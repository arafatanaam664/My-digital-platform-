/**
 * مواعيد متكررة شهرية (رواتب ودعم) بالتاريخ الميلادي مع تعويض نهاية الأسبوع.
 * القاعدة المعتمدة في السعودية: إذا صادف موعد الصرف يوم الجمعة يُصرف الخميس الذي قبله،
 * وإذا صادف يوم السبت يُصرف الأحد الذي بعده (الأحد يوم عمل).
 */
export function nextMonthlyPayment(dayOfMonth: number, now = new Date()): Date {
  const y = now.getFullYear();
  const m = now.getMonth();
  const startToday = new Date(y, m, now.getDate(), 0, 0, 0, 0).getTime();
  let d = new Date(y, m, dayOfMonth, 0, 0, 0, 0);
  if (d.getTime() < startToday) d = new Date(y, m + 1, dayOfMonth, 0, 0, 0, 0);
  const wd = d.getDay();
  if (wd === 5) d.setDate(d.getDate() - 1); // الجمعة ← الخميس
  else if (wd === 6) d.setDate(d.getDate() + 1); // السبت ← الأحد
  return d;
}

/** التاريخ الحالي بتوقيت الرياض (UTC+3) — بغض النظر عن موقع الزائر أو الخادم */
export function nowInRiyadh(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
  const d = new Date(
    parseInt(g('year'), 10),
    parseInt(g('month'), 10) - 1,
    parseInt(g('day'), 10),
    parseInt(g('hour'), 10) % 24,
    parseInt(g('minute'), 10),
    parseInt(g('second'), 10),
  );
  return d;
}
