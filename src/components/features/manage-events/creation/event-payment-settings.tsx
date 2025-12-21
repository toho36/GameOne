"use client";

import { useTranslations } from "next-intl";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import type { EventPaymentSettingsProps } from "@/types/components/event-creation-form.types";

import { FormField } from "./components/form-field";
import { BankAccountSelector } from "./components/bank-account-selector";

export function EventPaymentSettings({
  formData,
  errors,
  bankAccounts,
  onChange,
  isLoading,
  isBankAccountsLoading,
}: EventPaymentSettingsProps) {
  const t = useTranslations("Events");
  const handleFieldChange = (field: keyof typeof formData, value: any) => {
    onChange({ [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("payment.title")}</CardTitle>
        <CardDescription>{t("payment.description")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Payment Required Toggle */}
        <FormField label={t("payment.pricing")} description={t("payment.pricingDescription")}>
          <div className="flex items-center space-x-2">
            <Switch
              id="requires-payment"
              checked={formData.requiresPayment}
              onCheckedChange={(checked) => handleFieldChange("requiresPayment", checked)}
              disabled={isLoading}
            />
            <Label htmlFor="requires-payment">
              {formData.requiresPayment ? t("payment.paidEvent") : t("payment.freeEvent")}
            </Label>
          </div>
        </FormField>

        {/* Payment Settings - Show only for paid events */}
        {formData.requiresPayment && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                label={t("payment.eventPrice")}
                required={formData.requiresPayment}
                error={errors.price}
                description={t("payment.priceDescription")}
              >
                <Input
                  type="number"
                  min="0"
                  max="100000"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price || ""}
                  onChange={(e) =>
                    handleFieldChange(
                      "price",
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  disabled={isLoading}
                  className={errors.price ? "border-destructive" : ""}
                />
              </FormField>

              <FormField
                label={t("payment.currency")}
                required={formData.requiresPayment}
                error={errors.currency}
                description={t("payment.currencyDescription")}
              >
                <Input
                  placeholder="EUR"
                  value={formData.currency}
                  onChange={(e) => handleFieldChange("currency", e.target.value.toUpperCase())}
                  disabled={isLoading}
                  className={errors.currency ? "border-destructive" : ""}
                  maxLength={3}
                />
              </FormField>
            </div>

            <FormField
              label={t("payment.bankAccount")}
              required={formData.requiresPayment}
              error={errors.bankAccountId}
              description={t("payment.bankAccountDescription")}
            >
              <BankAccountSelector
                value={formData.bankAccountId}
                onChange={(bankAccountId) => handleFieldChange("bankAccountId", bankAccountId)}
                options={bankAccounts}
                error={errors.bankAccountId}
                required={formData.requiresPayment}
                disabled={isLoading}
                isLoading={isBankAccountsLoading}
                placeholder={t("payment.selectBankAccount")}
                description={t("payment.bankAccountHelp")}
              />
            </FormField>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default EventPaymentSettings;
