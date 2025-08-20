"use client";

import React from "react";
import { Control } from "react-hook-form";
import { useTranslations } from "next-intl";

import { Switch } from "@/components/ui/switch";
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";

import type { BankAccountFormData } from "@/types/bank-account";

interface BankAccountSettingsProps {
  control: Control<BankAccountFormData>;
}

export function BankAccountSettings({ control }: BankAccountSettingsProps) {
  const t = useTranslations("BankAccounts");

  return (
    <div className="space-y-4 border-t border-gray-200 pt-6">
      <h3 className="text-base font-medium text-gray-900">{t("form.sections.settings")}</h3>

      <div className="space-y-4">
        {/* Is Default */}
        <FormField
          control={control}
          name="isDefault"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">{t("form.labels.isDefault")}</FormLabel>
                <FormDescription>{t("form.descriptions.isDefault")}</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-describedby="default-description"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Is Active */}
        <FormField
          control={control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">{t("form.labels.isActive")}</FormLabel>
                <FormDescription>{t("form.descriptions.isActive")}</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-describedby="active-description"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* QR Code Enabled */}
        <FormField
          control={control}
          name="qrCodeEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">{t("form.labels.qrCodeEnabled")}</FormLabel>
                <FormDescription>{t("form.descriptions.qrCodeEnabled")}</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-describedby="qr-description"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

export default BankAccountSettings;
