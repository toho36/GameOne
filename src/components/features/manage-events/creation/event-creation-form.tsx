"use client";

import React from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

import type { EventCreationFormProps } from "@/types/components/event-creation-form.types";

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
  const t = useTranslations("Events");

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
        title: t("errors.validationError"),
        description: t("errors.validationErrorDesc"),
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await handleSubmit();

      if (response.success) {
        toast({
          title: t(mode === "create" ? "success.created" : "success.updated"),
          description: t(mode === "create" ? "success.createdDesc" : "success.updatedDesc"),
          variant: "default",
        });

        if (onSuccess) {
          onSuccess(response);
        } else {
          // Always navigate back to events list
          router.push(`/manage-events`);
        }
      } else {
        toast({
          title: t("errors.validationError"),
          description: response.message || t("errors.generalError"),
          variant: "destructive",
        });
      }
    } catch (error) {
      logger.error("Event creation/update error:", error);
      toast({
        title: t("errors.validationError"),
        description: t("errors.generalError"),
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
          title: t("success.draftSaved"),
          description: t("success.draftSaved"),
          variant: "default",
        });

        if (onSuccess) {
          onSuccess(response);
        } else {
          router.push(`/manage-events`);
        }
      } else {
        toast({
          title: t("errors.validationError"),
          description: response.message || t("errors.generalError"),
          variant: "destructive",
        });
      }
    } catch (error) {
      logger.error("Save as draft error:", error);
      toast({
        title: t("errors.validationError"),
        description: t("errors.generalError"),
        variant: "destructive",
      });
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push(`/manage-events`);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600">{t("form.loading")}</p>
        </div>
      </div>
    );
  }

  // Show bank accounts error
  if (bankAccountsError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start space-x-3">
          <svg
            className="h-6 w-6 flex-shrink-0 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">{t("errors.loadFailed")}</h3>
            <p className="mt-1 text-sm text-red-700">
              {bankAccountsError.includes("insufficient_permissions")
                ? t("errors.permissionError")
                : t("errors.generalError")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleFormSubmit} className={`space-y-6 ${className || ""}`} {...props}>
      {/* Form Header */}
      {mode === "create" ? (
        <div className="border-b border-gray-200 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t("form.title.create")}</h1>
              <p className="mt-2 text-sm text-gray-600">{t("form.description.create")}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-b border-gray-200 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t("form.title.edit")}</h1>
              <p className="mt-2 text-sm text-gray-600">{t("form.description.edit")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Simplified Form Fields */}
      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-900">
            {t("form.labels.title")} *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            placeholder={t("form.placeholders.title")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          />
          {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-900">
            {t("form.labels.description")} *
          </label>
          <textarea
            id="description"
            rows={4}
            value={formData.description || ""}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder={t("form.placeholders.description")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          />
          {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
        </div>

        {/* Place/Address */}
        <div className="space-y-2">
          <label htmlFor="venue" className="block text-sm font-medium text-gray-900">
            {t("form.labels.venue")}
          </label>
          <input
            type="text"
            id="venue"
            value={formData.venue || ""}
            onChange={(e) => updateFormData({ venue: e.target.value })}
            placeholder={t("form.placeholders.venue")}
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
              {t("form.labels.price")} (CZK)
            </label>
            <input
              type="number"
              id="price"
              min="0"
              value={formData.price || 0}
              onChange={(e) => updateFormData({ price: parseFloat(e.target.value) || 0 })}
              placeholder={t("form.placeholders.price")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isLoading}
            />
            {errors.price && <p className="text-sm text-red-600">{errors.price}</p>}
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <label htmlFor="capacity" className="block text-sm font-medium text-gray-900">
              {t("form.labels.capacity")}
            </label>
            <input
              type="number"
              id="capacity"
              min="1"
              value={formData.capacity}
              onChange={(e) => updateFormData({ capacity: parseInt(e.target.value) || 1 })}
              placeholder={t("form.placeholders.capacity")}
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
              {t("form.labels.startDate")} *
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
              {t("form.labels.endDate")}
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
            {t("form.labels.bankAccount")}
          </label>
          <select
            id="bankAccount"
            value={formData.bankAccountId || ""}
            onChange={(e) => updateFormData({ bankAccountId: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isLoading || isBankAccountsLoading}
          >
            <option value="">{t("form.placeholders.selectBankAccount")}</option>
            {bankAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} - {account.bankName}
              </option>
            ))}
          </select>
          {bankAccounts.length > 0 && formData.bankAccountId && (
            <div className="mt-2 rounded-md bg-gray-50 p-3 text-sm text-gray-600">
              <div className="font-medium">
                {bankAccounts.find((a) => a.id === formData.bankAccountId)?.name} (
                {t("form.labels.default")})
              </div>
              <div>
                {t("form.labels.account")}:{" "}
                {bankAccounts.find((a) => a.id === formData.bankAccountId)?.accountNumber}
              </div>
              <div>
                {bankAccounts.find((a) => a.id === formData.bankAccountId)?.bankName} -{" "}
                {t("form.labels.mainEventAccount")}
              </div>
            </div>
          )}
          {errors.bankAccountId && <p className="text-sm text-red-600">{errors.bankAccountId}</p>}
        </div>

        {/* Visibility */}
        <div className="space-y-2">
          <label htmlFor="status" className="block text-sm font-medium text-gray-900">
            {t("form.labels.visibility")}
          </label>
          <select
            id="status"
            value={formData.status || "PUBLISHED"}
            onChange={(e) => updateFormData({ status: e.target.value as "DRAFT" | "PUBLISHED" })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="PUBLISHED">{t("form.labels.visible")}</option>
            <option value="DRAFT">{t("form.labels.hidden")}</option>
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
