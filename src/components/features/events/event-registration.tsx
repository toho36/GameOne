"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/api/client";
import { normalizeApiError } from "@/lib/api/errors";
import { RegistrationForm } from "./registration-form";
import { RegistrationConfirmation } from "@/components/features/registration/components/registration-confirmation";
import { WaitingListPosition } from "./waiting-list-position";
import { useSession } from "@/components/auth/session-provider";
import type { PublicEvent } from "@/types/features/event-registration";

interface EventRegistrationProps {
  event: PublicEvent;
}

export function EventRegistration({ event }: EventRegistrationProps) {
  const t = useTranslations("EventRegistration");
  const { isAuthenticated, isLoading } = useSession();
  const [confirmedRegistrationId, setConfirmedRegistrationId] = useState<string | null>(null);

  const [, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const canRegister = event.canRegister && event.registrationOpen;
  const hasAvailableSpots = event.availableSpots !== undefined && event.availableSpots > 0;
  const isFull = event.availableSpots !== undefined && event.availableSpots <= 0;

  const handleRegistrationSuccess = (registrationId: string) => {
    setConfirmedRegistrationId(registrationId);
    setError(null);
  };

  const handleRegistrationError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // Payment claiming handled in RegistrationConfirmation via detail endpoint

  if (confirmedRegistrationId) {
    return (
      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">{t("registrationSuccess.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <RegistrationConfirmation registrationId={confirmedRegistrationId} />
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
          isAuthenticated ? (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-gray-600">{t("authenticatedInfo")}</p>
              <Button
                disabled={isLoading}
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const result = await postJson<{ registrationId: string }>(
                      `/api/events/${event.id}/register`,
                      { numberOfGuests: 0 } as any
                    );
                    handleRegistrationSuccess(result.registrationId);
                  } catch (error) {
                    handleRegistrationError(normalizeApiError(error));
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                {t("registerCta")}
              </Button>
            </div>
          ) : (
            <RegistrationForm
              event={event}
              onSubmit={async (formData) => {
                setIsLoading(true);
                try {
                  const result = await postJson<{ registrationId: string }>(
                    `/api/events/${event.id}/register`,
                    formData as any
                  );
                  handleRegistrationSuccess(result.registrationId);
                } catch (error) {
                  handleRegistrationError(normalizeApiError(error));
                } finally {
                  setIsLoading(false);
                }
              }}
            />
          )
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
