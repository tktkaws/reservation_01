import {
  addMinutes,
  differenceInMinutes,
  getDay,
  isBefore,
  isEqual,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export const TIMEZONE = "Asia/Tokyo";
export const SLOT_MINUTES = 15;
export const BUSINESS_START_HOUR = 9;
export const BUSINESS_END_HOUR = 18;

export function toJst(date: Date): Date {
  return toZonedTime(date, TIMEZONE);
}

export function fromJstComponents(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): Date {
  const local = new Date(year, month, day, hour, minute, 0, 0);
  return fromZonedTime(local, TIMEZONE);
}

export function isWeekday(date: Date): boolean {
  const day = getDay(toJst(date));
  return day >= 1 && day <= 5;
}

export function isWithinBusinessHours(start: Date, end: Date): boolean {
  const startJst = toJst(start);
  const endJst = toJst(end);

  if (!isWeekday(start) || !isWeekday(end)) return false;

  const dayStart = setMilliseconds(
    setSeconds(setMinutes(setHours(startJst, BUSINESS_START_HOUR), 0), 0),
    0
  );
  const dayEnd = setMilliseconds(
    setSeconds(setMinutes(setHours(startJst, BUSINESS_END_HOUR), 0), 0),
    0
  );

  const sameDay =
    startJst.getFullYear() === endJst.getFullYear() &&
    startJst.getMonth() === endJst.getMonth() &&
    startJst.getDate() === endJst.getDate();

  if (!sameDay) return false;

  return (
    (isEqual(startJst, dayStart) || isBefore(dayStart, startJst)) &&
    (isEqual(endJst, dayEnd) || isBefore(endJst, dayEnd))
  );
}

export function isAlignedToSlot(date: Date): boolean {
  const jst = toJst(date);
  return jst.getMinutes() % SLOT_MINUTES === 0 && jst.getSeconds() === 0;
}

export function validateReservationTime(start: Date, end: Date): string | null {
  if (!isBefore(start, end)) {
    return "終了時刻は開始時刻より後にしてください";
  }

  const duration = differenceInMinutes(end, start);
  if (duration % SLOT_MINUTES !== 0) {
    return `予約は${SLOT_MINUTES}分単位で設定してください`;
  }

  if (!isAlignedToSlot(start) || !isAlignedToSlot(end)) {
    return `時刻は${SLOT_MINUTES}分単位で指定してください`;
  }

  if (!isWithinBusinessHours(start, end)) {
    return "予約は月曜〜金曜の9:00〜18:00の範囲で設定してください";
  }

  return null;
}

export function generateDaySlots(date: Date): Date[] {
  const jst = toJst(date);
  const slots: Date[] = [];

  for (let hour = BUSINESS_START_HOUR; hour < BUSINESS_END_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
      slots.push(
        fromJstComponents(
          jst.getFullYear(),
          jst.getMonth(),
          jst.getDate(),
          hour,
          minute
        )
      );
    }
  }

  return slots;
}

export function formatTimeRange(
  start: Date | string,
  end: Date | string,
  options?: { includeYear?: boolean }
): string {
  const includeYear = options?.includeYear ?? true;
  const startDate = typeof start === "string" ? new Date(start) : start;
  const endDate = typeof end === "string" ? new Date(end) : end;
  const startJst = toJst(startDate);
  const endJst = toJst(endDate);

  const pad = (n: number) => String(n).padStart(2, "0");
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][startJst.getDay()];
  const dateStr = includeYear
    ? `${startJst.getFullYear()}/${pad(startJst.getMonth() + 1)}/${pad(startJst.getDate())}`
    : `${pad(startJst.getMonth() + 1)}/${pad(startJst.getDate())}`;
  const startStr = `${pad(startJst.getHours())}:${pad(startJst.getMinutes())}`;
  const endStr = `${pad(endJst.getHours())}:${pad(endJst.getMinutes())}`;

  return `${dateStr} (${weekday}) ${startStr} - ${endStr}`;
}

export function addSlotDuration(start: Date, slots: number): Date {
  return addMinutes(start, slots * SLOT_MINUTES);
}

export function getEndTimeOptions(start: Date): Date[] {
  const options: Date[] = [];
  let current = addMinutes(start, SLOT_MINUTES);
  const jst = toJst(start);
  const dayEnd = fromJstComponents(
    jst.getFullYear(),
    jst.getMonth(),
    jst.getDate(),
    BUSINESS_END_HOUR,
    0
  );

  while (isBefore(current, dayEnd) || isEqual(current, dayEnd)) {
    if (isWithinBusinessHours(start, current)) {
      options.push(current);
    }
    current = addMinutes(current, SLOT_MINUTES);
  }

  return options;
}

export type TimeSlot = { hour: number; minute: number };

export type HourSlotGroup = {
  hour: number;
  slots: TimeSlot[];
};

/** 開始時刻候補: 9:00〜17:45（15分刻み） */
export function getStartSlotGroups(): HourSlotGroup[] {
  const groups: HourSlotGroup[] = [];
  for (let hour = BUSINESS_START_HOUR; hour < BUSINESS_END_HOUR; hour++) {
    const slots: TimeSlot[] = [];
    for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
      slots.push({ hour, minute });
    }
    groups.push({ hour, slots });
  }
  return groups;
}

/** 終了時刻候補: 9:00〜18:00（15分刻み）。18時台は 18:00 のみ */
export function getEndSlotGroups(): HourSlotGroup[] {
  const groups = getStartSlotGroups();
  groups.push({
    hour: BUSINESS_END_HOUR,
    slots: [{ hour: BUSINESS_END_HOUR, minute: 0 }],
  });
  return groups;
}

export function formatSlotLabel(slot: TimeSlot): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(slot.hour)}:${pad(slot.minute)}`;
}

export function isSameSlot(a: TimeSlot, b: TimeSlot): boolean {
  return a.hour === b.hour && a.minute === b.minute;
}

export function slotToMinutes(slot: TimeSlot): number {
  return slot.hour * 60 + slot.minute;
}

export function dateToSlot(date: Date): TimeSlot {
  const jst = toJst(date);
  return { hour: jst.getHours(), minute: jst.getMinutes() };
}

export function combineDateAndSlot(
  year: number,
  month: number,
  day: number,
  slot: TimeSlot
): Date {
  return fromJstComponents(year, month, day, slot.hour, slot.minute);
}
