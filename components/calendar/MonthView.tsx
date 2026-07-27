"use client";

import { addMinutes } from "date-fns";
import { getMonthDays, isSameMonth, isToday } from "@/lib/dates";
import { generateDaySlots, isWeekday, toJst } from "@/lib/slots";
import {
  getReservationTags,
  getReservationsForDay,
} from "@/lib/reservations";
import { useApp } from "@/components/app/AppContext";
import type { Reservation } from "@/lib/types";

const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

export function MonthView() {
  const {
    currentDate,
    reservations,
    openCreatePanel,
    openViewPanel,
    currentUser,
  } = useApp();

  const monthDays = getMonthDays(currentDate);

  const handleEmptyDayClick = (day: Date, dayReservations: Reservation[]) => {
    if (!currentUser || !isWeekday(day)) return;

    const slots = generateDaySlots(day);
    const booked = new Set(
      dayReservations.flatMap((r) => {
        const start = new Date(r.start_at).getTime();
        const end = new Date(r.end_at).getTime();
        return slots
          .filter((s) => {
            const t = s.getTime();
            return t >= start && t < end;
          })
          .map((s) => s.getTime());
      })
    );

    const firstFree = slots.find((s) => !booked.has(s.getTime()));
    if (firstFree) {
      openCreatePanel(firstFree, addMinutes(firstFree, 15));
    }
  };

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="grid grid-cols-7 items-stretch gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="bg-zinc-50 px-2 py-2 text-center text-xs font-medium text-zinc-500"
          >
            {d}
          </div>
        ))}

        {monthDays.map((day) => {
          const jst = toJst(day);
          const dayReservations = getReservationsForDay(reservations, day);
          const inMonth = isSameMonth(day, currentDate);
          const weekend = jst.getDay() === 0 || jst.getDay() === 6;
          const canCreate = Boolean(currentUser && isWeekday(day));

          return (
            <div
              key={day.toISOString()}
              onClick={() => handleEmptyDayClick(day, dayReservations)}
              className={`flex min-h-24 flex-col bg-white p-2 ${
                inMonth ? "" : "bg-zinc-50/50"
              } ${isToday(day) ? "ring-2 ring-inset ring-blue-400" : ""} ${
                canCreate ? "cursor-pointer hover:bg-blue-50/50" : ""
              }`}
              aria-label={`${jst.getMonth() + 1}月${jst.getDate()}日に予約を作成`}
            >
              <div
                className={`mb-1 self-start rounded px-1 text-sm font-medium ${
                  inMonth
                    ? weekend
                      ? "text-zinc-400"
                      : "text-zinc-800"
                    : "text-zinc-300"
                }`}
              >
                {jst.getDate()}
              </div>

              {dayReservations.length > 0 && (
                <div className="flex flex-1 flex-col gap-1">
                  {dayReservations.map((r) => {
                    const tags = getReservationTags(r);
                    const primaryColor = tags[0]?.color ?? "#3B82F6";

                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openViewPanel(r);
                        }}
                        className="w-full truncate rounded border-l-2 px-1.5 py-0.5 text-left text-xs text-zinc-800 hover:opacity-80"
                        style={{
                          borderLeftColor: primaryColor,
                          backgroundColor: `${primaryColor}18`,
                        }}
                        title={r.title}
                      >
                        {r.title}
                      </button>
                    );
                  })}
                </div>
              )}

              {dayReservations.length === 0 && <div className="mt-auto min-h-8 flex-1" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
