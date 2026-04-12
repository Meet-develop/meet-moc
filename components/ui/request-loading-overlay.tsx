"use client";

type RequestLoadingOverlayProps = {
  visible: boolean;
  label?: string;
};

export function RequestLoadingOverlay({
  visible,
  label = "処理中...",
}: RequestLoadingOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/35 backdrop-blur-sm">
      <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-xl">
        <span
          aria-hidden="true"
          className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent"
        />
        <p className="text-sm font-semibold text-[var(--foreground)]">{label}</p>
      </div>
    </div>
  );
}
