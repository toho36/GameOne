# Type Definitions and Interfaces

## Overview
This document defines comprehensive TypeScript type definitions, interfaces, and type management patterns for the GameOne event management system. All types should be strongly typed, well-documented, and follow consistent patterns for maintainability and developer experience.

## Directory Structure

```
src/types/
├── api/                    # API-related types
│   ├── requests.ts        # Request payload types
│   ├── responses.ts       # Response payload types
│   ├── errors.ts          # Error types
│   └── pagination.ts      # Pagination types
├── database/              # Database-related types
│   ├── prisma.ts          # Extended Prisma types
│   ├── models.ts          # Model types with relations
│   └── enums.ts           # Database enums
├── features/              # Feature-specific types
│   ├── events.ts          # Event management types
│   ├── users.ts           # User management types
│   ├── registration.ts    # Registration types
│   ├── payments.ts        # Payment types
│   ├── videos.ts          # Video content types
│   └── notifications.ts   # Notification types
├── ui/                    # UI component types
│   ├── components.ts      # Common component props
│   ├── forms.ts           # Form-related types
│   ├── tables.ts          # Table and data display types
│   └── navigation.ts      # Navigation types
├── utils/                 # Utility types
│   ├── common.ts          # Common utility types
│   ├── helpers.ts         # Type helper utilities
│   └── guards.ts          # Type guard functions
├── auth/                  # Authentication types
│   ├── user.ts            # User authentication types
│   ├── permissions.ts     # Permission types
│   └── roles.ts           # Role types
└── global/                # Global type definitions
    ├── environment.ts     # Environment variables
    ├── config.ts          # Configuration types
    └── index.ts           # Global type exports
```

## Type Naming Conventions

### General Rules
- **Interfaces**: PascalCase with descriptive names (e.g., `EventCreateRequest`, `UserProfile`)
- **Types**: PascalCase for type aliases (e.g., `EventStatus`, `PaymentMethod`)
- **Enums**: PascalCase with SCREAMING_SNAKE_CASE values (e.g., `EventStatus.PUBLISHED`)
- **Generic Types**: Single uppercase letters starting with `T` (e.g., `T`, `TData`, `TResult`)
- **Utility Types**: Descriptive PascalCase (e.g., `Optional`, `Nullable`, `ApiResponse`)

### Specific Patterns
- **Request Types**: `{Entity}{Action}Request` (e.g., `EventCreateRequest`, `UserUpdateRequest`)
- **Response Types**: `{Entity}{Action}Response` (e.g., `EventListResponse`, `UserProfileResponse`)
- **Props Types**: `{Component}Props` (e.g., `EventCardProps`, `UserFormProps`)
- **State Types**: `{Feature}State` (e.g., `EventState`, `RegistrationState`)
- **Config Types**: `{Feature}Config` (e.g., `AuthConfig`, `DatabaseConfig`)

## Core Type Definitions

### Common Utility Types (`src/types/utils/common.ts`)
```typescript
// Basic utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Nullable<T> = T | null;
export type Maybe<T> = T | null | undefined;
export type NonNullable<T> = T extends null | undefined ? never : T;

// Array and object utilities
export type ArrayElement<T> = T extends readonly (infer E)[] ? E : never;
export type ObjectValues<T> = T[keyof T];
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// Function utilities
export type AsyncFunction<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => Promise<ReturnType<T>>;

export type EventHandler<T = void> = () => T;
export type EventHandlerWithValue<TValue, TReturn = void> = (value: TValue) => TReturn;
export type EventHandlerWithEvent<TEvent = Event, TReturn = void> = (event: TEvent) => TReturn;

// ID and identifier types
export type ID = string;
export type UUID = string;
export type Slug = string;
export type Email = string;
export type URL = string;
export type PhoneNumber = string;

// Date and time utilities
export type ISODateString = string;
export type Timestamp = number;
export type DateRange = {
  startDate: Date;
  endDate: Date;
};

// Status and state types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

// Pagination types
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

// Sorting types
export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

export type SortDirection = 'asc' | 'desc';

// Search and filtering
export interface SearchOptions {
  query?: string;
  fields?: string[];
}

export interface FilterOptions<T = any> {
  [key: string]: T;
}
```

