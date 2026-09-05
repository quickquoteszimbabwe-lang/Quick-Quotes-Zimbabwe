import { useState } from "react";
import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg";

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

function getInitials(name?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) || "QQ").toUpperCase();
}

export function UserAvatar({
  name,
  photoUrl,
  size = "md",
  className,
  brandFallback = false,
}: {
  name?: string | null;
  photoUrl?: string | null;
  size?: AvatarSize;
  className?: string;
  brandFallback?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showPhoto = Boolean(photoUrl) && !imageFailed;

  return (
    <div className={cn(
      "shrink-0 overflow-hidden rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center",
      sizeClasses[size],
      className,
    )}>
      {showPhoto ? (
        <img
          src={photoUrl ?? ""}
          alt={name ? `${name} avatar` : "Profile avatar"}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : brandFallback && !name ? (
        <img src="/pwa-icon.svg" alt="QQZ" className="h-3/5 w-3/5" />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}