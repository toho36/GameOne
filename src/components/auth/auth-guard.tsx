"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSession, useAuthorization } from "./session-provider";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AuthButtons } from "./auth-buttons";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface AuthGuardProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    redirectTo?: string;
    requirePermissions?: string[];
    requireAllPermissions?: boolean; // true = require ALL permissions, false = require ANY permission
    showFallback?: boolean;
}

/**
 * AuthGuard component that protects child components based on authentication status
 * and optionally required permissions.
 */
export function AuthGuard({
    children,
    fallback,
    redirectTo,
    requirePermissions = [],
    requireAllPermissions = true,
    showFallback = true
}: AuthGuardProps) {
    const router = useRouter();
    const { isAuthenticated, isLoading, error } = useSession();
    const { hasPermission, hasAllPermissions, hasAnyPermission } = useAuthorization();

    // Show loading state
    if (isLoading) {
        return fallback || (
            <div className="flex items-center justify-center p-8">
                <div className="flex flex-col items-center gap-4">
                    <LoadingSpinner size="lg" />
                    <p className="text-sm text-gray-600">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return fallback || (
            <Alert variant="destructive" className="m-4">
                <AlertTitle>Authentication Error</AlertTitle>
                <AlertDescription>
                    {error}. Please try refreshing the page or contact support if the problem persists.
                </AlertDescription>
            </Alert>
        );
    }

    // Handle unauthenticated users
    if (!isAuthenticated) {
        if (redirectTo) {
            // Redirect to specified URL
            router.push(redirectTo);
            return null;
        }

        if (!showFallback) {
            return null;
        }

        return fallback || (
            <div className="flex flex-col items-center justify-center space-y-4 p-8">
                <Alert variant="default" className="max-w-md border-amber-200 bg-amber-50">
                    <AlertTitle className="text-amber-800">Authentication Required</AlertTitle>
                    <AlertDescription className="text-amber-700">
                        You need to be signed in to access this content.
                    </AlertDescription>
                </Alert>
                <AuthButtons variant="default" size="md" />
            </div>
        );
    }

    // Check permissions if required
    if (requirePermissions.length > 0) {
        const hasRequiredPermissions = requireAllPermissions
            ? hasAllPermissions(requirePermissions)
            : hasAnyPermission(requirePermissions);

        if (!hasRequiredPermissions) {
            if (!showFallback) {
                return null;
            }

            return fallback || (
                <Alert variant="destructive" className="m-4">
                    <AlertTitle>Insufficient Permissions</AlertTitle>
                    <AlertDescription>
                        You don't have the required permissions to access this content.
                        Required permissions: {requirePermissions.join(", ")}
                    </AlertDescription>
                </Alert>
            );
        }
    }

    // User is authenticated and has required permissions
    return <>{children}</>;
}

/**
 * Hook for conditional rendering based on authentication status
 */
export function useAuthGuard() {
    const { isAuthenticated, isLoading } = useSession();
    const { hasPermission, hasAllPermissions, hasAnyPermission } = useAuthorization();

    const canAccess = (options?: {
        requirePermissions?: string[];
        requireAllPermissions?: boolean;
    }) => {
        if (!isAuthenticated) return false;

        if (options?.requirePermissions?.length) {
            return options.requireAllPermissions !== false
                ? hasAllPermissions(options.requirePermissions)
                : hasAnyPermission(options.requirePermissions);
        }

        return true;
    };

    return {
        isAuthenticated,
        isLoading,
        canAccess,
        hasPermission,
        hasAllPermissions,
        hasAnyPermission,
    };
}

/**
 * Higher-order component version of AuthGuard
 */
export function withAuthGuard<P extends object>(
    Component: React.ComponentType<P>,
    guardOptions?: Omit<AuthGuardProps, 'children'>
) {
    const AuthGuardedComponent = (props: P) => {
        return (
            <AuthGuard {...guardOptions}>
                <Component {...props} />
            </AuthGuard>
        );
    };

    AuthGuardedComponent.displayName = `withAuthGuard(${Component.displayName || Component.name})`;
    return AuthGuardedComponent;
}

/**
 * Component for conditional rendering based on authentication
 */
interface ConditionalAuthProps {
    authenticated?: React.ReactNode;
    unauthenticated?: React.ReactNode;
    loading?: React.ReactNode;
    error?: React.ReactNode;
}

export function ConditionalAuth({
    authenticated,
    unauthenticated,
    loading,
    error: errorComponent
}: ConditionalAuthProps) {
    const { isAuthenticated, isLoading, error } = useSession();

    if (isLoading) {
        return loading || (
            <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span className="text-sm text-gray-600">Loading...</span>
            </div>
        );
    }

    if (error) {
        return errorComponent || (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (isAuthenticated) {
        return authenticated || null;
    }

    return unauthenticated || null;
}