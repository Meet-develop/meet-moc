"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <p className="text-sm text-[var(--muted)]">ログイン画面へ移動しています...</p>
    </div>
  );
}
