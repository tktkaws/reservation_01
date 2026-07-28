"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import {
  createUser,
  deleteUser,
  updateUser,
} from "@/app/actions/users";
import { signOut } from "@/app/actions/auth";
import type { Profile, UserRole } from "@/lib/types";

function ModalShell({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="モーダルを閉じる"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <h3 className="font-semibold text-zinc-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer}
      </div>
    </div>
  );
}

function UserForm({
  user,
  mode,
  onClose,
  onRefresh,
}: {
  user: Profile | null;
  mode: "create" | "edit";
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [department, setDepartment] = useState(user?.department ?? "");
  const [role, setRole] = useState<UserRole>(user?.role ?? "user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      if (mode === "create") {
        const result = await createUser({
          email,
          password,
          name,
          department,
          role,
        });
        if (result.error) {
          setError(result.error);
          return;
        }
      } else if (user) {
        const result = await updateUser(user.id, { name, department, role });
        if (result.error) {
          setError(result.error);
          return;
        }
      }

      onRefresh();
      onClose();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "create" && (
        <>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
        </>
      )}
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">
          名前
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
        <label className="mb-1 block text-xs font-medium text-zinc-600">
          部署
        </label>
        <input
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">
          ロール
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="user">一般ユーザー</option>
          <option value="admin">管理者</option>
        </select>
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "保存中..." : "保存"}
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

export function UserDetailPanel({
  user,
  mode,
  onClose,
  onEdit,
  onRefresh,
}: {
  user: Profile | null;
  mode: "empty" | "view" | "create" | "edit";
  onClose: () => void;
  onEdit: () => void;
  onRefresh: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    if (!user || !confirm(`ユーザー「${user.name}」を削除しますか？`)) return;

    startTransition(async () => {
      const result = await deleteUser(user.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      onRefresh();
      onClose();
    });
  };

  if (mode === "empty") {
    return null;
  }

  if (mode === "view" && user) {
    return (
      <ModalShell
        title="ユーザー詳細"
        onClose={onClose}
        footer={
          <div className="flex gap-2 border-t border-zinc-200 p-4">
            <button
              type="button"
              onClick={onEdit}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              編集
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="flex-1 rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              削除
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs text-zinc-500">名前</p>
            <p className="text-lg font-semibold">{user.name}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">部署</p>
            <p className="text-sm">{user.department || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">ロール</p>
            <p className="text-sm">
              {user.role === "admin" ? "管理者" : "一般ユーザー"}
            </p>
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      title={mode === "create" ? "ユーザー作成" : "ユーザー編集"}
      onClose={onClose}
    >
      <UserForm
        key={`${mode}-${user?.id ?? "new"}`}
        user={user}
        mode={mode === "create" ? "create" : "edit"}
        onClose={onClose}
        onRefresh={onRefresh}
      />
    </ModalShell>
  );
}

export function AdminUsersClient({
  initialUsers,
  currentUser,
}: {
  initialUsers: Profile[];
  currentUser: Profile;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [panelMode, setPanelMode] = useState<
    "empty" | "view" | "create" | "edit"
  >("empty");

  const refreshUsers = async () => {
    const { fetchUsers } = await import("@/app/actions/users");
    const result = await fetchUsers();
    if (result.data) setUsers(result.data);
  };

  const selectUser = (user: Profile) => {
    setSelectedUser(user);
    setPanelMode("view");
  };

  const closePanel = () => {
    setPanelMode("empty");
    setSelectedUser(null);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-100">
      <aside className="flex h-full w-64 shrink-0 flex-col border-r border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 p-4">
          <Link href="/" className="block">
            <h1 className="text-lg font-bold text-zinc-900">会議室予約</h1>
            <p className="text-xs text-zinc-500">ユーザー管理</p>
          </Link>
        </div>

        <div className="mt-auto space-y-3 border-t border-zinc-200 p-4">
          <div>
            <p className="text-sm font-medium text-zinc-900">
              {currentUser.name}
            </p>
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

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
          <h2 className="text-lg font-semibold">ユーザー一覧</h2>
          <button
            type="button"
            onClick={() => {
              setSelectedUser(null);
              setPanelMode("create");
            }}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
          >
            新規ユーザー
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-white">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-white text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">名前</th>
                <th className="px-4 py-3 font-medium">部署</th>
                <th className="px-4 py-3 font-medium">ロール</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => selectUser(user)}
                  className={`cursor-pointer border-b border-zinc-100 hover:bg-blue-50/50 ${
                    selectedUser?.id === user.id ? "bg-blue-50" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-zinc-600">
                    {user.department || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        user.role === "admin"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {user.role === "admin" ? "管理者" : "一般"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <UserDetailPanel
        user={selectedUser}
        mode={panelMode}
        onClose={closePanel}
        onEdit={() => {
          if (selectedUser) {
            setPanelMode("edit");
          }
        }}
        onRefresh={refreshUsers}
      />
    </div>
  );
}
