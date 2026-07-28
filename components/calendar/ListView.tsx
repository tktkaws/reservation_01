"use client";

import { formatTimeRange } from "@/lib/slots";
import { getReservationTags } from "@/lib/reservations";
import { useApp } from "@/components/app/AppContext";
import type { Reservation } from "@/lib/types";

const CELL_PAD = "px-4 py-3";

export function ListView() {
  const { reservations, openViewPanel } = useApp();

  if (reservations.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white text-sm text-zinc-500">
        予約がありません
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="divide-y divide-zinc-100 md:hidden">
        {reservations.map((reservation) => (
          <ReservationCard
            key={reservation.id}
            reservation={reservation}
            onClick={() => openViewPanel(reservation)}
          />
        ))}
      </div>

      <table className="hidden w-full min-w-[768px] text-left text-sm md:table">
        <thead className="sticky top-0 bg-white text-xs text-zinc-500">
          <tr>
            <th className={`${CELL_PAD} font-medium`}>日時</th>
            <th className={`${CELL_PAD} font-medium`}>タイトル</th>
            <th className={`${CELL_PAD} font-medium`}>予約者</th>
            <th className={`${CELL_PAD} font-medium`}>タグ</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((reservation) => (
            <ReservationRow
              key={reservation.id}
              reservation={reservation}
              onClick={() => openViewPanel(reservation)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReservationCard({
  reservation,
  onClick,
}: {
  reservation: Reservation;
  onClick: () => void;
}) {
  const tags = getReservationTags(reservation);
  const timeLabel = formatTimeRange(reservation.start_at, reservation.end_at, {
    includeYear: false,
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-blue-50/50"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-sm font-medium text-zinc-900">
          {reservation.title}
        </span>
        <span className="shrink-0 text-xs text-zinc-500">
          {reservation.profiles?.name ?? "—"}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-zinc-600">{timeLabel}</span>
        {tags.length > 0 && (
          <div className="flex min-w-0 flex-wrap justify-end gap-1">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px]"
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

function ReservationRow({
  reservation,
  onClick,
}: {
  reservation: Reservation;
  onClick: () => void;
}) {
  const tags = getReservationTags(reservation);

  return (
    <tr
      onClick={onClick}
      className="cursor-pointer border-b border-zinc-100 hover:bg-blue-50/50"
    >
      <td className={`${CELL_PAD} text-zinc-600`}>
        {formatTimeRange(reservation.start_at, reservation.end_at, {
          includeYear: false,
        })}
      </td>
      <td className={`${CELL_PAD} font-medium text-zinc-900`}>
        {reservation.title}
      </td>
      <td className={`${CELL_PAD} text-zinc-600`}>
        {reservation.profiles?.name ?? "—"}
      </td>
      <td className={CELL_PAD}>
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
              style={{
                backgroundColor: `${tag.color}20`,
                color: tag.color,
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      </td>
    </tr>
  );
}
