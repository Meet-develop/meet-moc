"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthOverlay } from "@/components/features/auth/auth-overlay";

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-transparent" />}>
      <SignUpPageContent />
    </Suspense>
  );
}

function SignUpPageContent() {
  const searchParams = useSearchParams();
  const returnToRaw = searchParams.get("returnTo");
  const returnTo =
    returnToRaw && returnToRaw.startsWith("/") && !returnToRaw.startsWith("//")
      ? returnToRaw
      : null;

  return (
    <div className="min-h-screen bg-transparent">
      <AuthOverlay initialMode="signup" returnTo={returnTo} />
    </div>
  );
}