### API Types (`src/types/api/`)

#### Request Types (`src/types/api/requests.ts`)
```typescript
// Base request types
export interface BaseRequest {
  requestId?: string;
  timestamp?: ISODateString;
  locale?: string;
}

export interface PaginatedRequest extends BaseRequest {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortedRequest extends BaseRequest {
  sortBy?: string;
  sortOrder?: SortDirection;
}

export interface SearchRequest extends BaseRequest {
  search?: string;
  searchFields?: string[];
}

export interface FilteredRequest<T = any> extends BaseRequest {
  filters?: T;
}

// Event requests
export interface EventCreateRequest extends BaseRequest {
  title: string;
  description: string;
  shortDescription?: string;
  startDate: ISODateString;
  endDate: ISODateString;
  registrationStartDate?: ISODateString;
  registrationEndDate?: ISODateString;
  maxParticipants?: number;
  price?: number;
  currency?: string;
  location?: string;
  categoryId: ID;
  tags?: string[];
  isPrivate?: boolean;
  requiresApproval?: boolean;
  allowGuests?: boolean;
  maxGuestsPerRegistration?: number;
  metadata?: Record<string, any>;
}

export interface EventUpdateRequest extends BaseRequest {
  id: ID;
  title?: string;
  description?: string;
  shortDescription?: string;
  startDate?: ISODateString;
  endDate?: ISODateString;
  registrationStartDate?: ISODateString;
  registrationEndDate?: ISODateString;
  maxParticipants?: number;
  price?: number;
  currency?: string;
  location?: string;
  categoryId?: ID;
  tags?: string[];
  isPrivate?: boolean;
  requiresApproval?: boolean;
  allowGuests?: boolean;
  maxGuestsPerRegistration?: number;
  status?: EventStatus;
  metadata?: Record<string, any>;
}

export interface EventListRequest extends PaginatedRequest, SortedRequest, SearchRequest {
  filters?: EventFilters;
}

export interface EventFilters {
  status?: EventStatus;
  categoryId?: ID;
  startDate?: ISODateString;
  endDate?: ISODateString;
  location?: string;
  tags?: string[];
  isPrivate?: boolean;
  priceMin?: number;
  priceMax?: number;
}

// Registration requests
export interface RegistrationCreateRequest extends BaseRequest {
  eventId: ID;
  numberOfGuests: number;
  guestDetails?: GuestInfo[];
  specialRequirements?: string;
  paymentMethod?: PaymentMethod;
  acceptedTerms: boolean;
}

export interface RegistrationUpdateRequest extends BaseRequest {
  id: ID;
  status?: RegistrationStatus;
  numberOfGuests?: number;
  guestDetails?: GuestInfo[];
  specialRequirements?: string;
  notes?: string;
}

// User requests
export interface UserCreateRequest extends BaseRequest {
  email: Email;
  name: string;
  givenName?: string;
  familyName?: string;
  phone?: PhoneNumber;
  locale?: string;
  timezone?: string;
}

export interface UserUpdateRequest extends BaseRequest {
  id: ID;
  name?: string;
  givenName?: string;
  familyName?: string;
  phone?: PhoneNumber;
  locale?: string;
  timezone?: string;
  isVerified?: boolean;
}

export interface UserListRequest extends PaginatedRequest, SortedRequest, SearchRequest {
  filters?: UserFilters;
}

export interface UserFilters {
  isVerified?: boolean;
  roles?: string[];
  lastActiveAfter?: ISODateString;
  locale?: string;
}
```

