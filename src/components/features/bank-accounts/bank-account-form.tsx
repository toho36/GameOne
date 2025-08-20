"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { bankAccountFormSchema } from "@/lib/validation/bank-account";
import { logger } from "@/lib/logger";
import { useBankAccountForm } from "./hooks/use-bank-account-form";

import { BankAccountBasicFields } from "./components/bank-account-basic-fields";
import { BankAccountDetails } from "./components/bank-account-details";
import { BankAccountAdditionalFields } from "./components/bank-account-additional-fields";
import { BankAccountSettings } from "./components/bank-account-settings";

import type { BankAccountFormData } from "@/types/bank-account";
import type { BankAccountFormProps } from "@/types/components/bank-account-management.types";

export function BankAccountForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  errors,
  mode,
}: BankAccountFormProps) {
  const t = useTranslations("BankAccounts");

  const form = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountFormSchema) as any,
    defaultValues: {
      name: initialData?.name || "",
      iban: initialData?.iban || "",
      bankName: initialData?.bankName || "",
      accountNumber: initialData?.accountNumber || "",
      bankCode: initialData?.bankCode || "",
      swift: initialData?.swift || "",
      isDefault: initialData?.isDefault ?? false,
      isActive: initialData?.isActive ?? true,
      qrCodeEnabled: initialData?.qrCodeEnabled ?? true,
    },
  });

  // Use custom hook for IBAN auto-population
  useBankAccountForm(form);

  const handleSubmit = async (data: BankAccountFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      logger.error("Bank account form submission failed", error);
    }
  };

  const handleCancel = () => {
    form.reset();
    onCancel();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">{t(`form.title.${mode}`)}</h2>
        <p className="text-sm text-gray-600">{t(`form.description.${mode}`)}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <BankAccountBasicFields control={form.control} errors={errors} />

          <BankAccountDetails control={form.control} errors={errors} />

          <BankAccountAdditionalFields control={form.control} errors={errors} />

          <BankAccountSettings control={form.control} />

          {/* General Error */}
          {errors?.general && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700" role="alert">
                {errors.general}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
                  {t(mode === "create" ? "creating" : "updating")}
                </div>
              ) : (
                t(mode === "create" ? "create" : "update")
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default BankAccountForm;
