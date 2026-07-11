"use client";

import { addMinutes } from "date-fns";
import { formatDayHeader, getWeekDays } from "@/lib/dates";
import {
  SLOT_MINUTES,
  generateDaySlots,
  toJst,
} from "@/lib/slots";
import {
  getReservationTags,
  reservationOverlapsSlot,
} from "@/lib/reservations";
import { useApp } from "@/components/app/AppContext";

export function WeekView() {
  const {
    currentDate,
    reservations,
    openCreatePanel,
    openViewPanel,
    currentUser,
  } = useApp();

  const weekDays = getWeekDays(currentDate);

  const allSlots = weekDays[0] ? generateDaySlots(weekDays[0]) : [];

  const getReservationAtSlot = (day: Date, slotStart: Date) => {
    const slotEnd = addMinutes(slotStart, SLOT_MINUTES);
    return reservations.find((r) =>
      reservationOverlapsSlot(r, slotStart, slotEnd)
    );
  };

  const isReservationStart = (reservation: { start_at: string }, slot: Date) =>
    new Date(reservation.start_at).getTime() === slot.getTime();

  const getSlotDuration = (reservation: { start_at: string; end_at: string }) =>
    (new Date(reservation.end_at).getTime() -
      new Date(reservation.start_at).getTime()) /
    (SLOT_MINUTES * 60 * 1000);

  const handleSlotClick = (day: Date, slot: Date) => {
    if (!currentUser) return;

    const reservation = getReservationAtSlot(day, slot);
    if (reservation) {
      openViewPanel(reservation);
      return;
    }

    openCreatePanel(slot, addMinutes(slot, SLOT_MINUTES));
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-w-[700px]">
        <div className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-zinc-200 bg-zinc-50 sticky top-0 z-20">
          <div />
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className="border-l border-zinc-200 px-2 py-2 text-center text-sm font-medium text-zinc-700"
            >
              {formatDayHeader(day)}
            </div>
          ))}
        </div>

        {allSlots.map((slotTemplate) => {
          const jst = toJst(slotTemplate);
          const timeLabel = `${String(jst.getHours()).padStart(2, "0")}:${String(jst.getMinutes()).padStart(2, "0")}`;
          const showLabel = jst.getMinutes() === 0;

          return (
            <div
              key={timeLabel}
              className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-zinc-100"
            >
              <div className="px-2 py-1 text-right text-xs text-zinc-400">
                {showLabel ? timeLabel : ""}
              </div>

              {weekDays.map((day) => {
                const daySlots = generateDaySlots(day);
                const slot = daySlots.find((s) => {
                  const j = toJst(s);
                  return (
                    j.getHours() === jst.getHours() &&
                    j.getMinutes() === jst.getMinutes()
                  );
                });

                if (!slot) {
                  return (
                    <div
                      key={day.toISOString()}
                      className="h-6 border-l border-zinc-100"
                    />
                  );
                }

                const reservation = getReservationAtSlot(day, slot);

                if (reservation && !isReservationStart(reservation, slot)) {
                  return (
                    <div
                      key={day.toISOString()}
                      className="h-6 border-l border-zinc-100 bg-blue-100/30"
                    />
                  );
                }

                if (reservation && isReservationStart(reservation, slot)) {
                  const duration = getSlotDuration(reservation);
                  const tags = getReservationTags(reservation);
                  const primaryColor = tags[0]?.color ?? "#3B82F6";

                  return (
                    <div
                      key={day.toISOString()}
                      className="relative h-6 border-l border-zinc-100"
                    >
                      <button
                        type="button"
                        onClick={() => openViewPanel(reservation)}
                        className="absolute left-0.5 right-0.5 z-10 overflow-hidden rounded border-l-4 px-1 text-left text-xs shadow-sm hover:opacity-90"
                        style={{
                          height: `${duration * 24 - 2}px`,
                          borderLeftColor: primaryColor,
                          backgroundColor: `${primaryColor}18`,
                        }}
                      >
                        <div className="truncate font-medium text-zinc-800">
                          {reservation.title}
                        </div>
                      </button>
                    </div>
                  );
                }

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => handleSlotClick(day, slot)}
                    disabled={!currentUser}
                    className={`h-6 border-l border-zinc-100 ${
                      currentUser
                        ? "cursor-pointer hover:bg-blue-50"
                        : "cursor-default"
                    }`}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
