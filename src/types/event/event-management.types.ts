 
import type { Event, EventStatus, EventType, User } from "@prisma/client";

// Event with related data for listing/management
export interface EventWithDetails extends Event {
  creator: Pick<User, "id" | "name" | "email">;
  manager?: Pick<User, "id" | "name" | "email">;
  _count: {
    registrations: number;
    waitingList: number;
    pendingPayments: number;
  };
  registrations?: RegistrationSummary[];
}

// Event list item for dashboard
export interface EventListItem {
  id: string;
  title: string;
  slug: string;
  type: EventType;
  status: EventStatus;
  startDate: Date;
  endDate?: Date;
  capacity: number;
  price?: number;
  currency: string;
  venue?: string;
  city?: string;
  isOnline: boolean;

  // Calculated fields
  registrationCount: number;
  waitingListCount: number;
  availableSpots: number;
  isRegistrationOpen: boolean;
  isPastEvent: boolean;

  // Creator info
  creatorName: string;
  createdAt: Date;
  updatedAt: Date;
}

// Registration summary for event management
export interface RegistrationSummary {
  id: string;
  userId?: string;
  status: string;
  paymentStatus: string;
  registeredAt: Date;
  guestName?: string;
  guestEmail?: string;
  isGroupLeader: boolean;
  groupSize: number;
}

// Event capacity info
export interface EventCapacityInfo {
  total: number;
  confirmed: number;
  pending: number;
  waitingList: number;
  available: number;
  percentageFull: number;
}

// Event statistics
export interface EventStatistics {
  totalEvents: number;
  publishedEvents: number;
  draftEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  totalRegistrations: number;
  totalRevenue: number;
  averageCapacityUtilization: number;
}

// Event filter options
export interface EventFilters {
  status?: EventStatus[];
  type?: EventType[];
  creatorId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  city?: string;
  requiresPayment?: boolean;
  hasAvailableSpots?: boolean;
  sortBy?: EventSortOption;
  sortOrder?: "asc" | "desc";
}

// Event sorting options
export type EventSortOption =
  | "startDate"
  | "createdAt"
  | "title"
  | "capacity"
  | "registrationCount"
  | "price";

// Event action types
export type EventAction =
  | "view"
  | "edit"
  | "delete"
  | "publish"
  | "unpublish"
  | "cancel"
  | "duplicate"
  | "export"
  | "manage-registrations";

// Event actions configuration
export interface EventActionConfig {
  action: EventAction;
  label: string;
  icon: string;
  variant: "default" | "destructive" | "outline" | "secondary";
  isVisible: (event: EventListItem) => boolean;
  isDisabled: (event: EventListItem) => boolean;
}

// Event creation/edit form props
export interface EventFormProps {
  event?: Event;
  mode: "create" | "edit";
  onSuccess?: (event: Event) => void;
  onCancel?: () => void;
}

// Event card props
export interface EventCardProps {
  event: EventListItem;
  actions?: EventAction[];
  onAction?: (action: EventAction, event: EventListItem) => void;
  isLoading?: boolean;
  showStats?: boolean;
  variant?: "default" | "compact" | "detailed";
}

// Event list props
export interface EventListProps {
  events: EventListItem[];
  filters?: EventFilters;
  onFiltersChange?: (filters: EventFilters) => void;
  onEventAction?: (_action: EventAction, _event: EventListItem) => void;
  isLoading?: boolean;
  showFilters?: boolean;
  allowSelection?: boolean;
  selectedEvents?: string[];
  onSelectionChange?: (_selectedIds: string[]) => void;
}

// Event status badge props
export interface EventStatusBadgeProps {
  status: EventStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

// Event type badge props
export interface EventTypeBadgeProps {
  type: EventType;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

// Event capacity indicator props
export interface EventCapacityIndicatorProps {
  capacity: EventCapacityInfo;
  showDetails?: boolean;
  variant?: "default" | "compact";
}

// Event date display props
export interface EventDateDisplayProps {
  startDate: Date;
  endDate?: Date;
  timezone?: string;
  format?: "short" | "long" | "relative";
  showTime?: boolean;
}

// Event location display props
export interface EventLocationDisplayProps {
  venue?: string;
  address?: string;
  city?: string;
  country?: string;
  isOnline: boolean;
  onlineUrl?: string;
  variant?: "full" | "compact" | "city-only";
}

// Event quick actions props
export interface EventQuickActionsProps {
  event: EventListItem;
  actions: EventAction[];
  onAction: (_action: EventAction) => void;
  isLoading?: boolean;
  variant?: "dropdown" | "buttons" | "icons";
}

// Event search and filter components
export interface EventSearchProps {
  value: string;
  onChange: (_value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export interface EventFiltersPanelProps {
  filters: EventFilters;
  onChange: (_filters: EventFilters) => void;
  availableCreators?: Array<{ id: string; name: string }>;
  availableCities?: string[];
  isLoading?: boolean;
}

// Event bulk actions
export type EventBulkAction = "publish" | "unpublish" | "delete" | "export" | "duplicate";

export interface EventBulkActionsProps {
  selectedEvents: string[];
  onAction: (_action: EventBulkAction, _eventIds: string[]) => void;
  isLoading?: boolean;
}

// Event export options
export interface EventExportOptions {
  format: "csv" | "xlsx" | "pdf";
  includeRegistrations: boolean;
  includePayments: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  fields?: string[];
}

// Event duplication options
export interface EventDuplicationOptions {
  includeRegistrations: boolean;
  includePayments: boolean;
  newStartDate?: Date;
  titleSuffix?: string;
  status: EventStatus;
}
