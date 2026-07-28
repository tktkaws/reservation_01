"use client";

import Link from "next/link";
import {
  addMonths,
  subMonths,
  formatMonthYear,
  getMonthDays,
  isSameDay,
  isSameMonth,
  isToday,
} from "@/lib/dates";
import { toJst } from "@/lib/slots";
import { useApp } from "@/components/app/AppContext";
import { signOut } from "@/app/actions/auth";
import { TagFilter } from "@/components/layout/TagFilter";

export function Sidebar() {
  const {
    currentDate,
    setCurrentDate,
    currentUser,
    tags,
    selectedTagIds,
    toggleTagFilter,
    clearTagFilters,
  } = useApp();

  const monthDays = getMonthDays(currentDate);
  const weekDays = ["月", "火", "水", "木", "金", "土", "日"];

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 p-4">
        <Link href="/" className="block">
          <h1 className="text-lg font-bold text-zinc-900">会議室予約</h1>
          <p className="text-xs text-zinc-500">Meeting Room</p>
        </Link>
      </div>

      <div className="border-b border-zinc-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="rounded px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
            aria-label="前月"
          >
            ‹
          </button>
          <span className="text-sm font-medium text-zinc-800">
            {formatMonthYear(currentDate)}
          </span>
          <button
            type="button"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="rounded px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
            aria-label="翌月"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-500">
          {weekDays.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((day) => {
            const jst = toJst(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = isSameDay(day, currentDate);
            const isWeekend = jst.getDay() === 0 || jst.getDay() === 6;

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setCurrentDate(day)}
                className={`rounded-full py-1 text-xs transition-colors ${
                  isSelected
                    ? "bg-blue-600 font-semibold text-white"
                    : isToday(day)
                      ? "bg-blue-50 font-medium text-blue-700"
                      : isCurrentMonth
                        ? isWeekend
                          ? "text-zinc-400 hover:bg-zinc-100"
                          : "text-zinc-700 hover:bg-zinc-100"
                        : "text-zinc-300"
                }`}
              >
                {jst.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      <TagFilter
        tags={tags}
        selectedTagIds={selectedTagIds}
        onToggle={toggleTagFilter}
        onClear={clearTagFilters}
        isAdmin={currentUser?.role === "admin"}
      />

      <div className="mt-auto border-t border-zinc-200 p-4">
        {currentUser ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-zinc-900">
                {currentUser.name}
              </p>
              <p className="text-xs text-zinc-500">{currentUser.department}</p>
              {currentUser.role === "admin" && (
                <span className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                  管理者
                </span>
              )}
            </div>
            {currentUser.role === "admin" && (
              <>
                <Link
                  href="/admin/users"
                  className="block w-full rounded-lg border border-zinc-200 px-3 py-2 text-center text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  ユーザー管理
                </Link>
                <Link
                  href="/admin/tags"
                  className="block w-full rounded-lg border border-zinc-200 px-3 py-2 text-center text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  タグ管理
                </Link>
              </>
            )}
            <form action={signOut}>
              <button
                type="submit"
                className="w-full rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-200"
              >
                ログアウト
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              href="/login"
              className="block w-full rounded-lg bg-blue-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
            >
              ログイン
            </Link>
            <Link
              href="/signup"
              className="block w-full rounded-lg border border-zinc-200 px-3 py-2 text-center text-sm text-zinc-700 hover:bg-zinc-50"
            >
              新規登録
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
