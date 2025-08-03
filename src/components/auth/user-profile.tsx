"use client";

import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { cn } from "@/lib/utils";
import { AuthButtons } from "./auth-buttons";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { UserAvatar } from "./user-avatar";
import { useSession } from "./session-provider";

interface UserProfileProps {
    className?: string;
    showAvatar?: boolean;
    showEmail?: boolean;
    variant?: "default" | "compact";
    showLogoutText?: boolean;
}

export function UserProfile({
    className,
    showAvatar = true,
    showEmail = true,
    variant = "default",
    showLogoutText = true
}: UserProfileProps) {
    const { user, isAuthenticated, isLoading, error } = useSession();

    if (isLoading) {
        return (
            <div className={cn("flex items-center gap-2", className)}>
                <LoadingSpinner size="sm" />
                <span className="text-sm text-gray-500">Loading...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cn("flex items-center gap-2", className)}>
                <span className="text-sm text-red-500">Error loading profile</span>
                <AuthButtons variant="outline" size="sm" layout="horizontal" />
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <div className={className}>
                <AuthButtons variant="outline" size="sm" layout="horizontal" />
            </div>
        );
    }

    const displayName = user.given_name && user.family_name
        ? `${user.given_name} ${user.family_name}`
        : user.given_name ?? user.family_name ?? "User";

    return (
        <div className={cn("flex items-center gap-3", className)}>
            {/* User Avatar */}
            {showAvatar && (
                <UserAvatar
                    user={user}
                    size="sm"
                />
            )}

            {/* User Info */}
            {variant === "default" && (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                        {displayName}
                    </span>
                    {showEmail && user.email && (
                        <span className="text-xs text-gray-500">
                            {user.email}
                        </span>
                    )}
                </div>
            )}

            {/* Logout Button */}
            <LogoutLink
                className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"

            >
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {variant === "default" && showLogoutText ? "Sign out" : ""}
            </LogoutLink>
        </div>
    );
}

