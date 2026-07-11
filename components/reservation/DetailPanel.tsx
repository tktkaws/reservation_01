"use client";

import { useState, useTransition } from "react";
import {
  createReservation,
  deleteReservation,
  updateReservation,
} from "@/app/actions/reservations";
import { formatTimeRange, toJst } from "@/lib/slots";
import { getReservationTags } from "@/lib/reservations";
import { useApp } from "@/components/app/AppContext";
import type { Reservation } from "@/lib/types";

function toLocalInputValue(date: Date): string {
  const jst = toJst(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${jst.getFullYear()}-${pad(jst.getMonth() + 1)}-${pad(jst.getDate())}T${pad(jst.getHours())}:${pad(jst.getMinutes())}`;
}

function fromLocalInputValue(value: string): Date {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const local = new Date(year, month - 1, day, hour, minute);
  return local;
}

export function ReservationForm({
  mode,
  reservation,
  defaultStart,
  defaultEnd,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  reservation?: Reservation;
  defaultStart?: Date;
  defaultEnd?: Date;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { tags, triggerRefresh } = useApp();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(reservation?.title ?? "");
  const [memo, setMemo] = useState(reservation?.memo ?? "");
  const [startAt, setStartAt] = useState(
    reservation
      ? toLocalInputValue(new Date(reservation.start_at))
      : defaultStart
        ? toLocalInputValue(defaultStart)
        : ""
  );
  const [endAt, setEndAt] = useState(
    reservation
      ? toLocalInputValue(new Date(reservation.end_at))
      : defaultEnd
        ? toLocalInputValue(defaultEnd)
        : ""
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    reservation ? getReservationTags(reservation).map((t) => t.id) : []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const input = {
      title,
      memo,
      startAt: fromLocalInputValue(startAt).toISOString(),
      endAt: fromLocalInputValue(endAt).toISOString(),
      tagIds: selectedTagIds,
    };

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createReservation(input)
          : await updateReservation(reservation!.id, input);

      if (result.error) {
        setError(result.error);
        return;
      }

      triggerRefresh();
      onSuccess();
    });
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">
          タイトル
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            開始
          </label>
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            required
            step={900}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            終了
          </label>
          <input
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            required
            step={900}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">
          メモ
        </label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-zinc-600">
          タグ
        </label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedTagIds.includes(tag.id)
                  ? "text-white"
                  : "border border-zinc-200 text-zinc-600"
              }`}
              style={
                selectedTagIds.includes(tag.id)
                  ? { backgroundColor: tag.color }
                  : undefined
              }
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "保存中..." : mode === "create" ? "予約する" : "更新する"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}

export function DetailPanel() {
  const {
    panel,
    closePanel,
    openEditPanel,
    openViewPanel,
    currentUser,
    triggerRefresh,
  } = useApp();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canEdit = (reservation: Reservation) => {
    if (!currentUser) return false;
    return (
      currentUser.id === reservation.user_id ||
      currentUser.role === "admin"
    );
  };

  const handleDelete = (id: string) => {
    if (!confirm("この予約を削除しますか？")) return;

    startTransition(async () => {
      const result = await deleteReservation(id);
      if (result.error) {
        setError(result.error);
        return;
      }
      triggerRefresh();
      closePanel();
    });
  };

  if (panel.mode === "empty") {
    return (
      <aside className="flex h-full w-80 shrink-0 flex-col border-l border-zinc-200 bg-zinc-50">
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-zinc-500">
          予約を選択するか、新規予約を作成してください
        </div>
      </aside>
    );
  }

  if (panel.mode === "create") {
    return (
      <aside className="flex h-full w-80 shrink-0 flex-col border-l border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-3">
          <h3 className="font-semibold text-zinc-900">新規予約</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <ReservationForm
            mode="create"
            defaultStart={panel.startAt}
            defaultEnd={panel.endAt}
            onSuccess={closePanel}
            onCancel={closePanel}
          />
        </div>
      </aside>
    );
  }

  if (panel.mode === "edit") {
    return (
      <aside className="flex h-full w-80 shrink-0 flex-col border-l border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-3">
          <h3 className="font-semibold text-zinc-900">予約を編集</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <ReservationForm
            mode="edit"
            reservation={panel.reservation}
            onSuccess={closePanel}
            onCancel={() => openViewPanel(panel.reservation)}
          />
        </div>
      </aside>
    );
  }

  const reservation = panel.reservation;
  const tags = getReservationTags(reservation);
  const editable = canEdit(reservation);

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h3 className="font-semibold text-zinc-900">予約詳細</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <p className="text-xs text-zinc-500">タイトル</p>
          <p className="text-lg font-semibold text-zinc-900">
            {reservation.title}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">日時</p>
          <p className="text-sm text-zinc-800">
            {formatTimeRange(reservation.start_at, reservation.end_at)}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">予約者</p>
          <p className="text-sm text-zinc-800">
            {reservation.profiles?.name ?? "—"}
          </p>
          {reservation.profiles?.department && (
            <p className="text-xs text-zinc-500">
              {reservation.profiles.department}
            </p>
          )}
        </div>

        {tags.length > 0 && (
          <div>
            <p className="mb-1 text-xs text-zinc-500">タグ</p>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full px-2 py-0.5 text-xs"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {reservation.memo && (
          <div>
            <p className="text-xs text-zinc-500">メモ</p>
            <p className="whitespace-pre-wrap text-sm text-zinc-700">
              {reservation.memo}
            </p>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      {editable && (
        <div className="border-t border-zinc-200 p-4 flex gap-2">
          <button
            type="button"
            onClick={() => openEditPanel(reservation)}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            編集
          </button>
          <button
            type="button"
            onClick={() => handleDelete(reservation.id)}
            disabled={isPending}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            削除
          </button>
        </div>
      )}
    </aside>
  );
}
