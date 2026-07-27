"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createReservation,
  deleteReservation,
  updateReservation,
} from "@/app/actions/reservations";
import {
  BUSINESS_END_HOUR,
  BUSINESS_START_HOUR,
  SLOT_MINUTES,
  combineDateAndSlot,
  dateToSlot,
  formatSlotLabel,
  formatTimeRange,
  getEndSlotGroups,
  getStartSlotGroups,
  isSameSlot,
  isWeekday,
  slotToMinutes,
  toJst,
  validateReservationTime,
  type TimeSlot,
} from "@/lib/slots";
import { getReservationTags } from "@/lib/reservations";
import { useApp } from "@/components/app/AppContext";
import type { Reservation } from "@/lib/types";

function toDateInputValue(date: Date): string {
  const jst = toJst(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${jst.getFullYear()}-${pad(jst.getMonth() + 1)}-${pad(jst.getDate())}`;
}

function parseDateInput(value: string): { year: number; month: number; day: number } {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month: month - 1, day };
}

function defaultStartSlot(date?: Date): TimeSlot {
  if (!date) return { hour: BUSINESS_START_HOUR, minute: 0 };
  const slot = dateToSlot(date);
  const minutes = slotToMinutes(slot);
  const startMin = BUSINESS_START_HOUR * 60;
  const lastStartMin = (BUSINESS_END_HOUR - 1) * 60 + (60 - SLOT_MINUTES);
  if (minutes < startMin) return { hour: BUSINESS_START_HOUR, minute: 0 };
  if (minutes > lastStartMin) {
    return { hour: BUSINESS_END_HOUR - 1, minute: 60 - SLOT_MINUTES };
  }
  return {
    hour: slot.hour,
    minute: Math.floor(slot.minute / SLOT_MINUTES) * SLOT_MINUTES,
  };
}

function defaultEndSlot(start: TimeSlot, date?: Date): TimeSlot {
  if (date) {
    const slot = dateToSlot(date);
    if (slotToMinutes(slot) > slotToMinutes(start)) {
      return {
        hour: slot.hour,
        minute: Math.floor(slot.minute / SLOT_MINUTES) * SLOT_MINUTES,
      };
    }
  }
  const next = slotToMinutes(start) + SLOT_MINUTES;
  return { hour: Math.floor(next / 60), minute: next % 60 };
}

function TimeSlotPicker({
  label,
  groups,
  value,
  onChange,
  isDisabled,
}: {
  label: string;
  groups: ReturnType<typeof getStartSlotGroups>;
  value: TimeSlot;
  onChange: (slot: TimeSlot) => void;
  isDisabled?: (slot: TimeSlot) => boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <p className="mb-1 text-xs font-medium text-zinc-600">{label}</p>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-lg border border-zinc-300 px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50"
        aria-expanded={open}
      >
        <span>{formatSlotLabel(value)}</span>
        <span className="text-xs text-zinc-400">{open ? "閉じる" : "選択"}</span>
      </button>

      {open && (
        <div className="mt-2 space-y-1 rounded-lg border border-zinc-200 bg-zinc-50 p-2">
          {groups.map((group) => (
            <div
              key={group.hour}
              className={`grid gap-1 ${
                group.slots.length === 1 ? "grid-cols-1" : "grid-cols-4"
              }`}
            >
              {group.slots.map((slot) => {
                const selected = isSameSlot(slot, value);
                const disabled = isDisabled?.(slot) ?? false;
                return (
                  <button
                    key={`${slot.hour}:${slot.minute}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onChange(slot);
                      setOpen(false);
                    }}
                    className={`rounded px-1 py-1.5 text-[10px] leading-tight transition-colors ${
                      selected
                        ? "bg-blue-600 font-medium text-white"
                        : disabled
                          ? "cursor-not-allowed bg-white text-zinc-300"
                          : "border border-zinc-200 bg-white text-zinc-700 hover:bg-blue-50"
                    }`}
                    aria-pressed={selected}
                    title={formatSlotLabel(slot)}
                  >
                    {formatSlotLabel(slot)}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
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

  const initialDate =
    reservation
      ? new Date(reservation.start_at)
      : (defaultStart ?? new Date());
  const initialStart = defaultStartSlot(
    reservation ? new Date(reservation.start_at) : defaultStart
  );
  const initialEnd = defaultEndSlot(
    initialStart,
    reservation ? new Date(reservation.end_at) : defaultEnd
  );

  const [title, setTitle] = useState(reservation?.title ?? "");
  const [memo, setMemo] = useState(reservation?.memo ?? "");
  const [dateValue, setDateValue] = useState(toDateInputValue(initialDate));
  const [startSlot, setStartSlot] = useState<TimeSlot>(initialStart);
  const [endSlot, setEndSlot] = useState<TimeSlot>(initialEnd);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    reservation ? getReservationTags(reservation).map((t) => t.id) : []
  );

  const startGroups = useMemo(() => getStartSlotGroups(), []);
  const endGroups = useMemo(() => getEndSlotGroups(), []);

  const handleStartChange = (slot: TimeSlot) => {
    setStartSlot(slot);
    if (slotToMinutes(endSlot) <= slotToMinutes(slot)) {
      setEndSlot(defaultEndSlot(slot));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { year, month, day } = parseDateInput(dateValue);
    const start = combineDateAndSlot(year, month, day, startSlot);
    const end = combineDateAndSlot(year, month, day, endSlot);

    if (!isWeekday(start)) {
      setError("予約は月曜〜金曜のみ設定できます");
      return;
    }

    const validationError = validateReservationTime(start, end);
    if (validationError) {
      setError(validationError);
      return;
    }

    const input = {
      title,
      memo,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
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

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">
          日付
        </label>
        <input
          type="date"
          value={dateValue}
          onChange={(e) => setDateValue(e.target.value)}
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-[11px] text-zinc-500">
          予約可能時間: 月曜〜金曜 {BUSINESS_START_HOUR}:00〜
          {BUSINESS_END_HOUR}:00（15分単位）
        </p>
      </div>

      <TimeSlotPicker
        label="開始時刻"
        groups={startGroups}
        value={startSlot}
        onChange={handleStartChange}
      />

      <TimeSlotPicker
        label="終了時刻"
        groups={endGroups}
        value={endSlot}
        onChange={setEndSlot}
        isDisabled={(slot) => slotToMinutes(slot) <= slotToMinutes(startSlot)}
      />

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
          className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
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
            className="flex-1 rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            削除
          </button>
        </div>
      )}
    </aside>
  );
}