#### Response Types (`src/types/api/responses.ts`)
```typescript
// Base response types
export interface BaseResponse {
  success: boolean;
  timestamp: ISODateString;
  requestId: string;
}

export interface ApiResponse<T = any> extends BaseResponse {
  data?: T;
  error?: ApiError;
  meta?: ResponseMetadata;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: PaginationInfo;
}

export interface ResponseMetadata {
  version: string;
  executionTime?: number;
  cacheHit?: boolean;
  warnings?: string[];
}

// Error response types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  field?: string;
  stack?: string;
}

export interface ValidationError extends ApiError {
  code: 'VALIDATION_ERROR';
  details: {
    fieldErrors: Record<string, string[]>;
  };
}

export interface AuthenticationError extends ApiError {
  code: 'AUTHENTICATION_ERROR' | 'AUTHORIZATION_ERROR';
  details?: {
    requiredPermissions?: string[];
    userPermissions?: string[];
  };
}

// Specific response types
export interface EventResponse extends ApiResponse<PublicEvent> {}
export interface EventListResponse extends PaginatedResponse<PublicEvent> {}
export interface EventStatsResponse extends ApiResponse<EventStatistics> {}

export interface RegistrationResponse extends ApiResponse<PublicRegistration> {}
export interface RegistrationListResponse extends PaginatedResponse<PublicRegistration> {}

export interface UserResponse extends ApiResponse<PublicUser> {}
export interface UserListResponse extends PaginatedResponse<PublicUser> {}
export interface UserProfileResponse extends ApiResponse<UserProfile> {}

export interface PaymentResponse extends ApiResponse<PaymentInfo> {}
export interface PaymentListResponse extends PaginatedResponse<PaymentInfo> {}

// Health check response
export interface HealthCheckResponse extends BaseResponse {
  data: {
    status: 'healthy' | 'unhealthy';
    database: {
      status: 'connected' | 'disconnected';
      responseTime: number;
    };
    external: {
      [serviceName: string]: {
        status: 'available' | 'unavailable';
        responseTime?: number;
        error?: string;
      };
    };
    uptime: number;
    version: string;
  };
}
```

### Feature Types (`src/types/features/`)

#### Event Types (`src/types/features/events.ts`)
```typescript
// Event enums
export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export enum EventVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  UNLISTED = 'UNLISTED'
}

// Core event types
export interface BaseEvent {
  id: ID;
  title: string;
  description: string;
  shortDescription?: string;
  slug: Slug;
  startDate: Date;
  endDate: Date;
  registrationStartDate?: Date;
  registrationEndDate?: Date;
  maxParticipants?: number;
  price?: number;
  currency: string;
  location?: string;
  status: EventStatus;
  visibility: EventVisibility;
  tags: string[];
  isPrivate: boolean;
  requiresApproval: boolean;
  allowGuests: boolean;
  maxGuestsPerRegistration: number;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event extends BaseEvent {
  categoryId: ID;
  createdById: ID;
}

export interface EventWithRelations extends Event {
  category: EventCategory;
  createdBy: PublicUser;
  registrations: RegistrationSummary[];
  feedback: EventFeedback[];
  documents: EventDocument[];
  stats: EventStatistics;
}

export interface PublicEvent extends Omit<BaseEvent, 'metadata'> {
  category: {
    id: ID;
    name: string;
    slug: Slug;
    color?: string;
  };
  registrationOpen: boolean;
  availableSpots?: number;
  confirmedParticipants: number;
  waitingListCount: number;
  averageRating?: number;
  canRegister: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

// Event category types
export interface EventCategory {
  id: ID;
  name: string;
  slug: Slug;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: ID;
  isActive: boolean;
  sortOrder: number;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventCategoryTree extends EventCategory {
  children: EventCategoryTree[];
  parent?: EventCategory;
  eventCount: number;
}

// Event statistics
export interface EventStatistics {
  registrations: {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    waitlisted: number;
  };
  revenue: {
    total: number;
    currency: string;
    paid: number;
    pending: number;
  };
  feedback: {
    count: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
  };
  attendance: {
    expected: number;
    actual?: number;
    rate?: number;
  };
}

// Event feedback
export interface EventFeedback {
  id: ID;
  eventId: ID;
  userId: ID;
  rating: number;
  comment?: string;
  isPublic: boolean;
  isModerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventFeedbackWithUser extends EventFeedback {
  user: {
    id: ID;
    name: string;
    avatar?: string;
  };
}

// Event document management
export interface EventDocument {
  id: ID;
  eventId: ID;
  name: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadUrl: string;
  isPublic: boolean;
  accessLevel: 'PUBLIC' | 'REGISTERED' | 'ORGANIZER';
  uploadedById: ID;
  uploadedAt: Date;
}
```

