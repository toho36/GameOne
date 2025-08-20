"use client";

import React from "react";
import { Control } from "react-hook-form";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import type { BankAccountFormData, BankAccountFormErrors } from "@/types/bank-account";

interface BankAccountDetailsProps {
  control: Control<BankAccountFormData>;
  errors?: BankAccountFormErrors;
}

export function BankAccountDetails({ control, errors }: BankAccountDetailsProps) {
  const t = useTranslations("BankAccounts");

  return (
    <div className="space-y-4 border-t border-gray-200 pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-gray-900">{t("form.sections.details")}</h3>
        <p className="text-sm text-gray-500">({t("form.labels.autoFilled")})</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Bank Code */}
        <FormField
          control={control}
          name="bankCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.labels.bankCode")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("form.placeholders.bankCode")}
                  maxLength={4}
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    field.onChange(value);
                  }}
                  aria-describedby="bank-code-description"
                  className={cn(errors?.bankCode && "border-destructive", "bg-gray-50")}
                />
              </FormControl>
              <FormDescription id="bank-code-description">
                {t("form.labels.bankCodeDesc")}
              </FormDescription>
              <FormMessage />
              {errors?.bankCode && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.bankCode}
                </p>
              )}
            </FormItem>
          )}
        />

        {/* Bank Name */}
        <FormField
          control={control}
          name="bankName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.labels.bankName")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("form.placeholders.bankName")}
                  {...field}
                  aria-describedby="bank-name-description"
                  className={cn(errors?.bankName && "border-destructive", "bg-gray-50")}
                />
              </FormControl>
              <FormDescription id="bank-name-description">
                {t("form.labels.bankNameDesc")}
              </FormDescription>
              <FormMessage />
              {errors?.bankName && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.bankName}
                </p>
              )}
            </FormItem>
          )}
        />
      </div>

      {/* Account Number */}
      <FormField
        control={control}
        name="accountNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("form.labels.accountNumber")}</FormLabel>
            <FormControl>
              <Input
                placeholder={t("form.placeholders.accountNumber")}
                {...field}
                aria-describedby="account-number-description"
                className={cn(errors?.accountNumber && "border-destructive", "bg-gray-50")}
              />
            </FormControl>
            <FormDescription id="account-number-description">
              {t("form.labels.accountNumberDesc")}
            </FormDescription>
            <FormMessage />
            {errors?.accountNumber && (
              <p className="text-sm text-destructive" role="alert">
                {errors.accountNumber}
              </p>
            )}
          </FormItem>
        )}
      />
    </div>
  );
}

export default BankAccountDetails;
