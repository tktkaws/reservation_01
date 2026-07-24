import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  eachDayOfInterval,
} from "date-fns";
import { ja } from "date-fns/locale";
import { toJst } from "@/lib/slots";

export function getMonthDays(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}

export function formatMonthYear(date: Date): string {
  return format(toJst(date), "yyyy年M月", { locale: ja });
}

export function formatListDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(toJst(d), "yyyy/MM/dd (EEE) HH:mm", { locale: ja });
}

export {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  isToday,
};
