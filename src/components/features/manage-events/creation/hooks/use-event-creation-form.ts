"use client";

import { useState, useCallback, useEffect } from "react";

import { logger } from "@/lib/logger";
import { validateEventCreation, formatValidationErrors } from "@/lib/validation/event-creation";
import { DEFAULT_EVENT_FORM_DATA } from "@/types/event";

import type {
  EventCreationFormData,
  EventCreationFormErrors,
  EventCreationResponse,
} from "@/types/event";
import type {
  UseEventCreationFormReturn,
  FormValidationStatus,
} from "@/types/components/event-creation-form.types";

interface UseEventCreationFormOptions {
  initialData?: Partial<EventCreationFormData>;
  mode?: "create" | "edit";
  eventId?: string;
}

export function useEventCreationForm({
  initialData = {},
  mode = "create",
  eventId,
}: UseEventCreationFormOptions = {}): UseEventCreationFormReturn {
  // Form state
  const [formData, setFormData] = useState<EventCreationFormData>({
    ...DEFAULT_EVENT_FORM_DATA,
    ...initialData,
  });

  const [errors, setErrors] = useState<EventCreationFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate validation status
  const validationStatus: FormValidationStatus = {
    isValid: Object.keys(errors).length === 0,
    hasErrors: Object.keys(errors).length > 0,
    fieldsWithErrors: Object.keys(errors),
    completionPercentage: calculateCompletionPercentage(formData),
  };

  // Load existing event data in edit mode
  useEffect(() => {
    if (mode === "edit" && eventId) {
      loadEventData(eventId);
    }
  }, [mode, eventId]);

  // Load event data for editing
  const loadEventData = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${id}`);
      if (response.ok) {
        const event = await response.json();
        setFormData({
          ...DEFAULT_EVENT_FORM_DATA,
          ...event,
          startDate: new Date(event.startDate),
          endDate: event.endDate ? new Date(event.endDate) : undefined,
          registrationStartDate: event.registrationStartDate
            ? new Date(event.registrationStartDate)
            : undefined,
          registrationEndDate: event.registrationEndDate
            ? new Date(event.registrationEndDate)
            : undefined,
        });
      }
    } catch (error) {
      logger.error("Failed to load event data for editing", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update form data
  const updateFormData = useCallback(
    (data: Partial<EventCreationFormData>) => {
      setFormData((prev) => ({
        ...prev,
        ...data,
      }));

      // Clear related errors when field is updated
      const updatedFields = Object.keys(data);
      if (updatedFields.some((field) => field in errors)) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          updatedFields.forEach((field) => {
            delete newErrors[field as keyof EventCreationFormErrors];
          });
          return newErrors;
        });
      }
    },
    [errors]
  );

  // Validate individual field
  const validateField = useCallback(
    (field: keyof EventCreationFormData) => {
      const validation = validateEventCreation(formData);

      if (!validation.success) {
        const fieldErrors = formatValidationErrors(validation.error);
        const fieldError = fieldErrors[field];

        if (fieldError) {
          setErrors((prev) => ({ ...prev, [field]: fieldError }));
        } else {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
          });
        }
      }
    },
    [formData]
  );

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const validation = validateEventCreation(formData);

    if (!validation.success) {
      const formErrors = formatValidationErrors(validation.error);
      setErrors(formErrors);
      return false;
    }

    setErrors({});
    return true;
  }, [formData]);

  // Submit form
  const handleSubmit = useCallback(async (): Promise<EventCreationResponse> => {
    setIsSubmitting(true);

    try {
      if (!validateForm()) {
        return {
          success: false,
          errors,
          message: "Please fix validation errors before submitting.",
        };
      }

      const endpoint = mode === "create" ? "/api/events" : `/api/events/${eventId}`;
      const method = mode === "create" ? "POST" : "PUT";

      logger.debug("Sending event creation request", {
        endpoint,
        method,
        status: formData.status || "PUBLISHED",
        requiresPayment: !!formData.bankAccountId,
      });

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          status: formData.status || "PUBLISHED", // Use form status or default to published
          requiresPayment: !!formData.bankAccountId, // Set based on whether bank account is selected
        }),
      });

      const result = await response.json();
      logger.debug("Event creation response received", { status: response.status });

      if (response.ok) {
        return {
          success: true,
          event: result.event,
          message:
            mode === "create" ? "Event created successfully!" : "Event updated successfully!",
        };
      } else {
        return {
          success: false,
          errors: result.errors || {},
          message: result.message || "An error occurred while saving the event.",
        };
      }
    } catch (error) {
      logger.error("Event form submission failed", error);
      return {
        success: false,
        message: "An unexpected error occurred. Please try again.",
      };
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, errors, mode, eventId, validateForm]);

  // Save as draft
  const handleSaveDraft = useCallback(async (): Promise<EventCreationResponse> => {
    setIsSubmitting(true);

    try {
      const endpoint = mode === "create" ? "/api/events" : `/api/events/${eventId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          status: "DRAFT", // Save as draft
        }),
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          event: result.event,
          message: "Draft saved successfully!",
        };
      } else {
        return {
          success: false,
          errors: result.errors || {},
          message: result.message || "Failed to save draft.",
        };
      }
    } catch (error) {
      logger.error("Event draft save failed", error);
      return {
        success: false,
        message: "Failed to save draft. Please try again.",
      };
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, mode, eventId]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({ ...DEFAULT_EVENT_FORM_DATA, ...initialData });
    setErrors({});
  }, [initialData]);

  return {
    formData,
    errors,
    isLoading,
    isSubmitting,
    validationStatus,
    updateFormData,
    handleSubmit,
    handleSaveDraft,
    resetForm,
    validateField,
    validateForm,
  };
}

// Helper function to calculate completion percentage
function calculateCompletionPercentage(formData: EventCreationFormData): number {
  const requiredFields = ["title", "type", "capacity", "startDate", "country"];

  const optionalFields = [
    "description",
    "shortDescription",
    "venue",
    "address",
    "city",
    "websiteUrl",
    "imageUrl",
  ];

  const totalFields = requiredFields.length + optionalFields.length;
  let filledFields = 0;

  // Count required fields
  requiredFields.forEach((field) => {
    const value = formData[field as keyof EventCreationFormData];
    if (value !== undefined && value !== null && value !== "") {
      filledFields++;
    }
  });

  // Count optional fields
  optionalFields.forEach((field) => {
    const value = formData[field as keyof EventCreationFormData];
    if (value !== undefined && value !== null && value !== "") {
      filledFields++;
    }
  });

  return Math.round((filledFields / totalFields) * 100);
}
