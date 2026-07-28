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
        {tags.map((tag) => (
          <label
            key={tag.id}
            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-zinc-50"
          >
            <input
              type="checkbox"
              checked={selectedTagIds.includes(tag.id)}
              onChange={() => onToggle(tag.id)}
              className="rounded border-zinc-300"
            />
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
            <span className="text-sm text-zinc-700">{tag.name}</span>
          </label>
        ))}
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