#### Registration Types (`src/types/features/registration.ts`)
```typescript
// Registration enums
export enum RegistrationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  WAITLISTED = 'WAITLISTED',
  CHECKED_IN = 'CHECKED_IN',
  NO_SHOW = 'NO_SHOW'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
}

// Core registration types
export interface Registration {
  id: ID;
  eventId: ID;
  userId: ID;
  status: RegistrationStatus;
  numberOfGuests: number;
  totalAmount?: number;
  paymentStatus?: PaymentStatus;
  notes?: string;
  specialRequirements?: string;
  checkInAt?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegistrationWithRelations extends Registration {
  event: PublicEvent;
  user: PublicUser;
  guests: GuestRegistration[];
  payments: PaymentInfo[];
  history: RegistrationHistory[];
}

export interface PublicRegistration extends Omit<Registration, 'metadata'> {
  event: {
    id: ID;
    title: string;
    startDate: Date;
    location?: string;
  };
  user: {
    id: ID;
    name: string;
    email: Email;
  };
  canCancel: boolean;
  canModify: boolean;
  cancellationDeadline?: Date;
}

// Guest registration
export interface GuestInfo {
  name: string;
  email?: Email;
  phone?: PhoneNumber;
  dietaryRestrictions?: string;
  specialRequirements?: string;
  metadata?: Record<string, any>;
}

export interface GuestRegistration extends GuestInfo {
  id: ID;
  registrationId: ID;
  checkInAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Registration summary for display
export interface RegistrationSummary {
  id: ID;
  status: RegistrationStatus;
  numberOfGuests: number;
  totalAmount?: number;
  paymentStatus?: PaymentStatus;
  user: {
    id: ID;
    name: string;
    email: Email;
  };
  registeredAt: Date;
}

// Waiting list
export interface WaitingListEntry {
  id: ID;
  eventId: ID;
  userId: ID;
  position: number;
  numberOfGuests: number;
  notificationSent: boolean;
  expiresAt?: Date;
  convertedAt?: Date;
  convertedToRegistrationId?: ID;
  createdAt: Date;
  updatedAt: Date;
}

export interface WaitingListWithUser extends WaitingListEntry {
  user: {
    id: ID;
    name: string;
    email: Email;
  };
  event: {
    id: ID;
    title: string;
    startDate: Date;
  };
}

// Registration history for audit trail
export interface RegistrationHistory {
  id: ID;
  registrationId: ID;
  action: RegistrationAction;
  previousStatus?: RegistrationStatus;
  newStatus?: RegistrationStatus;
  reason?: string;
  performedById: ID;
  metadata: Record<string, any>;
  createdAt: Date;
}

export enum RegistrationAction {
  CREATED = 'CREATED',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  WAITLISTED = 'WAITLISTED',
  CHECKED_IN = 'CHECKED_IN',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUNDED = 'REFUNDED',
  MODIFIED = 'MODIFIED'
}

// Registration wizard state
export interface RegistrationWizardState {
  currentStep: number;
  totalSteps: number;
  eventId: ID;
  formData: {
    personalInfo: {
      acceptedTerms: boolean;
      marketingConsent?: boolean;
    };
    guests: GuestInfo[];
    payment: {
      method?: PaymentMethod;
      billingAddress?: Address;
    };
    additional: {
      specialRequirements?: string;
      dietaryRestrictions?: string;
      emergencyContact?: EmergencyContact;
    };
  };
  validation: {
    [stepNumber: number]: {
      isValid: boolean;
      errors: Record<string, string>;
    };
  };
  isSubmitting: boolean;
  error?: string;
}
```

