"use client";

import { useRef, useState, useTransition } from "react";
import { createTag, deleteTag, reorderTags, updateTag } from "@/app/actions/tags";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ModalShell } from "@/components/ui/ModalShell";
import type { Profile, Tag } from "@/lib/types";

const PRESET_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#6B7280",
];

const HEX_PATTERN = /^#([0-9A-Fa-f]{6})$/;

function normalizeHex(value: string): string | null {
  const trimmed = value.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (!HEX_PATTERN.test(withHash)) return null;
  return withHash.toUpperCase();
}

function TagForm({
  tag,
  mode,
  onClose,
  onSaved,
}: {
  tag: Tag | null;
  mode: "create" | "edit";
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(tag?.name ?? "");
  const [color, setColor] = useState(
    normalizeHex(tag?.color ?? PRESET_COLORS[0]) ?? PRESET_COLORS[0]
  );
  const [hexInput, setHexInput] = useState(color);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const applyColor = (next: string) => {
    const normalized = normalizeHex(next);
    if (!normalized) return;
    setColor(normalized);
    setHexInput(normalized);
  };

  const handleHexChange = (value: string) => {
    setHexInput(value);
    const normalized = normalizeHex(value);
    if (normalized) setColor(normalized);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalized = normalizeHex(hexInput) ?? normalizeHex(color);
    if (!normalized) {
      setError("色は #RRGGBB 形式で指定してください");
      return;
    }

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createTag(name, normalized)
          : await updateTag(tag!.id, name, normalized);

      if (result.error) {
        setError(result.error);
        return;
      }

      onSaved();
      onClose();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">
          タグ名
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-zinc-600">色</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => applyColor(c)}
              className={`h-7 w-7 rounded-full border-2 ${
                color === c ? "border-zinc-800" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
              aria-label={`色 ${c}`}
            />
          ))}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(e) => applyColor(e.target.value)}
            className="h-10 w-12 cursor-pointer rounded border border-zinc-300 bg-white p-1"
            aria-label="カラーピッカー"
          />
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              HEX
            </label>
            <input
              type="text"
              value={hexInput}
              onChange={(e) => handleHexChange(e.target.value)}
              placeholder="#3B82F6"
              spellCheck={false}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm uppercase"
            />
          </div>
          <span
            className="mt-5 h-8 w-8 shrink-0 rounded-lg border border-zinc-200"
            style={{ backgroundColor: color }}
            aria-hidden
          />
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
          {isPending ? "保存中..." : mode === "create" ? "追加" : "更新"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}

export function AdminTagsClient({
  initialTags,
  currentUser,
}: {
  initialTags: Tag[];
  currentUser: Profile;
}) {
  const [tags, setTags] = useState(initialTags);
  const tagsRef = useRef(tags);
  tagsRef.current = tags;
  const [modalMode, setModalMode] = useState<"empty" | "create" | "edit">(
    "empty"
  );
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refreshTags = async () => {
    const { fetchTags } = await import("@/app/actions/tags");
    const result = await fetchTags();
    if (result.data) setTags(result.data);
  };

  const closeModal = () => {
    setModalMode("empty");
    setEditingTag(null);
  };

  const handleDelete = (tag: Tag) => {
    if (!confirm(`タグ「${tag.name}」を削除しますか？`)) return;
    startTransition(async () => {
      const result = await deleteTag(tag.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      await refreshTags();
      closeModal();
    });
  };

  const persistOrder = (nextTags: Tag[]) => {
    setTags(nextTags);
    startTransition(async () => {
      const result = await reorderTags(nextTags.map((t) => t.id));
      if (result.error) {
        setError(result.error);
        await refreshTags();
      }
    });
  };

  const onDragStart = (index: number) => {
    setDragIndex(index);
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    setTags((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(index);
  };

  const onDragEnd = () => {
    if (dragIndex === null) return;
    setDragIndex(null);
    persistOrder(tagsRef.current);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-100">
      <AdminSidebar currentUser={currentUser} active="tags" />

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold">タグ一覧</h2>
            <p className="text-xs text-zinc-500">
              ドラッグして表示順を変更できます
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingTag(null);
              setModalMode("create");
            }}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
          >
            新規タグ
          </button>
        </div>

        {error && (
          <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex-1 overflow-y-auto bg-white">
          <ul className="divide-y divide-zinc-100">
            {tags.map((tag, index) => (
              <li
                key={tag.id}
                draggable
                onDragStart={() => onDragStart(index)}
                onDragOver={(e) => onDragOver(e, index)}
                onDragEnd={onDragEnd}
                className={`flex items-center gap-3 px-4 py-3 ${
                  dragIndex === index ? "bg-blue-50" : "hover:bg-zinc-50"
                } ${isPending ? "opacity-80" : ""}`}
              >
                <span
                  className="cursor-grab select-none text-zinc-400 active:cursor-grabbing"
                  aria-hidden
                >
                  ⋮⋮
                </span>
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setEditingTag(tag);
                    setModalMode("edit");
                  }}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-sm font-medium text-zinc-900">
                    {tag.name}
                  </span>
                  <span className="block font-mono text-xs text-zinc-500">
                    {tag.color}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTag(tag);
                    setModalMode("edit");
                  }}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
                >
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(tag)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                >
                  削除
                </button>
              </li>
            ))}
          </ul>

          {tags.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">
              タグがありません
            </p>
          )}
        </div>
      </main>

      {modalMode !== "empty" && (
        <ModalShell
          title={modalMode === "create" ? "タグを追加" : "タグを編集"}
          onClose={closeModal}
        >
          <TagForm
            key={`${modalMode}-${editingTag?.id ?? "new"}`}
            tag={editingTag}
            mode={modalMode === "create" ? "create" : "edit"}
            onClose={closeModal}
            onSaved={refreshTags}
          />
        </ModalShell>
      )}
    </div>
  );
}
