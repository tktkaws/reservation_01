"use client";

import Link from "next/link";
import type { Tag } from "@/lib/types";

type Props = {
  tags: Tag[];
  selectedTagIds: string[];
  onToggle: (tagId: string) => void;
  onClear: () => void;
  isAdmin: boolean;
};

export function TagFilter({
  tags,
  selectedTagIds,
  onToggle,
  onClear,
  isAdmin,
}: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-800">タグ</h2>
        {selectedTagIds.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-blue-600 hover:underline"
          >
            クリア
          </button>
        )}
      </div>

      <div className="space-y-1">
        {tags.map((tag) => {
          const checked = selectedTagIds.includes(tag.id);

          return (
            <label
              key={tag.id}
              className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 hover:bg-zinc-50"
            >
              <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(tag.id)}
                  className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0"
                />
                <span
                  className="flex h-4 w-4 items-center justify-center rounded-[3px] border-2 transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-blue-500"
                  style={
                    checked
                      ? {
                          backgroundColor: tag.color,
                          borderColor: tag.color,
                        }
                      : {
                          backgroundColor: "transparent",
                          borderColor: tag.color,
                        }
                  }
                  aria-hidden
                >
                  {checked && (
                    <svg
                      viewBox="0 0 12 12"
                      className="h-2.5 w-2.5"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M2.5 6.2L4.8 8.5L9.5 3.5"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
              </span>
              <span className="text-sm text-zinc-700">{tag.name}</span>
            </label>
          );
        })}
      </div>

      {isAdmin && (
        <div className="mt-3">
          <Link
            href="/admin/tags"
            className="text-xs text-blue-600 hover:underline"
          >
            タグ管理
          </Link>
        </div>
      )}
    </div>
  );
}
