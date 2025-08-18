"use client";

import React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import type { EventPaymentSettingsProps } from "./event-creation-form.types";

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
  const handleFieldChange = (field: keyof typeof formData, value: any) => {
    onChange({ [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment & Pricing</CardTitle>
        <CardDescription>Configure pricing and payment settings for your event.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Payment Required Toggle */}
        <FormField
          label="Event Pricing"
          description="Choose whether your event is free or requires payment"
        >
          <div className="flex items-center space-x-2">
            <Switch
              id="requires-payment"
              checked={formData.requiresPayment}
              onCheckedChange={(checked) => handleFieldChange("requiresPayment", checked)}
              disabled={isLoading}
            />
            <Label htmlFor="requires-payment">
              {formData.requiresPayment ? "Paid Event" : "Free Event"}
            </Label>
          </div>
        </FormField>

        {/* Payment Settings - Show only for paid events */}
        {formData.requiresPayment && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                label="Event Price"
                required={formData.requiresPayment}
                error={errors.price}
                description="Price per person"
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
                label="Currency"
                required={formData.requiresPayment}
                error={errors.currency}
                description="Currency for payments"
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
              label="Bank Account"
              required={formData.requiresPayment}
              error={errors.bankAccountId}
              description="Select the bank account for receiving payments"
            >
              <BankAccountSelector
                value={formData.bankAccountId}
                onChange={(bankAccountId) => handleFieldChange("bankAccountId", bankAccountId)}
                options={bankAccounts}
                error={errors.bankAccountId}
                required={formData.requiresPayment}
                disabled={isLoading}
                isLoading={isBankAccountsLoading}
                placeholder="Select a bank account"
                description="Choose which bank account will receive payments for this event"
              />
            </FormField>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default EventPaymentSettings;
