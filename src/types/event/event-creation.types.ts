 
import type { EventType, EventStatus } from "@prisma/client";

// Registration control types
export type RegistrationControlMode = "manual" | "scheduled";
export type RegistrationManualState = "open" | "closed";

// Simplified event creation form data interface
export interface EventCreationFormData {
  // Basic information
  title: string;
  description?: string;

  // Location
  venue: string;

  // Event details
  capacity: number;
  price: number;
  currency: string;

  // Scheduling
  startDate: Date;
  endDate?: Date;

  // Registration control
  registrationControlMode: RegistrationControlMode;
  registrationManualState: RegistrationManualState;
  registrationStartDate?: Date;
  registrationEndDate?: Date;

  // Payment settings
  bankAccountId?: string;

  // Visibility
  status: "DRAFT" | "PUBLISHED";

  // Required fields for API compatibility
  type: string;
  country: string;
  timezone: string;
  isOnline: boolean;
  requiresApproval: boolean;
  allowWaitingList: boolean;
  requiresPayment: boolean;
  tags: string[];
}

// Simplified event creation form validation result
export interface EventCreationFormErrors {
  title?: string;
  description?: string;
  venue?: string;
  capacity?: string;
  price?: string;
  currency?: string;
  startDate?: string;
  endDate?: string;
  registrationControlMode?: string;
  registrationManualState?: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  bankAccountId?: string;
  status?: string;
  type?: string;
  country?: string;
  timezone?: string;
  isOnline?: string;
  requiresApproval?: string;
  allowWaitingList?: string;
  requiresPayment?: string;
  tags?: string;
  general?: string;
}

// Event creation form state
export interface EventCreationFormState {
  data: EventCreationFormData;
  errors: EventCreationFormErrors;
  isLoading: boolean;
  isSubmitting: boolean;
}

// Event creation API response
export interface EventCreationResponse {
  success: boolean;
  event?: {
    id: string;
    title: string;
    slug: string;
    status: EventStatus;
  };
  errors?: EventCreationFormErrors;
  message?: string;
}

// Bank account selection option
export interface BankAccountOption {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  isDefault: boolean;
  isActive: boolean;
}

// Event creation step (for potential wizard implementation)
export type EventCreationStep =
  | "basic-info"
  | "schedule"
  | "location"
  | "registration"
  | "payment"
  | "metadata"
  | "preview";

// Event creation context value
export interface EventCreationContextValue {
  formData: EventCreationFormData;
  errors: EventCreationFormErrors;
  currentStep: EventCreationStep;
  isLoading: boolean;
  isSubmitting: boolean;
  updateFormData: (_data: Partial<EventCreationFormData>) => void;
  updateErrors: (_errors: Partial<EventCreationFormErrors>) => void;
  setCurrentStep: (_step: EventCreationStep) => void;
  submitForm: () => Promise<EventCreationResponse>;
  resetForm: () => void;
}

// Event form field props
export interface EventFormFieldProps {
  label: string;
  name: keyof EventCreationFormData;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  description?: string;
}

// Date time picker props
export interface DateTimePickerProps {
  label: string;
  value?: Date;
  onChange: (_date: Date | undefined) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
}

// Bank account selector props
export interface BankAccountSelectorProps {
  value?: string;
  onChange: (_bankAccountId: string | undefined) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

// Tag input props
export interface TagInputProps {
  value: string[];
  onChange: (_tags: string[]) => void;
  error?: string;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
}

// Event type constants
export const EVENT_TYPES: Record<EventType, { label: string; description: string }> = {
  WORKSHOP: {
    label: "Workshop",
    description: "Hands-on learning experience with practical activities",
  },
  SEMINAR: {
    label: "Seminar",
    description: "Educational presentation or discussion session",
  },
  CONFERENCE: {
    label: "Conference",
    description: "Large professional gathering with multiple sessions",
  },
  MEETUP: {
    label: "Meetup",
    description: "Informal gathering of people with shared interests",
  },
  TRAINING: {
    label: "Training",
    description: "Structured learning program to develop skills",
  },
  SOCIAL: {
    label: "Social Event",
    description: "Casual gathering focused on networking and fun",
  },
  OTHER: {
    label: "Other",
    description: "Custom event type not listed above",
  },
};

// Default form values
export const DEFAULT_EVENT_FORM_DATA: EventCreationFormData = {
  title: "",
  description: "",
  venue: "",
  capacity: 1,
  price: 0,
  currency: "CZK",
  startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  endDate: undefined,
  registrationControlMode: "manual",
  registrationManualState: "open",
  registrationStartDate: undefined,
  registrationEndDate: undefined,
  bankAccountId: undefined,
  status: "PUBLISHED",
  // Default fields for API compatibility
  type: "OTHER",
  country: "Czech Republic",
  timezone: "Europe/Prague",
  isOnline: false,
  requiresApproval: false,
  allowWaitingList: true,
  requiresPayment: false,
  tags: [],
};
