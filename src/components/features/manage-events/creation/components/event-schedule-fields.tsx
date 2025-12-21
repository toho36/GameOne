"use client";

import React from "react";
import { useTranslations } from "next-intl";

import type { EventCreationFormData, EventCreationFormErrors } from "@/types/event";

interface EventScheduleFieldsProps {
  formData: EventCreationFormData;
  errors: EventCreationFormErrors;
  isLoading: boolean;
   
  updateFormData: (data: Partial<EventCreationFormData>) => void;
}

export function EventScheduleFields({
  formData,
  errors,
  isLoading,
  updateFormData,
}: EventScheduleFieldsProps) {
  const t = useTranslations("Events");

  return (
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
              ? new Date(formData.endDate.getTime() - formData.endDate.getTimezoneOffset() * 60000)
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
  );
}
