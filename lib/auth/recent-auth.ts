export const RECENT_AUTH_MARKER_KEY = "meet:recent-auth-at";
export const RECENT_AUTH_GRACE_MS = 15_000;

const now = () => Date.now();

export const markRecentAuth = () => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(RECENT_AUTH_MARKER_KEY, String(now()));
};

export const clearRecentAuth = () => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(RECENT_AUTH_MARKER_KEY);
};

export const hasRecentAuth = () => {
  if (typeof window === "undefined") return false;

  const raw = window.sessionStorage.getItem(RECENT_AUTH_MARKER_KEY);
  if (!raw) return false;

  const at = Number(raw);
  if (!Number.isFinite(at)) {
    clearRecentAuth();
    return false;
  }

  const fresh = now() - at <= RECENT_AUTH_GRACE_MS;
  if (!fresh) {
    clearRecentAuth();
  }

  return fresh;
};