'use client';

import type { ComponentType } from 'react';

import HijriConverter from './HijriConverter';
import Countdown from './Countdown';
import AgeCalculator from './AgeCalculator';
import WorkingDays from './WorkingDays';
import MonthCalendar from './MonthCalendar';
import DayOfWeek from './DayOfWeek';
import NameDecoration from './NameDecoration';

export interface ToolDef {
  name: string;
  icon: string;
  description: string;
  Component: ComponentType;
}

export const TOOL_REGISTRY: Record<string, ToolDef> = {
  'hijri-gregorian': {
    name: 'محوّل التاريخ الهجري والميلادي',
    icon: '🌙',
    description: 'حوّل أي تاريخ بين التقويمين فوراً',
    Component: HijriConverter,
  },
  'countdown': {
    name: 'عدّاد تنازلي للمواعيد',
    icon: '⏳',
    description: 'احسب الأيام والوقت المتبقي حتى أي موعد',
    Component: Countdown,
  },
  'age-calculator': {
    name: 'حاسبة العمر',
    icon: '🎂',
    description: 'احسب عمرك بدقة بالسنوات والشهور والأيام',
    Component: AgeCalculator,
  },
  'working-days': {
    name: 'حاسبة الأيام العملية',
    icon: '📅',
    description: 'احسب عدد أيام العمل بين تاريخين مع استبعاد العطلات',
    Component: WorkingDays,
  },
  'month-calendar': {
    name: 'تقويم الشهر (هجري وميلادي)',
    icon: '🗓️',
    description: 'استعرض أي شهر بالتقويمين مع أيام الأسبوعو',
    Component: MonthCalendar,
  },
  'day-of-week': {
    name: 'يوم الأسبوعو لأي تاريخ',
    icon: '📆',
    description: 'اعرف ما هو يوم الأسبوعو لأي تاريخ مضى أو قادم',
    Component: DayOfWeek,
  },
  'name-decoration': {
    name: 'مُزيّن الأسماء (أحرف يونيكود)',
    icon: '🎀',
    description: 'حوّل اسمك إلى صيغ زخرفية عريضة ومائلة وخطية ورمزية',
    Component: NameDecoration,
  },
};

export const TOOL_LIST = Object.entries(TOOL_REGISTRY).map(([key, t]) => ({
  key,
  name: t.name,
  icon: t.icon,
  description: t.description,
}));
