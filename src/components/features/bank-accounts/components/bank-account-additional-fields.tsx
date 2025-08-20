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

interface BankAccountAdditionalFieldsProps {
  control: Control<BankAccountFormData>;
  errors?: BankAccountFormErrors;
}

export function BankAccountAdditionalFields({ control, errors }: BankAccountAdditionalFieldsProps) {
  const t = useTranslations("BankAccounts");

  return (
    <div className="space-y-4 border-t border-gray-200 pt-6">
      <h3 className="text-base font-medium text-gray-900">{t("form.sections.additional")}</h3>

      {/* SWIFT */}
      <FormField
        control={control}
        name="swift"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("form.labels.swift")}</FormLabel>
            <FormControl>
              <Input
                placeholder={t("form.placeholders.swift")}
                {...field}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  field.onChange(value);
                }}
                aria-describedby="swift-description"
                className={cn(errors?.swift && "border-destructive")}
              />
            </FormControl>
            <FormDescription id="swift-description">{t("form.labels.swiftDesc")}</FormDescription>
            <FormMessage />
            {errors?.swift && (
              <p className="text-sm text-destructive" role="alert">
                {errors.swift}
              </p>
            )}
          </FormItem>
        )}
      />
    </div>
  );
}

export default BankAccountAdditionalFields;
