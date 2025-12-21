export interface EventListItem {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  startDate: Date;
  endDate?: Date;
  capacity: number;
  price?: number;
  currency?: string;
  venue?: string;
  city?: string;
  isOnline: boolean;
  registrationCount: number;
  waitingListCount: number;
  availableSpots: number;
  isRegistrationOpen: boolean;
  isPastEvent: boolean;
  creatorName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventsResponse {
  events: EventListItem[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface EventFilters {
  status?: string;
  type?: string;
  search?: string;
  city?: string;
  requiresPayment?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface UseEventsOptions {
  filters?: EventFilters;
  page?: number;
  limit?: number;
}

export interface UseEventsReturn {
  events: EventListItem[];
  pagination: EventsResponse["pagination"];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  setFilters: (_filters: EventFilters) => void;
  setPage: (_page: number) => void;
}

export interface EventDashboardProps {
  className?: string;
}

export interface EventListProps {
  events: EventListItem[];
  isLoading: boolean;
  onEdit: (_eventId: string) => void;
  onDelete: (_eventId: string) => void;
  onToggleStatus: (_eventId: string, _currentStatus: string) => void;
  isAdmin?: boolean;
  selectedEvents?: string[];
  onSelectionChange?: (selectedEvents: string[]) => void;
}

export interface EventCardProps {
  event: EventListItem;
  onEdit: (_eventId: string) => void;
  onDelete: (_eventId: string) => void;
  onToggleStatus: (_eventId: string, _currentStatus: string) => void;
  isAdmin?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (eventId: string, selected: boolean) => void;
}

export interface EventFiltersProps {
  filters: EventFilters;
  onFiltersChange: (_filters: EventFilters) => void;
  onClear: () => void;
}

export interface EventStatsProps {
  totalEvents: number;
  publishedEvents: number;
  draftEvents: number;
  totalRegistrations: number;
}
