import type { Reservation, Tag } from "@/lib/types";

export function getReservationTags(reservation: Reservation): Tag[] {
  return reservation.reservation_tags?.map((rt) => rt.tags) ?? [];
}

export function reservationOverlapsSlot(
  reservation: Reservation,
  slotStart: Date,
  slotEnd: Date
): boolean {
  const resStart = new Date(reservation.start_at).getTime();
  const resEnd = new Date(reservation.end_at).getTime();
  const slotStartMs = slotStart.getTime();
  const slotEndMs = slotEnd.getTime();

  return resStart < slotEndMs && resEnd > slotStartMs;
}

export function getReservationsForDay(
  reservations: Reservation[],
  day: Date
): Reservation[] {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);

  return reservations.filter((r) => {
    const start = new Date(r.start_at);
    return start >= dayStart && start <= dayEnd;
  });
}
