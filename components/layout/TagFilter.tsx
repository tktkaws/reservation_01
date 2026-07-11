"use client";

import { useState } from "react";
import { createTag, deleteTag, updateTag } from "@/app/actions/tags";
import { useApp } from "@/components/app/AppContext";
import type { Tag } from "@/lib/types";

const PRESET_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#6B7280",
];

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
  const { triggerRefresh } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setColor(PRESET_COLORS[0]);
    setEditingTag(null);
    setShowForm(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = editingTag
      ? await updateTag(editingTag.id, name, color)
      : await createTag(name, color);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    resetForm();
    triggerRefresh();
  };

  const handleDelete = async (tag: Tag) => {
    if (!confirm(`タグ「${tag.name}」を削除しますか？`)) return;
    const result = await deleteTag(tag.id);
    if (result.error) {
      setError(result.error);
      return;
    }
    triggerRefresh();
  };

  const startEdit = (tag: Tag) => {
    setEditingTag(tag);
    setName(tag.name);
    setColor(tag.color);
    setShowForm(true);
  };

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
          <div key={tag.id} className="group flex items-center gap-2">
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-zinc-50">
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
            {isAdmin && (
              <div className="hidden gap-1 group-hover:flex">
                <button
                  type="button"
                  onClick={() => startEdit(tag)}
                  className="text-xs text-zinc-500 hover:text-zinc-800"
                >
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(tag)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  削除
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {isAdmin && (
        <div className="mt-3">
          {!showForm ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="text-xs text-blue-600 hover:underline"
            >
              + タグを追加
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2 rounded-lg border border-zinc-200 p-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="タグ名"
                required
                className="w-full rounded border border-zinc-300 px-2 py-1 text-sm"
              />
              <div className="flex flex-wrap gap-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-6 w-6 rounded-full border-2 ${
                      color === c ? "border-zinc-800" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                >
                  {editingTag ? "更新" : "追加"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600"
                >
                  キャンセル
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
