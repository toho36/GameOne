// Re-export all event-related types
export * from "./event-creation.types";
export * from "./event-management.types";

// Re-export Prisma enums for convenience
export { EventType, EventStatus } from "@prisma/client";

// Common event utilities and constants
export const EVENT_STATUS_COLORS = {
  DRAFT: "yellow",
  PUBLISHED: "green",
  CANCELLED: "red",
  COMPLETED: "blue",
  POSTPONED: "orange",
} as const;

export const EVENT_TYPE_ICONS = {
  WORKSHOP: "🔧",
  SEMINAR: "🎓",
  CONFERENCE: "🏢",
  MEETUP: "👥",
  TRAINING: "📚",
  SOCIAL: "🎉",
  OTHER: "📌",
} as const;
