"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";

import { EventFormData } from "@/lib/schemas/event-schemas";
import { RegistrationSettings } from "@/components/features/events/registration-settings";

interface RegistrationStepProps {
  form: UseFormReturn<EventFormData>;
  locale: string;
  formData: EventFormData;
}

export function RegistrationStep({ form, locale, formData }: RegistrationStepProps) {
  return (
    <div className="space-y-6">
      <RegistrationSettings form={form} locale={locale} formData={formData} />
    </div>
  );
}
