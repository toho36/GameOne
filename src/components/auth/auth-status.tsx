"use client";

import { cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useSession } from "./session-provider";

interface AuthStatusProps {
  className?: string;
  showDetails?: boolean;
  showPermissions?: boolean;
  showOrganization?: boolean;
}

export function AuthStatus({
  className,
  showDetails = false,
  showPermissions = false,
  showOrganization = false,
}: AuthStatusProps) {
  const { user, isAuthenticated, isLoading, error, permissions, organization } = useSession();

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <LoadingSpinner size="sm" />
        <span className="text-sm text-gray-600">Checking authentication...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error" {...(className && { className })}>
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!isAuthenticated) {
    return (
      <Alert variant="default" className={cn("border-amber-200 bg-amber-50", className)}>
        <AlertTitle className="text-amber-800">Not Authenticated</AlertTitle>
        <AlertDescription className="text-amber-700">
          You are not currently logged in. Please sign in to access protected features.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="default" className={cn("border-green-200 bg-green-50", className)}>
      <AlertTitle className="text-green-800">Authenticated</AlertTitle>
      <AlertDescription className="text-green-700">
        You are successfully logged in.
        {showDetails && user && (
          <div className="mt-3 space-y-1 text-xs">
            <p>
              <strong>Name:</strong> {user.given_name} {user.family_name}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>User ID:</strong> {user.id}
            </p>
          </div>
        )}
        {showOrganization && organization && (
          <div className="mt-3 space-y-1 text-xs">
            <p>
              <strong>Organization:</strong> {organization.orgName}
            </p>
            <p>
              <strong>Org Code:</strong> {organization.orgCode}
            </p>
          </div>
        )}
        {showPermissions && permissions.length > 0 && (
          <div className="mt-3 text-xs">
            <p>
              <strong>Permissions:</strong>
            </p>
            <ul className="mt-1 list-inside list-disc space-y-1">
              {permissions.map((permission) => (
                <li key={permission} className="text-xs">
                  {permission}
                </li>
              ))}
            </ul>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

export function AuthStatusBadge({ className }: { className?: string }) {
  const { isAuthenticated, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <div className="size-2 animate-pulse rounded-full bg-gray-400" />
        <span className="text-xs text-gray-500">Checking...</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className={cn("size-2 rounded-full", isAuthenticated ? "bg-green-500" : "bg-red-500")} />
      <span className="text-xs text-gray-500">
        {isAuthenticated ? "Authenticated" : "Not authenticated"}
      </span>
    </div>
  );
}
