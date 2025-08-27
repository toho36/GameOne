/* eslint-disable no-unused-vars */
import type { EventStatus as PrismaEventStatus } from "@prisma/client";

// Event registration types for the public registration system

export enum RegistrationStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  WAITLISTED = "WAITLISTED",
  CHECKED_IN = "CHECKED_IN",
  NO_SHOW = "NO_SHOW",
}

export enum PaymentStatus {
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
  PAYMENT_SENT_AWAITING_VERIFICATION = "PAYMENT_SENT_AWAITING_VERIFICATION",
  PAYMENT_VERIFIED = "PAYMENT_VERIFIED",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  REFUNDED = "REFUNDED",
}

// Use Prisma EventStatus enum
export type EventStatus = PrismaEventStatus;

// Core event types
export interface PublicEvent {
  id: string;
  slug: string;
  title: string;
  description?: string; // Made optional as per Prisma schema
  shortDescription?: string;
  startDate: Date;
  endDate?: Date; // Made optional as per Prisma schema
  registrationStartDate?: Date;
  registrationEndDate?: Date;
  capacity: number; // Changed from maxParticipants to capacity
  price?: number;
  currency: string;
  venue?: string; // Changed from location to venue
  status: EventStatus;
  tags: string[];
  requiresApproval: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Computed fields
  category?: EventCategory; // Made optional as per Prisma schema
  registrationOpen: boolean;
  availableSpots?: number;
  confirmedParticipants: number;
  waitingListCount: number;
  averageRating?: number;
  canRegister: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
}

// Registration types
export interface Registration {
  id: string;
  eventId: string;
  userId: string;
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

export interface PublicRegistration extends Omit<Registration, "metadata"> {
  event: {
    id: string;
    title: string;
    startDate: Date;
    location?: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  canCancel: boolean;
  canModify: boolean;
  cancellationDeadline?: Date;
}

// Guest registration
export interface GuestInfo {
  name: string;
  email?: string;
  phone?: string;
  dietaryRestrictions?: string;
  metadata?: Record<string, any>;
}

export interface GuestRegistration extends GuestInfo {
  id: string;
  registrationId: string;
  checkInAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Waiting list
export interface WaitingListEntry {
  id: string;
  eventId: string;
  userId: string;
  position: number;
  numberOfGuests: number;
  notificationSent: boolean;
  expiresAt?: Date;
  convertedAt?: Date;
  convertedToRegistrationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WaitingListWithUser extends WaitingListEntry {
  user: {
    id: string;
    name: string;
    email: string;
  };
  event: {
    id: string;
    title: string;
    startDate: Date;
  };
}

// Payment types
export interface PaymentInfo {
  id: string;
  registrationId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId?: string;
  qrCode?: string;
  bankAccount?: BankAccountInfo;
  claimedAt?: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum PaymentMethod {
  BANK_TRANSFER = "BANK_TRANSFER",
  CASH = "CASH",
  CARD = "CARD",
  OTHER = "OTHER",
}

export interface BankAccountInfo {
  accountNumber: string;
  bankCode: string;
  iban?: string;
  swift?: string;
  accountHolder: string;
  bankName: string;
}

// Registration form types
export interface RegistrationFormData {
  eventId: string;
  numberOfGuests: number;
  guestDetails: GuestInfo[];
  emergencyContact?: EmergencyContact;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  email?: string;
}

// Registration wizard state
export interface RegistrationWizardState {
  currentStep: number;
  totalSteps: number;
  eventId: string;
  formData: {
    personalInfo: {};
    guests: GuestInfo[];
    payment: {
      method?: PaymentMethod;
      billingAddress?: Address;
    };
    additional: {
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

// Address type
export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

// API request/response types
export interface CreateRegistrationRequest {
  eventId: string;
  numberOfGuests: number;
  guestDetails: GuestInfo[];
  emergencyContact?: EmergencyContact;
}

export interface ClaimPaymentRequest {
  registrationId: string;
  transactionId?: string;
  notes?: string;
}

export interface RegistrationStatusResponse {
  registration: PublicRegistration;
  payment: PaymentInfo;
  waitingList?: WaitingListEntry;
  canCancel: boolean;
  canModify: boolean;
  cancellationDeadline?: Date;
}

// Event filters
export interface EventFilters {
  status?: EventStatus;
  categoryId?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  tags?: string[];
  isPrivate?: boolean;
  priceMin?: number;
  priceMax?: number;
  hasAvailableSpots?: boolean;
}

// Event search
export interface EventSearchOptions {
  query?: string;
  fields?: string[];
}

// Pagination
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// API responses
export interface EventListResponse {
  events: PublicEvent[];
  pagination: PaginationInfo;
  filters: EventFilters;
}

export interface EventResponse {
  event: PublicEvent;
}

export interface RegistrationResponse {
  registration: PublicRegistration;
  payment: PaymentInfo;
  success: boolean;
  message: string;
}