#### User Types (`src/types/features/users.ts`)
```typescript
// User-related enums
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  ORGANIZER = 'ORGANIZER',
  USER = 'USER',
  GUEST = 'GUEST'
}

// Core user types
export interface User {
  id: ID;
  kindeId: string;
  email: Email;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: URL;
  isVerified: boolean;
  phone?: PhoneNumber;
  locale?: string;
  timezone?: string;
  status: UserStatus;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicUser {
  id: ID;
  name: string;
  email: Email;
  avatar?: URL;
  isVerified: boolean;
  roles: string[];
  lastActiveAt?: Date;
  createdAt: Date;
}

export interface UserProfile extends User {
  profile?: {
    bio?: string;
    website?: URL;
    socialLinks?: SocialLinks;
    preferences: UserPreferences;
    emergencyContact?: EmergencyContact;
    address?: Address;
  };
  statistics: {
    eventsCreated: number;
    eventsAttended: number;
    totalSpent: number;
    memberSince: Date;
  };
  permissions: string[];
  roles: RoleAssignment[];
}

// User preferences
export interface UserPreferences {
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
  display: DisplaySettings;
  communication: CommunicationPreferences;
}

export interface NotificationPreferences {
  email: {
    eventReminders: boolean;
    eventUpdates: boolean;
    registrationConfirmations: boolean;
    paymentReceipts: boolean;
    newsletter: boolean;
    marketing: boolean;
  };
  push: {
    eventReminders: boolean;
    eventUpdates: boolean;
    lastMinuteChanges: boolean;
  };
  sms: {
    eventReminders: boolean;
    emergencyUpdates: boolean;
  };
}

export interface PrivacySettings {
  profileVisibility: 'PUBLIC' | 'MEMBERS_ONLY' | 'PRIVATE';
  showEmail: boolean;
  showPhone: boolean;
  showAttendanceHistory: boolean;
  allowDirectMessages: boolean;
}

export interface DisplaySettings {
  theme: 'LIGHT' | 'DARK' | 'AUTO';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;
}

export interface CommunicationPreferences {
  preferredLanguage: string;
  preferredContactMethod: 'EMAIL' | 'PHONE' | 'SMS';
  emergencyContactMethod: 'EMAIL' | 'PHONE' | 'SMS';
}

// Supporting types
export interface SocialLinks {
  website?: URL;
  linkedin?: URL;
  twitter?: URL;
  facebook?: URL;
  instagram?: URL;
  github?: URL;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: PhoneNumber;
  email?: Email;
}

export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

// Role and permission types
export interface Role {
  id: ID;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: ID;
  name: string;
  description?: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface RoleAssignment {
  id: ID;
  roleId: ID;
  role: Role;
  assignedAt: Date;
  assignedBy: ID;
  expiresAt?: Date;
  isActive: boolean;
}

// User activity tracking
export interface UserActivity {
  id: ID;
  userId: ID;
  action: string;
  resource: string;
  resourceId?: ID;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// User session
export interface UserSession {
  id: ID;
  userId: ID;
  deviceId?: string;
  ipAddress: string;
  userAgent: string;
  lastActiveAt: Date;
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
}
```

### UI Component Types (`src/types/ui/`)

