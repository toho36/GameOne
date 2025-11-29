"use client";

import React, { useMemo } from "react";
import type { PaymentInstructionsProps } from "./payment-instructions.types";
import { generateQRCodeURL } from "@/lib/qr-code";
import { useTranslations } from "next-intl";

export function PaymentInstructions({
  registrationId,
  event,
  qrCodeUrl,
}: PaymentInstructionsProps) {
  const t = useTranslations("RegistrationUI.paymentInstructions");
  const qrUrl = useMemo(() => {
    if (qrCodeUrl) return qrCodeUrl;
    const amount = event.price ?? 0;
    const date = new Date(event.startDate).toISOString().slice(0, 10);
    return generateQRCodeURL(event.title, date, amount);
  }, [qrCodeUrl, event]);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold">{t("title")}</h3>
        <p className="text-sm text-gray-600">{t("description")}</p>
      </div>
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrUrl}
          alt={t("qrAltWithDetails", {
            amount: event.price ?? 0,
            currency: event.currency ?? "CZK",
            title: event.title,
            id: registrationId,
          })}
          className="h-40 w-40 rounded border"
        />
        <div className="text-sm">
          <div>{t("amount", { amount: event.price ?? 0, currency: event.currency ?? "CZK" })}</div>
          <div>{t("reference", { id: registrationId })}</div>
          {/* Add visible account details if available in event object, otherwise just show reference */}
          <div className="mt-2 text-xs text-gray-500">
            <p>{t("scanOrPay")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentInstructions;
