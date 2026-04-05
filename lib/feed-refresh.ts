const FEED_REFRESH_KEY = "meet:feed:refresh";

export const markFeedRefreshNeeded = () => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(FEED_REFRESH_KEY, String(Date.now()));
};

export const consumeFeedRefreshNeeded = (maxAgeMs = 10 * 60 * 1000) => {
  if (typeof window === "undefined") return false;

  const raw = window.sessionStorage.getItem(FEED_REFRESH_KEY);
  if (!raw) return false;

  window.sessionStorage.removeItem(FEED_REFRESH_KEY);
  const at = Number(raw);
  if (!Number.isFinite(at)) return true;

  return Date.now() - at <= maxAgeMs;
};