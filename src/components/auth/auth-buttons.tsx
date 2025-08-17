"use client";

import { LoginLink, RegisterLink, LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { useAuth } from "./session-provider";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  getButtonClasses,
  getLoadingButtonClasses,
  getButtonContainerClasses,
} from "@/lib/utils/button-variants";

interface AuthButtonsProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  layout?: "horizontal" | "vertical";
  showIcons?: boolean;
  showLogout?: boolean; // Whether to show logout button when authenticated
}

export function AuthButtons({
  className,
  variant = "default",
  size = "md",
  layout = "horizontal",
  showIcons = true,
  showLogout = false,
}: AuthButtonsProps) {
  const { isAuthenticated, isLoading } = useAuth();

  const buttonClasses = getButtonClasses({ variant, size, className });
  const containerClasses = getButtonContainerClasses(layout);

  if (isLoading) {
    return (
      <div className={containerClasses}>
        <div className={getLoadingButtonClasses({ variant, size, className })}>
          <LoadingSpinner size="sm" className="mr-2" />
          Loading...
        </div>
      </div>
    );
  }

  // If user is authenticated, optionally show logout button
  if (isAuthenticated) {
    if (!showLogout) {
      return null; // Don't show auth buttons if user is already authenticated
    }

    return (
      <div className={containerClasses}>
        <LogoutLink className={buttonClasses}>
          {showIcons && (
            <svg className="mr-2 size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          )}
          Sign Out
        </LogoutLink>
      </div>
    );
  }

  // Show sign in and register buttons for unauthenticated users
  return (
    <div className={containerClasses}>
      <LoginLink className={buttonClasses}>
        {showIcons && (
          <svg className="mr-2 size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
            />
          </svg>
        )}
        Sign In
      </LoginLink>

      <RegisterLink className={buttonClasses}>
        {showIcons && (
          <svg className="mr-2 size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
        )}
        Sign Up
      </RegisterLink>
    </div>
  );
}

export function LoginButton({
  className,
  variant = "default",
  size = "md",
  showIcon = true,
}: {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  const buttonClasses = getButtonClasses({ variant, size, className });

  if (isLoading) {
    return (
      <div className={getLoadingButtonClasses({ variant, size, className })}>
        <LoadingSpinner size="sm" className="mr-2" />
        Loading...
      </div>
    );
  }

  // Don't show login button if user is already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <LoginLink className={buttonClasses}>
      {showIcon && (
        <svg className="mr-2 size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
          />
        </svg>
      )}
      Sign In
    </LoginLink>
  );
}

export function RegisterButton({
  className,
  variant = "default",
  size = "md",
  showIcon = true,
}: {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  const buttonClasses = getButtonClasses({ variant, size, className });

  if (isLoading) {
    return (
      <div className={getLoadingButtonClasses({ variant, size, className })}>
        <LoadingSpinner size="sm" className="mr-2" />
        Loading...
      </div>
    );
  }

  // Don't show register button if user is already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <RegisterLink className={buttonClasses}>
      {showIcon && (
        <svg className="mr-2 size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
          />
        </svg>
      )}
      Sign Up
    </RegisterLink>
  );
}

export function LogoutButton({
  className,
  variant = "default",
  size = "md",
  showIcon = true,
}: {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  const buttonClasses = getButtonClasses({ variant, size, className });

  if (isLoading) {
    return (
      <div className={getLoadingButtonClasses({ variant, size, className })}>
        <LoadingSpinner size="sm" className="mr-2" />
        Loading...
      </div>
    );
  }

  // Don't show logout button if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <LogoutLink className={buttonClasses}>
      {showIcon && (
        <svg className="mr-2 size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      )}
      Log Out
    </LogoutLink>
  );
}
