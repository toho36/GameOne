 
export enum RoleName {
  ADMIN = "ADMIN",
  MODERATOR = "MODERATOR",
  EVENT_MANAGER = "EVENT_MANAGER",
  USER = "USER",
}

export const ADMIN_ONLY_ROUTES = ["/users", "/bank-accounts"] as const;
export const EVENT_MANAGEMENT_ROUTES = ["/manage-events"] as const;
