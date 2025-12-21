"use client";

import React from "react";
import { useTranslations } from "next-intl";

import type { EventCreationFormData, EventCreationFormErrors } from "@/types/event";

interface EventBasicFieldsProps {
  formData: EventCreationFormData;
  errors: EventCreationFormErrors;
  isLoading: boolean;
   
  updateFormData: (data: Partial<EventCreationFormData>) => void;
}

export function EventBasicFields({
  formData,
  errors,
  isLoading,
  updateFormData,
}: EventBasicFieldsProps) {
  const t = useTranslations("Events");

  return (
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
    </div>
  );
}