#### Component Props (`src/types/ui/components.ts`)
```typescript
// Base component props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

export interface VariantComponentProps {
  variant?: string;
  size?: string;
}

// Event component props
export interface EventCardProps extends BaseComponentProps {
  event: PublicEvent;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  onSelect?: (event: PublicEvent) => void;
  onEdit?: (eventId: ID) => void;
  onDelete?: (eventId: ID) => void;
  onRegister?: (eventId: ID) => void;
}

export interface EventListProps extends BaseComponentProps {
  events: PublicEvent[];
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  variant?: 'grid' | 'list';
  onEventSelect?: (event: PublicEvent) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export interface EventFormProps extends BaseComponentProps {
  event?: Event;
  categories: EventCategory[];
  onSubmit: (data: EventCreateRequest | EventUpdateRequest) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  error?: string;
}

// Form component props
export interface FormFieldProps extends BaseComponentProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
}

export interface InputProps extends FormFieldProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  autoComplete?: string;
  pattern?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface SelectProps extends FormFieldProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  onBlur?: () => void;
  searchable?: boolean;
  multiple?: boolean;
  clearable?: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

// Table component props
export interface DataTableProps<T> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  pagination?: PaginationInfo;
  sorting?: SortOption[];
  selection?: TableSelection<T>;
  actions?: TableAction<T>[];
  onPageChange?: (page: number) => void;
  onSortChange?: (sorting: SortOption[]) => void;
  onSelectionChange?: (selection: T[]) => void;
  onRowClick?: (row: T) => void;
}

export interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  width?: number | string;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  className?: string;
}

export interface TableSelection<T> {
  selectedRows: T[];
  onSelectionChange: (rows: T[]) => void;
  selectAll?: boolean;
  onSelectAll?: (selected: boolean) => void;
}

export interface TableAction<T> {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  disabled?: (row: T) => boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

// Modal and dialog props
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

export interface ConfirmDialogProps extends Omit<ModalProps, 'children'> {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

// Navigation props
export interface BreadcrumbProps extends BaseComponentProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  maxItems?: number;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  current?: boolean;
}

export interface TabsProps extends BaseComponentProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  orientation?: 'horizontal' | 'vertical';
}

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
  badge?: string | number;
  icon?: React.ReactNode;
}
```

### Type Guards and Utilities (`src/types/utils/guards.ts`)
```typescript
// Type guard functions for runtime type checking
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

export function isNull(value: unknown): value is null {
  return value === null;
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

export function isNullish(value: unknown): value is null | undefined {
  return value == null;
}

// More specific type guards
export function isValidEmail(value: string): value is Email {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

export function isValidUUID(value: string): value is UUID {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export function isValidURL(value: string): value is URL {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function isValidPhoneNumber(value: string): value is PhoneNumber {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''));
}

// Domain-specific type guards
export function isEventStatus(value: string): value is EventStatus {
  return Object.values(EventStatus).includes(value as EventStatus);
}

export function isRegistrationStatus(value: string): value is RegistrationStatus {
  return Object.values(RegistrationStatus).includes(value as RegistrationStatus);
}

export function isPaymentStatus(value: string): value is PaymentStatus {
  return Object.values(PaymentStatus).includes(value as PaymentStatus);
}

export function isUserRole(value: string): value is UserRole {
  return Object.values(UserRole).includes(value as UserRole);
}

// API response type guards
export function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return (
    isObject(value) &&
    'success' in value &&
    isBoolean(value.success) &&
    'timestamp' in value &&
    isString(value.timestamp) &&
    'requestId' in value &&
    isString(value.requestId)
  );
}

export function isSuccessResponse<T>(value: unknown): value is ApiResponse<T> & { success: true } {
  return isApiResponse(value) && value.success === true;
}

export function isErrorResponse(value: unknown): value is ApiResponse & { success: false } {
  return isApiResponse(value) && value.success === false;
}

export function isPaginatedResponse<T>(value: unknown): value is PaginatedResponse<T> {
  return (
    isApiResponse(value) &&
    'pagination' in value &&
    isObject(value.pagination) &&
    'page' in value.pagination &&
    isNumber(value.pagination.page) &&
    'limit' in value.pagination &&
    isNumber(value.pagination.limit) &&
    'total' in value.pagination &&
    isNumber(value.pagination.total)
  );
}

// Event type guards
export function isEvent(value: unknown): value is Event {
  return (
    isObject(value) &&
    'id' in value &&
    isString(value.id) &&
    'title' in value &&
    isString(value.title) &&
    'startDate' in value &&
    isDate(value.startDate) &&
    'endDate' in value &&
    isDate(value.endDate) &&
    'status' in value &&
    isEventStatus(value.status as string)
  );
}

export function isPublicEvent(value: unknown): value is PublicEvent {
  return (
    isEvent(value) &&
    'category' in value &&
    isObject(value.category) &&
    'registrationOpen' in value &&
    isBoolean(value.registrationOpen)
  );
}

// Registration type guards
export function isRegistration(value: unknown): value is Registration {
  return (
    isObject(value) &&
    'id' in value &&
    isString(value.id) &&
    'eventId' in value &&
    isString(value.eventId) &&
    'userId' in value &&
    isString(value.userId) &&
    'status' in value &&
    isRegistrationStatus(value.status as string)
  );
}

// User type guards
export function isUser(value: unknown): value is User {
  return (
    isObject(value) &&
    'id' in value &&
    isString(value.id) &&
    'email' in value &&
    isValidEmail(value.email as string) &&
    'isVerified' in value &&
    isBoolean(value.isVerified)
  );
}

export function isPublicUser(value: unknown): value is PublicUser {
  return (
    isUser(value) &&
    'name' in value &&
    isString(value.name) &&
    'roles' in value &&
    isArray(value.roles)
  );
}

// Form validation type guards
export function hasRequiredFields<T extends Record<string, any>>(
  obj: T,
  requiredFields: (keyof T)[]
): obj is T & Required<Pick<T, typeof requiredFields[number]>> {
  return requiredFields.every(field => 
    field in obj && obj[field] !== null && obj[field] !== undefined && obj[field] !== ''
  );
}

export function isValidFormData<T>(
  data: unknown,
  validator: (data: unknown) => data is T
): data is T {
  return validator(data);
}
```

