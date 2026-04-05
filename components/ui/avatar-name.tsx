type AvatarNameProps = {
  displayName: string;
  avatarIcon?: string | null;
  size?: "sm" | "md";
  className?: string;
  textClassName?: string;
};

const avatarToneClasses = [
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-indigo-100 text-indigo-700",
  "bg-fuchsia-100 text-fuchsia-700",
];

export const isImageAvatar = (value?: string | null) => {
  if (!value) return false;
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:image/") ||
    value.startsWith("blob:") ||
    value.startsWith("/")
  );
};

export const getAvatarToneClass = (seed: string) => {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return avatarToneClasses[hash % avatarToneClasses.length];
};

export function AvatarName({
  displayName,
  avatarIcon,
  size = "sm",
  className = "",
  textClassName = "",
}: AvatarNameProps) {
  const avatarSize = size === "md" ? "h-10 w-10 text-lg" : "h-8 w-8 text-sm";
  const normalizedAvatarIcon = avatarIcon?.trim() ?? "";
  const useImage = isImageAvatar(normalizedAvatarIcon);
  const hasCustomIcon = !useImage && normalizedAvatarIcon.length > 0;
  const toneClass = getAvatarToneClass(displayName.trim() || "user");

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        aria-hidden="true"
        className={`grid place-items-center overflow-hidden rounded-full border border-orange-100 ${
          hasCustomIcon || useImage ? "bg-[#f7f4ef]/80" : toneClass
        } ${avatarSize}`}
      >
        {useImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={normalizedAvatarIcon}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : hasCustomIcon ? (
          normalizedAvatarIcon
        ) : (
          <span className="material-symbols-rounded">person</span>
        )}
      </span>
      <span className={textClassName}>{displayName}</span>
    </span>
  );
}
