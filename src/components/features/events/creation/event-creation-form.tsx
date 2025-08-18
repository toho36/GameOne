"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import type { EventCreationFormProps } from "./event-creation-form.types";

import { useEventCreationForm } from "./hooks/use-event-creation-form";
import { useBankAccounts } from "./hooks/use-bank-accounts";
import { EventFormActions } from "./event-form-actions";

export function EventCreationForm({
  initialData,
  onSuccess,
  onCancel,
  mode = "create",
  eventId,
  className,
  ...props
}: EventCreationFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const {
    formData,
    errors,
    isLoading,
    isSubmitting,
    validationStatus,
    updateFormData,
    handleSubmit,
    handleSaveDraft,
    validateForm,
  } = useEventCreationForm({
    initialData,
    mode,
    eventId,
  });

  const {
    bankAccounts,
    isLoading: isBankAccountsLoading,
    error: bankAccountsError,
  } = useBankAccounts();

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await handleSubmit();

      if (response.success) {
        toast({
          title: mode === "create" ? "Event Created" : "Event Updated",
          description:
            mode === "create"
              ? "Your event has been created successfully."
              : "Your event has been updated successfully.",
          variant: "default",
        });

        if (onSuccess) {
          onSuccess(response);
        } else {
          // Always navigate back to events list
          router.push(`/dashboard/events`);
        }
      } else {
        toast({
          title: "Error",
          description: response.message || "An error occurred while saving the event.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Event creation/update error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle save as draft
  const handleSaveAsDraft = async () => {
    try {
      const response = await handleSaveDraft();

      if (response.success) {
        toast({
          title: "Draft Saved",
          description: "Your event draft has been saved.",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to save draft.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Draft save error:", error);
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className={cn("mx-auto max-w-4xl space-y-6 p-4 sm:space-y-8 sm:p-6", className)}
      {...props}
    >
      {/* Progress Indicator */}
      <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex justify-between text-sm font-medium text-blue-900">
          <span>Form Completion</span>
          <span>{validationStatus.completionPercentage}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${validationStatus.completionPercentage}%` }}
          />
        </div>
        <p className="text-xs text-blue-700">
          Complete all required fields to enable form submission
        </p>
      </div>

      {/* Bank accounts loading error */}
      {bankAccountsError && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Bank Account Warning</h3>
              <div className="mt-2 text-sm text-yellow-700">
                Unable to load bank accounts. Payment settings may be limited. Please refresh the
                page or contact support if this issue persists.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form validation summary */}
      {validationStatus.hasErrors && Object.keys(errors).length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc space-y-1 pl-5">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field}>
                      <strong className="capitalize">
                        {field.replace(/([A-Z])/g, " $1").trim()}:
                      </strong>{" "}
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simplified Form Fields */}
      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-900">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          />
          {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-900">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={formData.description || ""}
            onChange={(e) => updateFormData({ description: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          />
          {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
        </div>

        {/* Place/Address */}
        <div className="space-y-2">
          <label htmlFor="venue" className="block text-sm font-medium text-gray-900">
            Place/Address
          </label>
          <input
            type="text"
            id="venue"
            value={formData.venue || ""}
            onChange={(e) => updateFormData({ venue: e.target.value })}
            placeholder="e.g., Sportovní hala TJ JM Chodov, Mírového hnutí 2137"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          />
          {errors.venue && <p className="text-sm text-red-600">{errors.venue}</p>}
        </div>

        {/* Price and Capacity Row */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Price */}
          <div className="space-y-2">
            <label htmlFor="price" className="block text-sm font-medium text-gray-900">
              Price (CZK)
            </label>
            <input
              type="number"
              id="price"
              min="0"
              value={formData.price || 0}
              onChange={(e) => updateFormData({ price: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isLoading}
            />
            {errors.price && <p className="text-sm text-red-600">{errors.price}</p>}
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <label htmlFor="capacity" className="block text-sm font-medium text-gray-900">
              Capacity
            </label>
            <input
              type="number"
              id="capacity"
              min="1"
              value={formData.capacity}
              onChange={(e) => updateFormData({ capacity: parseInt(e.target.value) || 1 })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isLoading}
            />
            {errors.capacity && <p className="text-sm text-red-600">{errors.capacity}</p>}
          </div>
        </div>

        {/* Date and Time Row */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Start Date & Time */}
          <div className="space-y-2">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-900">
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              id="startDate"
              value={
                formData.startDate
                  ? new Date(
                      formData.startDate.getTime() - formData.startDate.getTimezoneOffset() * 60000
                    )
                      .toISOString()
                      .slice(0, 16)
                  : ""
              }
              onChange={(e) => updateFormData({ startDate: new Date(e.target.value) })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isLoading}
            />
            {errors.startDate && <p className="text-sm text-red-600">{errors.startDate}</p>}
          </div>

          {/* End Date & Time */}
          <div className="space-y-2">
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-900">
              End Date & Time
            </label>
            <input
              type="datetime-local"
              id="endDate"
              value={
                formData.endDate
                  ? new Date(
                      formData.endDate.getTime() - formData.endDate.getTimezoneOffset() * 60000
                    )
                      .toISOString()
                      .slice(0, 16)
                  : ""
              }
              onChange={(e) =>
                updateFormData({ endDate: e.target.value ? new Date(e.target.value) : undefined })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isLoading}
            />
            {errors.endDate && <p className="text-sm text-red-600">{errors.endDate}</p>}
          </div>
        </div>

        {/* Bank Account for Payments */}
        <div className="space-y-2">
          <label htmlFor="bankAccount" className="block text-sm font-medium text-gray-900">
            Bank Account for Payments
          </label>
          <select
            id="bankAccount"
            value={formData.bankAccountId || ""}
            onChange={(e) => updateFormData({ bankAccountId: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isLoading || isBankAccountsLoading}
          >
            <option value="">Select bank account</option>
            {bankAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} - {account.bankName}
              </option>
            ))}
          </select>
          {bankAccounts.length > 0 && formData.bankAccountId && (
            <div className="mt-2 rounded-md bg-gray-50 p-3 text-sm text-gray-600">
              <div className="font-medium">
                {bankAccounts.find((a) => a.id === formData.bankAccountId)?.name} (Default)
              </div>
              <div>
                Account: {bankAccounts.find((a) => a.id === formData.bankAccountId)?.accountNumber}
              </div>
              <div>
                {bankAccounts.find((a) => a.id === formData.bankAccountId)?.bankName} - Main event
                account
              </div>
            </div>
          )}
          {errors.bankAccountId && <p className="text-sm text-red-600">{errors.bankAccountId}</p>}
        </div>

        {/* Visibility */}
        <div className="space-y-2">
          <label htmlFor="status" className="block text-sm font-medium text-gray-900">
            Visibility
          </label>
          <select
            id="status"
            value={formData.status || "PUBLISHED"}
            onChange={(e) => updateFormData({ status: e.target.value as "DRAFT" | "PUBLISHED" })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="PUBLISHED">Visible</option>
            <option value="DRAFT">Hidden</option>
          </select>
          {errors.status && <p className="text-sm text-red-600">{errors.status}</p>}
        </div>
      </div>

      {/* Form Actions */}
      <EventFormActions
        onSubmit={() => handleFormSubmit({ preventDefault: () => {} } as React.FormEvent)}
        onCancel={handleCancel}
        onSaveDraft={handleSaveAsDraft}
        isSubmitting={isSubmitting}
        isValid={validationStatus.isValid}
        mode={mode}
      />
    </form>
  );
}

export default EventCreationForm;
