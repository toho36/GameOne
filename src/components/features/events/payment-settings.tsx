"use client";

import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { CreditCard, DollarSign, QrCode, Building, AlertCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventFormData } from "@/lib/schemas/event-schemas";

interface PaymentSettingsProps {
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

const CURRENCY_OPTIONS = [
  { value: "EUR", label: "Euro (€)", symbol: "€", supportsQR: true },
  { value: "CZK", label: "Czech Koruna (Kč)", symbol: "Kč", supportsQR: true },
  { value: "USD", label: "US Dollar ($)", symbol: "$", supportsQR: false },
];

export function PaymentSettings({ form, bankAccounts = [], formData }: PaymentSettingsProps) {
  const [showQRPreview, setShowQRPreview] = useState(false);

  const selectedCurrency = CURRENCY_OPTIONS.find((c) => c.value === formData.currency);
  const selectedBankAccount = bankAccounts.find((account) => account.id === formData.bankAccountId);

  const canGenerateQR = selectedCurrency?.supportsQR && formData.price && formData.price > 0;

  const generateVariableSymbol = (): string => {
    // Generate a unique variable symbol for Slovak/Czech banking
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, "0");
    return `${timestamp}${random}`;
  };

  const generateQRCodeData = () => {
    if (!selectedBankAccount || !formData.price) return null;

    const variableSymbol = generateVariableSymbol();

    // Slovak QR payment format (SPAYD)
    const qrData = {
      iban: selectedBankAccount.iban || selectedBankAccount.accountNumber,
      amount: formData.price,
      currency: formData.currency,
      variableSymbol,
      message: `Payment for: ${formData.title}`,
    };

    return qrData;
  };

  const qrData = generateQRCodeData();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Settings
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure payment options for your event. You can make it free or set up paid
          registration.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Payment Toggle */}
        <FormField
          control={form.control}
          name="requiresPayment"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  This event requires payment
                </FormLabel>
                <FormDescription>
                  Check this if attendees need to pay to register for your event.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {formData.requiresPayment && (
          <div className="space-y-6 border-l-2 border-muted pl-6">
            {/* Price and Currency */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Price *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          className="pr-12"
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-sm text-muted-foreground">
                            {selectedCurrency?.symbol || "€"}
                          </span>
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      The price attendees will pay to register for your event.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCY_OPTIONS.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            <div className="flex items-center gap-2">
                              {currency.label}
                              {currency.supportsQR && (
                                <Badge variant="outline" className="text-xs">
                                  QR
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The currency for event payments. EUR and CZK support QR code generation.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Bank Account Selection */}
            {bankAccounts.length > 0 && (
              <FormField
                control={form.control}
                name="bankAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Bank Account *
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bank account for payments" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bankAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{account.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {account.accountNumber}
                                {account.iban && ` • ${account.iban}`}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the bank account where payments will be received.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* No Bank Account Warning */}
            {bankAccounts.length === 0 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Bank Account Required</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        You need to set up a bank account before you can accept payments. Please
                        contact your administrator to add bank account details.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* QR Code Generation */}
            {canGenerateQR && selectedBankAccount && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    <h4 className="font-medium">QR Code Payment</h4>
                    <Badge variant="secondary">Slovak Banking</Badge>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQRPreview(!showQRPreview)}
                  >
                    {showQRPreview ? "Hide Preview" : "Show Preview"}
                  </Button>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <QrCode className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        QR Code Generation Enabled
                      </h3>
                      <div className="mt-1 text-sm text-blue-700">
                        <p>
                          QR codes will be automatically generated for {selectedCurrency?.label}{" "}
                          payments. Attendees can scan the code with their banking app for easy
                          payment.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {showQRPreview && qrData && (
                  <div className="rounded-lg bg-muted p-4">
                    <h4 className="mb-3 font-medium">QR Code Preview Data</h4>
                    <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                      <div className="space-y-2">
                        <div>
                          <span className="text-muted-foreground">IBAN:</span>
                          <div className="font-mono text-xs">{qrData.iban}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Amount:</span>
                          <div className="font-medium">
                            {qrData.amount} {qrData.currency}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-muted-foreground">Variable Symbol:</span>
                          <div className="font-mono text-xs">{qrData.variableSymbol}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Message:</span>
                          <div className="text-xs">{qrData.message}</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">
                      * Actual QR codes will be generated dynamically for each registration
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment Summary */}
            <div className="rounded-lg bg-muted p-4">
              <h4 className="mb-3 font-medium">Payment Information Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">
                    {formData.price} {selectedCurrency?.symbol || formData.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Currency:</span>
                  <span>{selectedCurrency?.label || formData.currency}</span>
                </div>
                {selectedBankAccount && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Bank Account:</span>
                    <span className="text-xs">{selectedBankAccount.name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Payment Methods:</span>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-xs">
                      Bank Transfer
                    </Badge>
                    {canGenerateQR && (
                      <Badge variant="outline" className="text-xs">
                        QR Code
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                <p>
                  <strong>Note:</strong> Attendees will receive payment instructions via email after
                  registration.
                  {canGenerateQR && " QR codes for Slovak banking will be automatically generated."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Free Event Display */}
        {!formData.requiresPayment && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Free Event</h3>
                <div className="mt-1 text-sm text-green-700">
                  <p>This event is free to attend. Attendees can register without payment.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
