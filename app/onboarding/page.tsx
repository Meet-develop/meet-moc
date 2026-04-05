"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessionUser, setSessionUser] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSessionUser(data.session?.user?.email ?? null);
      if (data.session?.user?.id) {
        router.replace("/auth/callback");
      }
    };
    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user?.email ?? null);
      if (session?.user?.id) {
        router.replace("/auth/callback");
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  const handleSignIn = async () => {
    setMessage(null);
    if (!email || !password) {
      setMessage("メールとパスワードを入力してください。");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("Supabase sign-in error:", error);
      setMessage(`ログインに失敗しました: ${error.message}`);
      return;
    }

    router.replace("/auth/callback");
  };

  const handleSignUp = async () => {
    setMessage(null);
    if (!email || !password) {
      setMessage("メールとパスワードを入力してください。");
      return;
    }
    if (password.length < 6) {
      setMessage("パスワードは6文字以上で入力してください。");
      return;
    }
    const emailRedirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
      },
    });
    if (error) {
      console.error("Supabase sign-up error:", error);
      setMessage(`登録に失敗しました: ${error.message}`);
    } else {
      setMessage("登録完了。ログインしてください。確認メールが必要な場合は受信箱をご確認ください。");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-4 sm:max-w-4xl sm:px-6">
          <Link
            href="/"
            aria-label="フィードへ戻る"
            className="grid h-9 w-9 place-items-center rounded-full bg-white text-[var(--foreground)] shadow-sm"
          >
            <span className="material-symbols-rounded">chevron_left</span>
          </Link>
          <h1 className="text-lg font-semibold">オンボーディング</h1>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-10 sm:max-w-4xl sm:px-6 sm:py-12">
        <h1 className="text-3xl font-semibold">アカウント作成 / ログイン</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          テスト環境ではメールアドレスとパスワードでログインします。
        </p>
        {!hasSupabaseConfig && (
          <p className="mt-3 text-xs text-[var(--accent)]">
            Supabase の環境変数が未設定です。`.env` を確認してください。
          </p>
        )}

        {sessionUser ? (
          <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700 shadow-sm">
            <p>ログイン中: {sessionUser}</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/profile/setup"
                className="flex w-full items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white sm:w-auto"
              >
                プロフィール設定へ
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full rounded-full bg-white px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm sm:w-auto"
              >
                ログアウト
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              メールアドレス
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-2xl border border-orange-200 bg-white px-4 py-3"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              パスワード
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-2xl border border-orange-200 bg-white px-4 py-3"
              />
            </label>
            <button
              onClick={handleSignIn}
              className="flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white"
            >
              <span className="material-symbols-rounded">login</span>
              ログイン
            </button>
            <button
              onClick={handleSignUp}
              className="flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--foreground)] shadow-sm"
            >
              <span className="material-symbols-rounded">person_add</span>
              新規登録
            </button>
          </div>
        )}

        {message && (
          <p className="mt-4 text-sm text-[var(--accent)]">{message}</p>
        )}

        <p className="mt-6 text-xs text-[var(--muted)]">
          Supabase の URL と Anon Key は .env に設定してください。
        </p>
      </main>
    </div>
  );
}
