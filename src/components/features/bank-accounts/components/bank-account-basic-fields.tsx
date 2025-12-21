"use client";

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
import { formatIBAN } from "@/lib/validation/bank-account";

import type { BankAccountFormData, BankAccountFormErrors } from "@/types/bank-account";

interface BankAccountBasicFieldsProps {
  control: Control<BankAccountFormData>;
  errors?: BankAccountFormErrors;
}

export function BankAccountBasicFields({ control, errors }: BankAccountBasicFieldsProps) {
  const t = useTranslations("BankAccounts");

  return (
    <>
      {/* Account Name */}
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("form.labels.name")} *</FormLabel>
            <FormControl>
              <Input
                placeholder={t("form.placeholders.name")}
                {...field}
                aria-describedby="name-description"
                className={cn(errors?.name && "border-destructive")}
              />
            </FormControl>
            <FormDescription id="name-description">{t("form.labels.nameDesc")}</FormDescription>
            <FormMessage />
            {errors?.name && (
              <p className="text-sm text-destructive" role="alert">
                {errors.name}
              </p>
            )}
          </FormItem>
        )}
      />

      {/* IBAN - Primary Field */}
      <FormField
        control={control}
        name="iban"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("form.labels.iban")} *</FormLabel>
            <FormControl>
              <Input
                placeholder={t("form.placeholders.iban")}
                {...field}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/\s/g, "");
                  field.onChange(value);
                }}
                onBlur={(e) => {
                  const formatted = formatIBAN(e.target.value);
                  field.onChange(formatted.replace(/\s/g, ""));
                }}
                aria-describedby="iban-description"
                className={cn(errors?.iban && "border-destructive")}
              />
            </FormControl>
            <FormDescription id="iban-description">{t("form.labels.ibanDesc")}</FormDescription>
            <FormMessage />
            {errors?.iban && (
              <p className="text-sm text-destructive" role="alert">
                {errors.iban}
              </p>
            )}
          </FormItem>
        )}
      />
    </>
  );
}

export default BankAccountBasicFields;
