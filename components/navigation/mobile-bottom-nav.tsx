"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

const hiddenPathPrefixes = ["/onboarding"];

export function MobileBottomNav() {
  const pathname = usePathname();

  if (hiddenPathPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-orange-200/80 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] pt-2 shadow-[0_-8px_22px_rgba(255,107,74,0.14)] backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md items-end justify-between gap-1">
        {navItems.map((item) => {
          const active = item.match(pathname);
          const baseClass = item.emphasize
            ? active
              ? "-mt-5 rounded-2xl bg-[var(--accent)] px-4 py-2 text-white shadow-lg shadow-orange-300"
              : "-mt-5 rounded-2xl bg-[var(--accent)]/90 px-4 py-2 text-white shadow-md shadow-orange-200"
            : active
              ? "rounded-xl bg-orange-100 px-3 py-2 text-[var(--accent)]"
              : "rounded-xl px-3 py-2 text-[var(--muted)]";

          return (
            <li key={item.href} className="flex-1">
              <Link href={item.href} className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${baseClass}`}>
                <span className="material-symbols-rounded text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
