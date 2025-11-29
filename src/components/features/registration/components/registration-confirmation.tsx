"use client";

import React, { useState, useEffect } from "react";
import type { RegistrationConfirmationProps } from "./registration-confirmation.types";
import { useRegistrationStatus } from "@/components/features/registration/hooks/use-registration-status";
import { PaymentInstructions } from "@/components/features/registration/components/payment-instructions";
import { PaymentClaimButton } from "@/components/features/registration/components/payment-claim-button";
import { RegistrationStatusCard } from "@/components/features/registration/components/registration-status-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { deleteJson } from "@/lib/api/client";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export function RegistrationConfirmation({ registrationId }: RegistrationConfirmationProps) {
  const t = useTranslations("RegistrationConfirmation");
  const router = useRouter();
  const { data, isLoading, isError } = useRegistrationStatus(registrationId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (cancelled && data?.event?.id) {
      timer = setTimeout(() => {
        router.push(`/events/${data.event.id}`);
      }, 3000);
    }
    return () => timer && clearTimeout(timer);
  }, [cancelled, data?.event?.id, router]);

  if (isLoading) return <div>Loading...</div>;
  if (isError || !data) return <div>Failed to load registration.</div>;

  const showPaymentInfo =
    data.paymentStatus === "PENDING_VERIFICATION" ||
    data.paymentStatus === "PAYMENT_SENT_AWAITING_VERIFICATION";
  const canClaimPayment = data.paymentStatus === "PENDING_VERIFICATION";

  return (
    <div className="space-y-6">
      <RegistrationStatusCard
        registrationId={data.id}
        status={data.status}
        paymentStatus={data.paymentStatus}
      />

      {showPaymentInfo && (
        <div className="space-y-4">
          <PaymentInstructions
            registrationId={data.id}
            event={data.event}
            qrCodeUrl={data.qrCodeUrl}
          />
          {canClaimPayment && <PaymentClaimButton registrationId={data.id} />}
        </div>
      )}

      {/* Unregister */}
      <div className="pt-2">
        <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
          {t("unregister")}
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmTitle")}</DialogTitle>
            <DialogDescription>{t("confirmMessage")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  setError(null);
                  await deleteJson(`/api/registrations/${registrationId}`);
                  setConfirmOpen(false);
                  setCancelled(true);
                } catch (e: any) {
                  setError(e?.message || "Failed to cancel registration");
                }
              }}
            >
              {t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {cancelled && (
        <div role="alert">
          <Alert variant="success" className="mt-2">
            <AlertDescription>
              {t("success")} {t("redirect")}
              <div className="mt-2">
                <Button
                  variant="link"
                  className="h-auto p-0 text-inherit underline"
                  onClick={() => router.push(`/events/${data.event.id}`)}
                >
                  {t("returnNow")}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {error && (
        <div role="alert">
          <Alert variant="error" className="mt-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}

export default RegistrationConfirmation;
