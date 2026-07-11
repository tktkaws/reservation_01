"use client";

import { addMinutes } from "date-fns";
import { getMonthDays, isSameMonth, isToday } from "@/lib/dates";
import { generateDaySlots, isWeekday, toJst } from "@/lib/slots";
import { getReservationsForDay } from "@/lib/reservations";
import { useApp } from "@/components/app/AppContext";

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

  const handleDayClick = (day: Date) => {
    const dayReservations = getReservationsForDay(reservations, day);

    if (dayReservations.length > 0) {
      openViewPanel(dayReservations[0]);
      return;
    }

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
      <div className="grid grid-cols-7 gap-px rounded-lg border border-zinc-200 bg-zinc-200 overflow-hidden">
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

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => handleDayClick(day)}
              className={`min-h-24 bg-white p-2 text-left transition-colors ${
                inMonth ? "hover:bg-blue-50/50" : "bg-zinc-50/50"
              } ${isToday(day) ? "ring-2 ring-inset ring-blue-400" : ""} ${
                currentUser && isWeekday(day) ? "cursor-pointer" : ""
              }`}
            >
              <div
                className={`mb-1 text-sm font-medium ${
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
                <div className="space-y-1">
                  {dayReservations.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      className="truncate rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-800"
                    >
                      {r.title}
                    </div>
                  ))}
                  {dayReservations.length > 3 && (
                    <div className="text-xs text-zinc-500">
                      +{dayReservations.length - 3}件
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
