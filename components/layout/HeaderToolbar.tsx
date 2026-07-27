"use client";

import { useApp } from "@/components/app/AppContext";
import type { ViewMode } from "@/lib/types";
import { addMonths, formatMonthYear, subMonths } from "@/lib/dates";

const VIEW_LABELS: Record<ViewMode, string> = {
  list: "リスト",
  month: "月間",
};

export function HeaderToolbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const {
    viewMode,
    setViewMode,
    goToToday,
    currentDate,
    setCurrentDate,
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
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="rounded-lg border border-zinc-200 px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-50"
            aria-label="前月"
          >
            ‹
          </button>
          <h2 className="min-w-[7.5rem] text-center text-lg font-semibold text-zinc-900">
            {formatMonthYear(currentDate)}
          </h2>
          <button
            type="button"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="rounded-lg border border-zinc-200 px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-50"
            aria-label="翌月"
          >
            ›
          </button>
        </div>
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
