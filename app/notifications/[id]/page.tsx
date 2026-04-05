"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { notificationTypeIcon } from "@/lib/notification-content";

type NotificationDetail = {
  id: string;
  type: string;
  title: string;
  body: string;
  eventId?: string | null;
  createdAt: string;
  readAt?: string | null;
  actionHref?: string;
  actionLabel?: string;
};

export default function NotificationDetailPage() {
  const params = useParams<{ id: string }>();
  const notificationId = useMemo(() => {
    const value = params?.id;
    return Array.isArray(value) ? value[0] : value;
  }, [params]);

  const [userId, setUserId] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUserId = data.session?.user?.id ?? null;
      setUserId(currentUserId);
      setIsLoading(false);
    };

    loadUser();
  }, []);

  useEffect(() => {
    const loadNotification = async () => {
      if (!notificationId || !userId) return;

      setIsLoading(true);
      setErrorMessage(null);

      const response = await fetch(
        `/api/notifications/${notificationId}?userId=${encodeURIComponent(userId)}&markAsRead=1`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        setErrorMessage(response.status === 404 ? "通知が見つかりませんでした。" : "通知の取得に失敗しました。");
        setIsLoading(false);
        return;
      }

      const data = (await response.json()) as NotificationDetail;
      setNotification(data);
      setIsLoading(false);
    };

    loadNotification();
  }, [notificationId, userId]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-4 sm:max-w-4xl sm:px-6">
          <Link
            href="/notifications"
            aria-label="通知一覧へ戻る"
            className="grid h-9 w-9 place-items-center rounded-full bg-white text-[var(--foreground)] shadow-sm"
          >
            <span className="material-symbols-rounded">chevron_left</span>
          </Link>
          <h1 className="text-lg font-semibold">通知詳細</h1>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-8 sm:max-w-4xl sm:px-6 sm:py-10">
        {userId && isLoading && (
          <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-[var(--muted)]">通知を読み込んでいます...</p>
          </div>
        )}

        {userId && !isLoading && errorMessage && (
          <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-[var(--muted)]">{errorMessage}</p>
          </div>
        )}

        {userId && !isLoading && notification && (
          <section className="space-y-4">
            <article className="px-1 py-2">
              <div className="mb-4 flex items-start gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[var(--accent)] shadow-sm">
                  <span className="material-symbols-rounded">
                    {notificationTypeIcon[notification.type] ?? "notifications"}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-[var(--foreground)]">{notification.title}</h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {new Date(notification.createdAt).toLocaleString("ja-JP")}
                  </p>
                </div>
              </div>

              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]">
                {notification.body}
              </p>
            </article>

            {notification.actionHref && notification.actionLabel && (
              <Link
                href={notification.actionHref}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
              >
                <span>{notification.actionLabel}</span>
                <span className="material-symbols-rounded text-base">open_in_new</span>
              </Link>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
