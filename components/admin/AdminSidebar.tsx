"use client";

import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import type { Profile } from "@/lib/types";

export function AdminSidebar({
  currentUser,
  active,
}: {
  currentUser: Profile;
  active: "users" | "tags";
}) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 p-4">
        <Link href="/" className="block">
          <h1 className="text-lg font-bold text-zinc-900">会議室予約</h1>
          <p className="text-xs text-zinc-500">
            {active === "users" ? "ユーザー管理" : "タグ管理"}
          </p>
        </Link>
      </div>

      <nav className="space-y-1 p-4">
        <Link
          href="/admin/users"
          className={`block rounded-lg px-3 py-2 text-sm ${
            active === "users"
              ? "bg-blue-50 font-medium text-blue-700"
              : "text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          ユーザー一覧
        </Link>
        <Link
          href="/admin/tags"
          className={`block rounded-lg px-3 py-2 text-sm ${
            active === "tags"
              ? "bg-blue-50 font-medium text-blue-700"
              : "text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          タグ一覧
        </Link>
      </nav>

      <div className="mt-auto space-y-3 border-t border-zinc-200 p-4">
        <div>
          <p className="text-sm font-medium text-zinc-900">{currentUser.name}</p>
          <p className="text-xs text-zinc-500">{currentUser.department}</p>
          <span className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
            管理者
          </span>
        </div>
        <Link
          href="/"
          className="block w-full rounded-lg border border-zinc-200 px-3 py-2 text-center text-sm text-zinc-700 hover:bg-zinc-50"
        >
          予約画面
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-200"
          >
            ログアウト
          </button>
        </form>
      </div>
    </aside>
  );
}
