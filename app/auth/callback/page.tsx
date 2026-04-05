"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { decidePostAuthRedirect } from "@/lib/auth/post-auth-redirect";

type ProfileStats = {
  completionRate?: number;
};

type ProfileResponse = {
  stats?: ProfileStats;
};

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const resolveRedirect = async () => {
      const callbackUrl = new URL(window.location.href);
      const code = callbackUrl.searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("Supabase auth callback error:", error);
          if (active) {
            router.replace("/onboarding");
          }
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        if (active) {
          router.replace(decidePostAuthRedirect({ hasSessionUserId: false, profileRequestOk: false }));
        }
        return;
      }

      const response = await fetch(`/api/profiles/${session.user.id}`, {
        cache: "no-store",
      });

      if (!active) {
        return;
      }

      if (!response.ok) {
        router.replace(
          decidePostAuthRedirect({ hasSessionUserId: true, profileRequestOk: false })
        );
        return;
      }

      const profile = (await response.json()) as ProfileResponse;
      const redirectPath = decidePostAuthRedirect({
        hasSessionUserId: true,
        profileRequestOk: true,
        completionRate: profile.stats?.completionRate ?? 0,
      });
      router.replace(redirectPath);
    };

    void resolveRedirect();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-sm rounded-3xl border border-orange-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-100 border-t-[var(--accent)]" />
        <p className="mt-4 text-sm text-[var(--muted)]">認証情報を確認しています...</p>
      </div>
    </div>
  );
}
