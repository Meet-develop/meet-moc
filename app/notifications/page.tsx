"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type Notification = {
  id: string;
  type: string;
  message: string;
  eventId?: string | null;
  createdAt: string;
};

export default function NotificationsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUserId = data.session?.user?.id ?? null;
      setUserId(currentUserId);

      if (currentUserId) {
        const response = await fetch(`/api/notifications?userId=${currentUserId}`);
        if (response.ok) {
          const data = (await response.json()) as Notification[];
          setNotifications(data);
        }
      }
    };

    loadUser();
  }, []);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex max-w-md flex-col gap-2 px-4 py-4 sm:max-w-4xl sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link href="/" className="text-sm font-semibold text-[var(--muted)]">
            ← フィードに戻る
          </Link>
          <span className="text-xs text-[var(--muted)]">通知</span>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-8 sm:max-w-4xl sm:px-6 sm:py-10">
        {!userId && (
          <div className="mb-6 rounded-3xl bg-white/80 p-4 text-sm text-[var(--muted)] shadow-sm">
            通知を見るにはログインが必要です。
            <Link href="/onboarding" className="ml-2 text-[var(--accent)]">
              ログインはこちら
            </Link>
          </div>
        )}
        <h1 className="text-2xl font-semibold">通知</h1>
        <section className="mt-4 border-t border-orange-100 pt-4">
          {notifications.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted)]">通知はまだありません。</p>
          ) : (
            <ul className="mt-6 space-y-3">
              {notifications.map((notification) => (
                <li key={notification.id} className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold">{notification.message}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {new Date(notification.createdAt).toLocaleString("ja-JP")}
                  </p>
                  {notification.eventId && (
                    <Link
                      href={`/events/${notification.eventId}`}
                      className="mt-3 flex w-full items-center justify-center gap-1 rounded-full bg-orange-100 px-3 py-2 text-xs font-semibold text-[var(--accent)] sm:inline-flex sm:w-auto"
                    >
                      <span className="material-symbols-rounded">arrow_forward</span>
                      イベントを見る
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
