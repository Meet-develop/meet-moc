"use client";

import { useSearchParams } from "next/navigation";
import { AuthOverlay } from "@/components/features/auth/auth-overlay";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const returnToRaw = searchParams.get("returnTo");
  const authErrorRaw = searchParams.get("authError");
  const returnTo =
    returnToRaw && returnToRaw.startsWith("/") && !returnToRaw.startsWith("//")
      ? returnToRaw
      : null;
  const authError = authErrorRaw?.trim() ? authErrorRaw.trim() : null;

  return (
    <div className="min-h-screen bg-transparent">
      <AuthOverlay
        initialMode="login"
        returnTo={returnTo}
        initialMessage={authError}
      />
    </div>
  );
}
