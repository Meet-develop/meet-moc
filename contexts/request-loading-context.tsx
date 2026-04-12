"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

const REQUEST_LOADING_OVERLAY_DELAY_MS = 1000;

type RequestLoadingContextValue = {
  pendingCount: number;
  isLoading: boolean;
  isOverlayVisible: boolean;
  trackPromise: <T>(promise: Promise<T>) => Promise<T>;
};

const RequestLoadingContext = createContext<RequestLoadingContextValue | null>(null);

export function RequestLoadingProvider({ children }: { children: ReactNode }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  const begin = useCallback(() => {
    setPendingCount((count) => count + 1);
  }, []);

  const end = useCallback(() => {
    setPendingCount((count) => Math.max(0, count - 1));
  }, []);

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args: Parameters<typeof fetch>) => {
      begin();
      try {
        return await originalFetch(...args);
      } finally {
        end();
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [begin, end]);

  useEffect(() => {
    if (pendingCount === 0) {
      setIsOverlayVisible(false);
      return;
    }

    const timerId = window.setTimeout(() => {
      setIsOverlayVisible(true);
    }, REQUEST_LOADING_OVERLAY_DELAY_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [pendingCount]);

  const trackPromise = useCallback(
    async <T,>(promise: Promise<T>): Promise<T> => {
      begin();
      try {
        return await promise;
      } finally {
        end();
      }
    },
    [begin, end]
  );

  const value = useMemo(
    () => ({
      pendingCount,
      isLoading: pendingCount > 0,
      isOverlayVisible,
      trackPromise,
    }),
    [isOverlayVisible, pendingCount, trackPromise]
  );

  return (
    <RequestLoadingContext.Provider value={value}>
      {children}
    </RequestLoadingContext.Provider>
  );
}

export function useRequestLoading() {
  const context = useContext(RequestLoadingContext);
  if (!context) {
    throw new Error("useRequestLoading must be used within RequestLoadingProvider");
  }
  return context;
}
