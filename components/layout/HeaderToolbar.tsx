"use client";

import { useApp } from "@/components/app/AppContext";
import type { ViewMode } from "@/lib/types";
import { formatMonthYear } from "@/lib/dates";

const VIEW_LABELS: Record<ViewMode, string> = {
  list: "リスト",
  week: "週間",
  month: "月間",
};

export function HeaderToolbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const {
    viewMode,
    setViewMode,
    goToToday,
    currentDate,
    currentUser,
    openCreatePanel,
  } = useApp();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg border border-zinc-200 px-2 py-1 text-sm lg:hidden"
            aria-label="メニュー"
          >
            ☰
          </button>
        )}
        <h2 className="text-lg font-semibold text-zinc-900">
          {formatMonthYear(currentDate)}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        {currentUser && (
          <button
            type="button"
            onClick={() => openCreatePanel()}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            新規予約
          </button>
        )}

        <button
          type="button"
          onClick={goToToday}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          Today
        </button>

        <div className="flex rounded-lg border border-zinc-200 p-0.5">
          {(Object.keys(VIEW_LABELS) as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                viewMode === mode
                  ? "bg-blue-600 text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {VIEW_LABELS[mode]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
