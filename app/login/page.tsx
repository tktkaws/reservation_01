"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ModalShell } from "@/components/ui/ModalShell";
import { createClient } from "@/lib/supabase/client";
import { SAMPLE_USER_PASSWORD, SAMPLE_USERS } from "@/lib/sample-users";

type LoginStep = "choice" | "form";

const NON_ADMIN_SAMPLE_USERS = SAMPLE_USERS.filter(
  (user) => user.role !== "admin"
);

function pickRandomSampleUser() {
  const index = Math.floor(Math.random() * NON_ADMIN_SAMPLE_USERS.length);
  return NON_ADMIN_SAMPLE_USERS[index];
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>("choice");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const loginWithCredentials = async (email: string, password: string) => {
    setError(null);
    setIsPending(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setIsPending(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    await loginWithCredentials(email, password);
  };

  const handleTestUserLogin = async () => {
    const user = pickRandomSampleUser();
    await loginWithCredentials(user.email, SAMPLE_USER_PASSWORD);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-zinc-900">ログイン</h1>
        <p className="mb-6 text-sm text-zinc-500">会議室予約システム</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              メールアドレス
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              パスワード
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          {error && step === "form" && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending && step === "form" ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          アカウントをお持ちでない方は{" "}
          <Link href="/signup" className="text-blue-600 hover:underline">
            新規登録
          </Link>
        </p>
        <p className="mt-2 text-center">
          <Link href="/" className="text-sm text-zinc-500 hover:underline">
            トップに戻る
          </Link>
        </p>
        <p className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep("choice");
            }}
            className="text-sm text-zinc-500 hover:underline"
          >
            テストユーザーでログイン
          </button>
        </p>
      </div>

      {step === "choice" && (
        <ModalShell
          title="ログイン方法の選択"
          onClose={() => {
            if (!isPending) setStep("form");
          }}
        >
          <p className="mb-4 text-sm text-zinc-600">
            テスト用アカウントで素早くログインするか、通常どおりメールアドレスとパスワードを入力するか選んでください。
          </p>
          {error && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={handleTestUserLogin}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending
                ? "ログイン中..."
                : "テストユーザーとしてログイン"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setStep("form")}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              通常ログイン
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
