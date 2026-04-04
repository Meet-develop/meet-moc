type AvatarNameProps = {
  displayName: string;
  avatarIcon?: string | null;
  size?: "sm" | "md";
  className?: string;
  textClassName?: string;
};

export function AvatarName({
  displayName,
  avatarIcon,
  size = "sm",
  className = "",
  textClassName = "",
}: AvatarNameProps) {
  const avatarSize = size === "md" ? "h-10 w-10 text-lg" : "h-8 w-8 text-sm";
  const fallback = displayName.trim().charAt(0) || "?";

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        aria-hidden="true"
        className={`grid place-items-center rounded-full bg-white shadow-sm ${avatarSize}`}
      >
        {avatarIcon ?? fallback}
      </span>
      <span className={textClassName}>{displayName}</span>
    </span>
  );
}
