// Authentication Components
export {
  SessionProvider,
  useSession,
  useAuth,
  useAuthorization,
  withAuth,
} from "./session-provider";
export { AuthButtons, LoginButton, RegisterButton, LogoutButton } from "./auth-buttons";
export { UserProfile } from "./user-profile";
export { UserAvatar } from "./user-avatar";
export { AuthStatus, AuthStatusBadge } from "./auth-status";
export { AuthGuard, useAuthGuard, withAuthGuard, ConditionalAuth } from "./auth-guard";

// Re-export types if needed
export type { SessionData } from "./session-provider";
