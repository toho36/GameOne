"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RegistrationForm } from "./registration-form";
import { RegistrationStatus } from "./registration-status";
import { WaitingListPosition } from "./waiting-list-position";
import type { PublicEvent, RegistrationStatusResponse } from "@/types/features/event-registration";

interface EventRegistrationProps {
  event: PublicEvent;
}

export function EventRegistration({ event }: EventRegistrationProps) {
  const t = useTranslations("EventRegistration");
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatusResponse | null>(
    null
  );

  const [, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const canRegister = event.canRegister && event.registrationOpen;
  const hasAvailableSpots = event.availableSpots !== undefined && event.availableSpots > 0;
  const isFull = event.availableSpots !== undefined && event.availableSpots <= 0;

  const handleRegistrationSuccess = (status: RegistrationStatusResponse) => {
    setRegistrationStatus(status);
    setError(null);
  };

  const handleRegistrationError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handlePaymentClaimed = async () => {
    // Refresh registration status after payment is claimed
    try {
      const response = await fetch(`/api/events/${event.id}/registration-status`);
      if (response.ok) {
        const status = await response.json();
        setRegistrationStatus(status);
      }
    } catch {
      setError("Failed to check registration status");
    }
  };

  if (registrationStatus) {
    return (
      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">{t("registrationSuccess.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <RegistrationStatus status={registrationStatus} onPaymentClaimed={handlePaymentClaimed} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t("title")}
          {!canRegister && (
            <Badge variant="secondary">{isFull ? t("status.full") : t("status.closed")}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Registration Status Summary */}
        <div className="grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 md:grid-cols-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{event.confirmedParticipants}</div>
            <div className="text-sm text-gray-600">{t("summary.confirmed")}</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{event.waitingListCount}</div>
            <div className="text-sm text-gray-600">{t("summary.waitingList")}</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {event.availableSpots !== undefined ? event.availableSpots : "∞"}
            </div>
            <div className="text-sm text-gray-600">{t("summary.availableSpots")}</div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="error">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Registration Form or Status Messages */}
        {canRegister && hasAvailableSpots ? (
          <RegistrationForm
            event={event}
            onSubmit={async (formData) => {
              setIsLoading(true);
              try {
                // Handle the registration submission
                const response = await fetch(`/api/events/${event.id}/register`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(formData),
                });

                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.error?.message || "Registration failed");
                }

                const result = await response.json();
                handleRegistrationSuccess(result.data);
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Registration failed";
                handleRegistrationError(errorMessage);
              } finally {
                setIsLoading(false);
              }
            }}
          />
        ) : isFull ? (
          <div className="py-8 text-center">
            <div className="mb-2 text-2xl font-bold text-gray-900">{t("full.title")}</div>
            <p className="mb-4 text-gray-600">{t("full.description")}</p>
            <WaitingListPosition eventId={event.id} />
          </div>
        ) : !event.registrationOpen ? (
          <div className="py-8 text-center">
            <div className="mb-2 text-2xl font-bold text-gray-900">{t("closed.title")}</div>
            <p className="text-gray-600">
              {event.registrationStartDate
                ? t("closed.opensLater", { date: event.registrationStartDate.toLocaleDateString() })
                : t("closed.description")}
            </p>
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="mb-2 text-2xl font-bold text-gray-900">{t("unavailable.title")}</div>
            <p className="text-gray-600">{t("unavailable.description")}</p>
          </div>
        )}

        {/* Event Information */}
        <div className="border-t pt-6">
          <h3 className="mb-3 font-semibold text-gray-900">{t("eventInfo.title")}</h3>
          <div className="grid grid-cols-1 gap-4 text-sm text-gray-600 md:grid-cols-2">
            <div>
              <span className="font-medium">{t("eventInfo.price")}:</span>
              <span className="ml-2">
                {event.price ? `${event.price} ${event.currency}` : t("eventInfo.free")}
              </span>
            </div>
            <div>
              <span className="font-medium">{t("eventInfo.approval")}:</span>
              <span className="ml-2">
                {event.requiresApproval
                  ? t("eventInfo.approvalRequired")
                  : t("eventInfo.approvalNotRequired")}
              </span>
            </div>
            <div>
              <span className="font-medium">{t("eventInfo.cancellation")}:</span>
              <span className="ml-2">{t("eventInfo.cancellationNotAllowed")}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
