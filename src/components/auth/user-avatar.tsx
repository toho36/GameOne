"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: {
    id: string;
    email: string | null;
    given_name?: string | null;
    family_name?: string | null;
    picture?: string | null;
  };
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function UserAvatar({ user, size = "md", className }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: "size-8",
    md: "size-12",
    lg: "size-16",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  const getInitials = () => {
    if (
      user.given_name &&
      user.family_name &&
      user.given_name.length > 0 &&
      user.family_name.length > 0
    ) {
      return `${user.given_name[0]}${user.family_name[0]}`.toUpperCase();
    }
    if (user.given_name && user.given_name.length > 0) {
      return user.given_name[0]!.toUpperCase();
    }
    if (user.email && user.email.length > 0) {
      return user.email[0]!.toUpperCase();
    }
    return "U";
  };

  const shouldShowImage = user.picture && !imageError;

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg",
        sizeClasses[size],
        className
      )}
    >
      {shouldShowImage ? (
        <Image
          src={user.picture ?? ""}
          alt="User Avatar"
          width={size === "sm" ? 32 : size === "md" ? 48 : 64}
          height={size === "sm" ? 32 : size === "md" ? 48 : 64}
          className={cn("rounded-full object-cover", sizeClasses[size])}
          onError={() => setImageError(true)}
        />
      ) : (
        <span className={cn("font-semibold uppercase text-white", textSizes[size])}>
          {getInitials()}
        </span>
      )}
    </div>
  );
}
