"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";

import { EventFormData } from "@/lib/schemas/event-schemas";
import { PaymentSettings } from "@/components/features/events/payment-settings";

interface PaymentStepProps {
  form: UseFormReturn<any>;
  bankAccounts?: Array<{
    id: string;
    name: string;
    accountNumber: string;
    iban?: string;
    swift?: string;
  }>;
  formData: EventFormData;
}

export function PaymentStep({ form, bankAccounts = [], formData }: PaymentStepProps) {
  return (
    <div className="space-y-6">
      <PaymentSettings form={form} bankAccounts={bankAccounts} formData={formData} />
    </div>
  );
}
