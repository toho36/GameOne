"use client";

import React from "react";
import { useClaimPayment } from "@/components/features/registration/hooks/use-claim-payment";
import type { PaymentClaimButtonProps } from "./payment-claim-button.types";
import { useTranslations } from "next-intl";

export function PaymentClaimButton({ registrationId, onClaimed }: PaymentClaimButtonProps) {
  const claim = useClaimPayment(registrationId);
  const t = useTranslations("RegistrationUI.claimButton");
  return (
    <button
      type="button"
      onClick={() => claim.mutate({}, { onSuccess: () => onClaimed?.() })}
      className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
      disabled={claim.isPending}
      aria-busy={claim.isPending}
    >
      {claim.isPending ? t("sending") : t("sent")}
    </button>
  );
}

export default PaymentClaimButton;
