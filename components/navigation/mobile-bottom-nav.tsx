"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  match: (pathname: string) => boolean;
  emphasize?: boolean;
};

const navItems: NavItem[] = [
  {
    href: "/",
    label: "フィード",
    icon: "home",
    match: (pathname) => pathname === "/",
  },
  {
    href: "/notifications",
    label: "通知",
    icon: "notifications",
    match: (pathname) => pathname.startsWith("/notifications") || pathname.startsWith("/invites"),
  },
  {
    href: "/events/new",
    label: "作成",
    icon: "add_circle",
    match: (pathname) => pathname === "/events/new",
    emphasize: true,
  },
  {
    href: "/friends",
    label: "フレンド",
    icon: "group",
    match: (pathname) => pathname.startsWith("/friends"),
  },
  {
    href: "/profile/setup",
    label: "プロフィール",
    icon: "person",
    match: (pathname) => pathname.startsWith("/profile"),
  },
];

const hiddenPathPrefixes = ["/onboarding", "/login", "/signup"];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const [profileCompletionRate, setProfileCompletionRate] = useState<number>(100);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setUserId(data.session?.user?.id ?? null);
      setIsSessionChecked(true);
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.id) {
        setUserId(session.user.id);
        setIsSessionChecked(true);
        return;
      }

      // Guard against transient null sessions on slower mobile browsers.
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setUserId(data.session?.user?.id ?? null);
      setIsSessionChecked(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    let active = true;

    const loadProfile = async () => {
      const response = await fetch(
        `/api/profiles/${userId}?viewerId=${encodeURIComponent(userId)}`,
        { cache: "no-store" }
      );
      if (!active) return;

      if (!response.ok) {
        setProfileCompletionRate(0);
        return;
      }

      const profile = (await response.json()) as { stats?: { completionRate?: number } };
      setProfileCompletionRate(profile.stats?.completionRate ?? 0);
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, [userId]);

  const canCreateEvent = userId == null || profileCompletionRate >= 100;

  if (hiddenPathPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  if (!isSessionChecked || !userId) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-orange-200/80 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] pt-2 shadow-[0_-8px_22px_rgba(255,107,74,0.14)] backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md items-end justify-between gap-0.5">
        {navItems.map((item) => {
          const active = item.match(pathname);
          const isCreateItem = item.href === "/events/new";
          const isDisabled = isCreateItem && userId != null && !canCreateEvent;
          const baseClass = item.emphasize
            ? active
              ? "-mt-5 rounded-2xl bg-[var(--accent)] px-3 py-2 text-white shadow-lg shadow-orange-300"
              : "-mt-5 rounded-2xl bg-[var(--accent)]/90 px-3 py-2 text-white shadow-md shadow-orange-200"
            : active
              ? "rounded-xl bg-orange-100 px-2 py-2 text-[var(--accent)]"
              : "rounded-xl px-2 py-2 text-[var(--muted)]";

          const disabledClass = isDisabled
            ? "cursor-not-allowed opacity-40"
            : "";

          return (
            <li key={item.href} className="flex-1">
              {isDisabled ? (
                <button
                  type="button"
                  disabled
                  title="プロフィール設定が100%になるとイベントを作成できます。"
                  className={`flex w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold ${baseClass} ${disabledClass}`}
                >
                  <span className="material-symbols-rounded text-[20px]">{item.icon}</span>
                  <span className="whitespace-nowrap leading-none">{item.label}</span>
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${baseClass}`}
                >
                  <span className="material-symbols-rounded text-[20px]">{item.icon}</span>
                  <span className="whitespace-nowrap leading-none">{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
