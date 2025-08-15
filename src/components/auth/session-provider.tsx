"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { KindeUser } from "@/lib/kinde-auth";

export interface SessionData {
  user: KindeUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: string[];
  organization: {
    orgCode: string;
    orgName: string;
  } | null;
}

interface SessionContextType extends SessionData {
  refresh: () => Promise<void>;
  clearError: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

interface SessionProviderProps {
  children: ReactNode;
  refreshInterval?: number; // Optional auto-refresh interval in ms
  initialSession?: Partial<SessionData>; // Initial server-side session data
}

export function SessionProvider({
  children,
  refreshInterval = 5 * 60 * 1000, // Default: 5 minutes
  initialSession,
}: SessionProviderProps) {
  const [sessionData, setSessionData] = useState<SessionData>({
    user: initialSession?.user ?? null,
    isAuthenticated: initialSession?.isAuthenticated ?? false,
    isLoading: initialSession?.isLoading ?? true,
    error: initialSession?.error ?? null,
    permissions: initialSession?.permissions ?? [],
    organization: initialSession?.organization ?? null,
  });

  const fetchSession = async (): Promise<void> => {
    try {
      setSessionData((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (response.ok) {
        const userData = await response.json();

        // Fetch additional session data in parallel
        const [permissionsRes, orgRes] = await Promise.allSettled([
          fetch("/api/auth/permissions"),
          fetch("/api/auth/organization"),
        ]);

        let permissions: string[] = [];
        let organization = null;

        if (permissionsRes.status === "fulfilled" && permissionsRes.value.ok) {
          const permData = await permissionsRes.value.json();
          permissions = permData.permissions ?? [];
        }

        if (orgRes.status === "fulfilled" && orgRes.value.ok) {
          const orgData = await orgRes.value.json();
          organization = orgData.organization ?? null;
        }

        setSessionData({
          user: userData,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          permissions,
          organization,
        });
      } else if (response.status === 401) {
        // User is not authenticated
        setSessionData({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          permissions: [],
          organization: null,
        });
      } else {
        throw new Error(`Authentication check failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Session fetch error:", error);
      setSessionData({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to check authentication status",
        permissions: [],
        organization: null,
      });
    }
  };

  const refresh = async (): Promise<void> => {
    await fetchSession();
  };

  const clearError = (): void => {
    setSessionData((prev) => ({ ...prev, error: null }));
  };

  // Initial session fetch (only if no initial data provided)
  useEffect(() => {
    if (!initialSession || initialSession.isLoading !== false) {
      fetchSession();
    }
  }, [initialSession]);

  // Auto-refresh session at intervals (optional)
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      // Only refresh if user is authenticated and not currently loading
      if (sessionData.isAuthenticated && !sessionData.isLoading) {
        fetchSession();
      }
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, sessionData.isAuthenticated, sessionData.isLoading]);

  // Listen for auth state changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "kinde-auth-state-change") {
        fetchSession();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Listen for visibility changes to refresh session when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && sessionData.isAuthenticated) {
        fetchSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [sessionData.isAuthenticated]);

  const contextValue: SessionContextType = {
    ...sessionData,
    refresh,
    clearError,
  };

  return <SessionContext.Provider value={contextValue}>{children}</SessionContext.Provider>;
}

// Custom hook to use the session context
export function useSession(): SessionContextType {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }

  return context;
}

// Hook for conditional authentication
export function useAuth() {
  const session = useSession();

  return {
    user: session.user,
    isAuthenticated: session.isAuthenticated,
    isLoading: session.isLoading,
    error: session.error,
    refresh: session.refresh,
    clearError: session.clearError,
  };
}

// Hook for authorization checks
export function useAuthorization() {
  const session = useSession();

  const hasPermission = (permission: string): boolean => {
    return session.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some((permission) => session.permissions.includes(permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every((permission) => session.permissions.includes(permission));
  };

  return {
    permissions: session.permissions,
    organization: session.organization,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAuthenticated: session.isAuthenticated,
  };
}

// Higher-order component for route protection
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string;
    requirePermissions?: string[];
    fallback?: React.ComponentType;
  }
) {
  const AuthenticatedComponent = (props: P) => {
    const { isAuthenticated, hasAllPermissions } = useAuthorization();
    const { isLoading } = useSession();

    if (isLoading) {
      return options?.fallback ? <options.fallback /> : <div>Loading...</div>;
    }

    if (!isAuthenticated) {
      if (options?.redirectTo) {
        // Note: This would typically use Next.js router for redirection
        window.location.href = options.redirectTo;
        return null;
      }
      return options?.fallback ? <options.fallback /> : <div>Access denied</div>;
    }

    if (options?.requirePermissions && !hasAllPermissions(options.requirePermissions)) {
      return options?.fallback ? <options.fallback /> : <div>Insufficient permissions</div>;
    }

    return <Component {...props} />;
  };

  AuthenticatedComponent.displayName = `withAuth(${Component.displayName ?? Component.name})`;
  return AuthenticatedComponent;
}
