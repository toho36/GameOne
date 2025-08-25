"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, CheckCircle, AlertCircle } from "lucide-react";
import type { PaymentInfo, ClaimPaymentRequest } from "@/types/features/event-registration";

interface PaymentClaimingProps {
  payment: PaymentInfo;
  onPaymentClaimed: () => void;
}

export function PaymentClaiming({ payment, onPaymentClaimed }: PaymentClaimingProps) {
  const t = useTranslations("PaymentClaiming");
  const [isClaiming, setIsClaiming] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClaimPaymentRequest>({
    registrationId: payment.registrationId,
    transactionId: "",
    notes: "",
  });

  const handleInputChange = (field: keyof ClaimPaymentRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleClaimPayment = async () => {
    if (!formData.transactionId?.trim()) {
      setError(t("errors.transactionIdRequired"));
      return;
    }

    setIsClaiming(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${payment.registrationId}/claim-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsClaimed(true);
        onPaymentClaimed();
      } else {
        const errorData = await response.json();
        setError(errorData.error || t("errors.claimFailed"));
      }
    } catch {
      setError(t("errors.networkError"));
    } finally {
      setIsClaiming(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };

  const downloadQRCode = () => {
    if (payment.qrCode) {
      const link = document.createElement("a");
      link.href = payment.qrCode;
      link.download = `payment-qr-${payment.id}.png`;
      link.click();
    }
  };

  if (isClaimed) {
    return (
      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            {t("claimed.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700">{t("claimed.description")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t("title")}
          <Badge variant="secondary">{payment.status}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Information */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Payment Details */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">{t("payment.amount")}</Label>
              <div className="text-2xl font-bold text-gray-900">
                {payment.amount} {payment.currency}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">{t("payment.method")}</Label>
              <div className="text-gray-900">{payment.method}</div>
            </div>

            {payment.bankAccount && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">
                  {t("payment.bankAccount")}
                </Label>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("payment.accountHolder")}:</span>
                    <span className="font-medium">{payment.bankAccount.accountHolder}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("payment.accountNumber")}:</span>
                    <span className="font-mono font-medium">
                      {payment.bankAccount.accountNumber}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(payment.bankAccount!.accountNumber)}
                        className="ml-2 h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("payment.bankCode")}:</span>
                    <span className="font-mono font-medium">
                      {payment.bankAccount.bankCode}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(payment.bankAccount!.bankCode)}
                        className="ml-2 h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </span>
                  </div>
                  {payment.bankAccount.iban && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("payment.iban")}:</span>
                      <span className="font-mono font-medium">
                        {payment.bankAccount.iban}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(payment.bankAccount!.iban!)}
                          className="ml-2 h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* QR Code */}
          {payment.qrCode && (
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">{t("payment.qrCode")}</Label>
              <div className="text-center">
                <Image
                  src={payment.qrCode}
                  alt={t("payment.qrCodeAlt")}
                  width={192}
                  height={192}
                  className="mx-auto h-48 w-48 rounded-lg border border-gray-200"
                />
                <div className="mt-3 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadQRCode}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {t("payment.downloadQR")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Instructions */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t("instructions.description")}</AlertDescription>
        </Alert>

        {/* Claim Payment Form */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">{t("claim.title")}</h3>

          <div className="space-y-4">
            <div>
              <Label htmlFor="transactionId" className="text-sm font-medium text-gray-700">
                {t("claim.transactionId")} *
              </Label>
              <Input
                id="transactionId"
                value={formData.transactionId}
                onChange={(e) => handleInputChange("transactionId", e.target.value)}
                placeholder={t("claim.transactionIdPlaceholder")}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                {t("claim.notes")}
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder={t("claim.notesPlaceholder")}
                rows={3}
                className="mt-1"
              />
            </div>

            {error && (
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleClaimPayment}
              disabled={isClaiming || !formData.transactionId?.trim()}
              className="w-full"
            >
              {isClaiming ? t("claim.claiming") : t("claim.submit")}
            </Button>
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-2 text-sm text-gray-600">
          <p>{t("additional.info")}</p>
          <ul className="ml-4 list-inside list-disc space-y-1">
            <li>{t("additional.step1")}</li>
            <li>{t("additional.step2")}</li>
            <li>{t("additional.step3")}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
