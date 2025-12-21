"use client";

import React from "react";
import { useTranslations } from "next-intl";

import type {
  EventCreationFormData,
  EventCreationFormErrors,
  BankAccountOption,
} from "@/types/event";

interface EventPaymentSettingsProps {
  formData: EventCreationFormData;
  errors: EventCreationFormErrors;
  bankAccounts: BankAccountOption[];
  isLoading: boolean;
  isBankAccountsLoading: boolean;
   
  updateFormData: (data: Partial<EventCreationFormData>) => void;
}

export function EventPaymentSettings({
  formData,
  errors,
  bankAccounts,
  isLoading,
  isBankAccountsLoading,
  updateFormData,
}: EventPaymentSettingsProps) {
  const t = useTranslations("Events");

  return (
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
  );
}
