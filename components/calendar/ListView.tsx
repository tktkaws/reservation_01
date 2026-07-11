"use client";

import { formatTimeRange } from "@/lib/slots";
import { getReservationTags } from "@/lib/reservations";
import { useApp } from "@/components/app/AppContext";
import type { Reservation } from "@/lib/types";

export function ListView() {
  const { reservations, openViewPanel } = useApp();

  if (reservations.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
        予約がありません
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-zinc-50 text-xs text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">日時</th>
            <th className="px-4 py-3 font-medium">タイトル</th>
            <th className="px-4 py-3 font-medium">予約者</th>
            <th className="px-4 py-3 font-medium">タグ</th>
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
      <td className="px-4 py-3 text-zinc-600">
        {formatTimeRange(reservation.start_at, reservation.end_at)}
      </td>
      <td className="px-4 py-3 font-medium text-zinc-900">
        {reservation.title}
      </td>
      <td className="px-4 py-3 text-zinc-600">
        {reservation.profiles?.name ?? "—"}
      </td>
      <td className="px-4 py-3">
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
