"use client";

import { useEffect, useMemo, useState } from "react";
import { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { clearRecentAuth, hasRecentAuth } from "@/lib/auth/recent-auth";

const isEventDetailPath = (pathname: string) => /^\/events\/[^/]+\/?$/.test(pathname);

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  const isPublicPath = useMemo(() => {
    if (pathname === "/") return true;
    if (pathname.startsWith("/login")) return true;
    if (pathname.startsWith("/signup")) return true;
    if (pathname.startsWith("/onboarding")) return true;
    if (pathname.startsWith("/auth/callback")) return true;
    return isEventDetailPath(pathname);
  }, [pathname]);

  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setIsAuthenticated(Boolean(data.session));
      setIsAuthChecked(true);
    };

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
      setIsAuthChecked(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isAuthChecked || isPublicPath || isAuthenticated) return;
    if (!hasRecentAuth()) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    const timerId = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      if (data.session) {
        setIsAuthenticated(true);
        clearRecentAuth();
        return;
      }

      clearRecentAuth();
      router.replace("/login");
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [isAuthChecked, isAuthenticated, isPublicPath, router]);

  useEffect(() => {
    if (isAuthenticated) {
      clearRecentAuth();
    }
  }, [isAuthenticated]);

  if (!isPublicPath && (!isAuthChecked || !isAuthenticated)) {
    return null;
  }

  return <>{children}</>;
}