## Global Type Exports (`src/types/global/index.ts`)
```typescript
// Re-export all types for easy importing
export * from '../api/requests';
export * from '../api/responses';
export * from '../api/errors';
export * from '../api/pagination';

export * from '../database/prisma';
export * from '../database/models';
export * from '../database/enums';

export * from '../features/events';
export * from '../features/users';
export * from '../features/registration';
export * from '../features/payments';
export * from '../features/videos';
export * from '../features/notifications';

export * from '../ui/components';
export * from '../ui/forms';
export * from '../ui/tables';
export * from '../ui/navigation';

export * from '../utils/common';
export * from '../utils/helpers';
export * from '../utils/guards';

export * from '../auth/user';
export * from '../auth/permissions';
export * from '../auth/roles';

export * from './environment';
export * from './config';

// Global type declarations
declare global {
  // Environment variables
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      KINDE_CLIENT_ID: string;
      KINDE_CLIENT_SECRET: string;
      KINDE_ISSUER_URL: string;
      KINDE_SITE_URL: string;
      KINDE_POST_LOGOUT_REDIRECT_URL: string;
      KINDE_POST_LOGIN_REDIRECT_URL: string;
      CRON_SECRET: string;
      NODE_ENV: 'development' | 'test' | 'production';
      VERCEL_ENV?: 'development' | 'preview' | 'production';
      VERCEL_URL?: string;
    }
  }

  // Window extensions for client-side
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

// Module augmentations for third-party libraries
declare module 'next-intl' {
  interface AppConfig {
    locales: ['en', 'cs'];
    defaultLocale: 'en';
  }
}

declare module '@prisma/client' {
  interface PrismaClient {
    softDelete: (model: string, where: any) => Promise<any>;
    restore: (model: string, where: any) => Promise<any>;
    findManyActive: (model: string, args?: any) => Promise<any>;
  }
}
```

This comprehensive type system provides:

1. **Strong typing** across the entire application
2. **Consistent patterns** for similar concepts
3. **Runtime type checking** with type guards
4. **API contract enforcement** with request/response types
5. **Component prop validation** with detailed interfaces
6. **Database type safety** with Prisma integration
7. **Error handling** with specific error types
8. **Extensibility** through modular organization

The type system is designed to catch errors at compile-time, improve developer experience with better IntelliSense, and ensure data consistency across the application.