import type { ComponentProps } from "react";
import type React from "react";
import type {
  EventCreationFormData,
  EventCreationFormErrors,
  EventCreationResponse,
  BankAccountOption,
  EventType,
} from "@/types/event";

// Main event creation form props
export interface EventCreationFormProps extends ComponentProps<"form"> {
  initialData?: Partial<EventCreationFormData>;
  onSuccess?: (_response: EventCreationResponse) => void;
  onCancel?: () => void;
  mode?: "create" | "edit";
  eventId?: string;
}

// Form section component props
export interface EventBasicInfoProps {
  formData: EventCreationFormData;
  errors: EventCreationFormErrors;
  onChange: (_data: Partial<EventCreationFormData>) => void;
  isLoading?: boolean;
}

export interface EventScheduleSettingsProps {
  formData: EventCreationFormData;
  errors: EventCreationFormErrors;
  onChange: (_data: Partial<EventCreationFormData>) => void;
  isLoading?: boolean;
}

export interface EventLocationSettingsProps {
  formData: EventCreationFormData;
  errors: EventCreationFormErrors;
  onChange: (_data: Partial<EventCreationFormData>) => void;
  isLoading?: boolean;
}

export interface EventCapacitySettingsProps {
  formData: EventCreationFormData;
  errors: EventCreationFormErrors;
  onChange: (_data: Partial<EventCreationFormData>) => void;
  isLoading?: boolean;
}

export interface EventPaymentSettingsProps {
  formData: EventCreationFormData;
  errors: EventCreationFormErrors;
  bankAccounts: BankAccountOption[];
  onChange: (_data: Partial<EventCreationFormData>) => void;
  isLoading?: boolean;
  isBankAccountsLoading?: boolean;
}

export interface EventMetadataSettingsProps {
  formData: EventCreationFormData;
  errors: EventCreationFormErrors;
  onChange: (_data: Partial<EventCreationFormData>) => void;
  isLoading?: boolean;
}

// Custom form field props
export interface FormFieldProps extends ComponentProps<"div"> {
  label: string;
  required?: boolean;
  error?: string;
  description?: string;
  children: React.ReactNode;
}

export interface FormInputProps extends ComponentProps<"input"> {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
}

export interface FormTextareaProps extends ComponentProps<"textarea"> {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
}

export interface FormSelectProps extends ComponentProps<"select"> {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  children: React.ReactNode;
}

// Date picker component props
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
  showTime?: boolean;
  description?: string;
  className?: string;
}

// Bank account selector props
export interface BankAccountSelectorProps {
  value?: string;
  onChange: (_bankAccountId: string | undefined) => void;
  options: BankAccountOption[];
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  isLoading?: boolean;
  description?: string;
  className?: string;
}

// Tag input component props
export interface TagInputProps {
  value: string[];
  onChange: (_tags: string[]) => void;
  error?: string;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  description?: string;
  suggestions?: string[];
  className?: string;
}

// Event type selector props
export interface EventTypeSelectorProps {
  value?: EventType;
  onChange: (_type: EventType) => void;
  error?: string;
  disabled?: boolean;
  showDescriptions?: boolean;
  className?: string;
}

// Form actions props
export interface EventFormActionsProps {
  onSubmit: () => void;
  onCancel?: () => void;
  onSaveDraft?: () => void;
  isSubmitting: boolean;
  isValid: boolean;
  mode: "create" | "edit";
  submitLabel?: string;
  cancelLabel?: string;
  saveDraftLabel?: string;
  className?: string;
}

// Event preview props
export interface EventPreviewProps {
  formData: EventCreationFormData;
  className?: string;
}

// Form validation status
export interface FormValidationStatus {
  isValid: boolean;
  hasErrors: boolean;
  fieldsWithErrors: string[];
  completionPercentage: number;
}

// Form step indicator props (for future wizard implementation)
export interface FormStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{
    id: string;
    label: string;
    isCompleted: boolean;
    hasErrors: boolean;
  }>;
  onStepClick?: (_stepId: string) => void;
}

// Event creation context value
export interface EventCreationContextValue {
  formData: EventCreationFormData;
  errors: EventCreationFormErrors;
  isLoading: boolean;
  isSubmitting: boolean;
  validationStatus: FormValidationStatus;
  bankAccounts: BankAccountOption[];
  isBankAccountsLoading: boolean;

  // Actions
  updateFormData: (data: Partial<EventCreationFormData>) => void;
  updateErrors: (errors: Partial<EventCreationFormErrors>) => void;
  submitForm: () => Promise<EventCreationResponse>;
  saveDraft: () => Promise<EventCreationResponse>;
  resetForm: () => void;
  validateForm: () => boolean;

  // Event handlers
  handleFieldChange: (_field: keyof EventCreationFormData, _value: any) => void;
  handleFieldBlur: (field: keyof EventCreationFormData) => void;
}

// Hook return types
export interface UseEventCreationFormReturn {
  formData: EventCreationFormData;
  errors: EventCreationFormErrors;
  isLoading: boolean;
  isSubmitting: boolean;
  validationStatus: FormValidationStatus;

  // Actions
  updateFormData: (data: Partial<EventCreationFormData>) => void;
  handleSubmit: () => Promise<EventCreationResponse>;
  handleSaveDraft: () => Promise<EventCreationResponse>;
  resetForm: () => void;
  validateField: (field: keyof EventCreationFormData) => void;
  validateForm: () => boolean;
}

export interface UseBankAccountsReturn {
  bankAccounts: BankAccountOption[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}
