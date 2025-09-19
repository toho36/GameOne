"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { KindeUser } from "@/lib/kinde-auth";
import { logger } from "@/lib/logger";
import { getJson } from "@/lib/api/client";
export interface SessionData {
  user: KindeUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: string[];
  roles: string[];
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

export function SessionProvider({ children, initialSession }: SessionProviderProps) {
  const [sessionData, setSessionData] = useState<SessionData>({
    user: initialSession?.user ?? null,
    isAuthenticated: initialSession?.isAuthenticated ?? false,
    isLoading: initialSession?.isLoading ?? true,
    error: initialSession?.error ?? null,
    permissions: initialSession?.permissions ?? [],
    roles: (initialSession as any)?.roles ?? [],
    organization: initialSession?.organization ?? null,
  });

  const fetchSession = async (): Promise<void> => {
    try {
      setSessionData((prev) => ({ ...prev, isLoading: true, error: null }));

      const userData = await getJson<any>("/api/auth/me", {
        headers: { "Cache-Control": "no-cache" },
      });

      // Fetch additional session data in parallel
      const [permissionsRes, orgRes] = await Promise.allSettled([
        getJson<any>("/api/auth/permissions"),
        getJson<any>("/api/auth/organization"),
      ]);

      let permissions: string[] = [];
      const roles: string[] = Array.isArray(userData?.roles) ? userData.roles : [];
      let organization: { orgCode: string; orgName: string } | null = null;

      if (permissionsRes.status === "fulfilled") {
        const permData = permissionsRes.value;
        permissions = permData.permissions ?? [];
      }

      if (orgRes.status === "fulfilled") {
        const orgData = orgRes.value;
        organization = orgData.organization ?? null;
      }

      setSessionData({
        user: userData,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        permissions,
        roles,
        organization,
      });
    } catch (error: any) {
      logger.error("Session fetch error:", error);
      const status = error?.response?.status ?? error?.status;
      if (status === 401) {
        // Not authenticated is not an error state
        setSessionData({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          permissions: [],
          roles: [],
          organization: null,
        });
        return;
      }
      setSessionData({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to check authentication status",
        permissions: [],
        roles: [],
        organization: null,
      });
    }
  };

  const refresh = async (): Promise<void> => {
    // For server-side authentication, refresh the page to get updated session data
    window.location.reload();
  };

  const clearError = (): void => {
    setSessionData((prev) => ({ ...prev, error: null }));
  };

  // Initial session fetch (only if no initial data provided)
  useEffect(() => {
    // Only fetch if we don't have initial session data or if it's still loading
    if (!initialSession || initialSession.isLoading !== false) {
      fetchSession();
    } else {
      // Use the initial session data directly
      setSessionData(initialSession as SessionData);
    }
  }, [initialSession]);

  // Auto-refresh session at intervals (optional)
  // Note: Disabled for server-side authentication as it requires page refresh
  // useEffect(() => {
  //   if (!refreshInterval || refreshInterval <= 0) return;

  //   const intervalId = setInterval(() => {
  //     // Only refresh if user is authenticated and not currently loading
  //     if (sessionData.isAuthenticated && !sessionData.isLoading) {
  //       fetchSession();
  //     }
  //   }, refreshInterval);

  //   return () => clearInterval(intervalId);
  // }, [refreshInterval, sessionData.isAuthenticated, sessionData.isLoading]);

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
  // Note: For server-side authentication, we refresh the page instead of making API calls
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && sessionData.isAuthenticated) {
        // For server-side authentication, refresh the page to get updated session data
        window.location.reload();
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

  const hasRole = (role: string): boolean => session.roles.includes(role);
  const hasAnyRole = (roles: string[]): boolean => roles.some((r) => session.roles.includes(r));
  const hasAllRoles = (roles: string[]): boolean => roles.every((r) => session.roles.includes(r));

  return {
    permissions: session.permissions,
    roles: session.roles,
    organization: session.organization,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    hasAllRoles,
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
