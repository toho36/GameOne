/* eslint-disable no-unused-vars */
import type { ComponentProps, ReactNode } from "react";
import type {
  EventCreationFormData,
  EventCreationFormErrors,
  EventCreationResponse,
  BankAccountOption,
} from "@/types/event";

// Wizard step configuration
export interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: ComponentType<WizardStepProps>;
  isOptional?: boolean;
  validation?: (data: EventCreationFormData) => string[];
}

// Component type without React namespace
type ComponentType<P = {}> = (props: P) => ReactNode;

// Wizard step props
export interface WizardStepProps {
  formData: EventCreationFormData;
  errors: EventCreationFormErrors;
  onChange: (data: Partial<EventCreationFormData>) => void;
  isLoading?: boolean;
  bankAccounts?: BankAccountOption[];
  isBankAccountsLoading?: boolean;
}

// Main wizard props
export interface EventCreationWizardProps extends ComponentProps<"div"> {
  initialData?: Partial<EventCreationFormData>;
  onSuccess?: (response: EventCreationResponse) => void;
  onCancel?: () => void;
  mode?: "create" | "edit";
  eventId?: string;
  initialStep?: string;
}

// Progress indicator props
export interface WizardProgressProps {
  steps: WizardStep[];
  currentStepId: string;
  completedSteps: string[];
  onStepClick?: (stepId: string) => void;
  className?: string;
}

// Step navigation props
export interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  canGoBack: boolean;
  canGoNext: boolean;
  canSubmit: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onSaveDraft?: () => void;
  className?: string;
}

// Step validation result
export interface StepValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Wizard context value
export interface WizardContextValue {
  currentStepId: string;
  currentStepIndex: number;
  steps: WizardStep[];
  formData: EventCreationFormData;
  errors: EventCreationFormErrors;
  completedSteps: string[];
  isLoading: boolean;
  isSubmitting: boolean;

  // Navigation
  goToStep: (stepId: string) => void;
  goToNext: () => void;
  goToBack: () => void;
  canGoNext: boolean;
  canGoBack: boolean;
  canSubmit: boolean;

  // Data management
  updateFormData: (data: Partial<EventCreationFormData>) => void;
  validateCurrentStep: () => StepValidationResult;
  markStepCompleted: (stepId: string) => void;

  // Actions
  handleSubmit: () => Promise<void>;
  handleSaveDraft: () => Promise<void>;
  handleCancel: () => void;
}

// Step wrapper component props
export interface WizardStepWrapperProps {
  step: WizardStep;
  isActive: boolean;
  isCompleted: boolean;
  children: ReactNode;
  className?: string;
}
