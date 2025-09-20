"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api/client";
import { eventsKeys } from "@/lib/api/query-keys";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type {
  RegisteredUsersListProps,
  ParticipantsApiResponse,
} from "./types/registered-users-list.types";

export function RegisteredUsersList({ eventId }: RegisteredUsersListProps) {
  const t = useTranslations("RegisteredUsers");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: eventsKeys.participants(eventId),
    queryFn: () => getJson<ParticipantsApiResponse>(`/api/events/${eventId}/participants`),
  });

  if (isLoading) return <div className="text-sm text-gray-500">{t("loading")}</div>;
  if (isError || !data)
    return (
      <div className="flex items-center gap-2 text-sm text-red-600">
        {t("error")}
        <Button size="sm" variant="secondary" onClick={() => refetch()}>
          {t("retry")}
        </Button>
      </div>
    );

  const legacyParticipants = (data as any).participants as
    | Array<{ id: string; name: string } | undefined>
    | undefined;
  const isLegacy = typeof (data as any).count === "number";
  const confirmed = data.confirmed ?? legacyParticipants ?? [];
  const waiting = data.waiting ?? [];
  // Narrow out possible undefined entries coming from legacy payloads
  type Participant = {
    id: string;
    name: string;
    registrationStatus?: string;
    paymentStatus?: string;
  };
  const confirmedList: Participant[] = Array.isArray(confirmed)
    ? (confirmed.filter((p): p is Participant => p != null) as Participant[])
    : [];
  const waitingList: Participant[] = Array.isArray(waiting)
    ? (waiting.filter((p): p is Participant => p != null) as Participant[])
    : [];

  const countConfirmed = data.counts?.confirmed ?? (data as any).count ?? confirmedList.length;
  const countWaiting = data.counts?.waiting ?? waitingList.length;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border">
        <CardContent className="space-y-2 p-4">
          <div className="text-sm font-semibold text-green-700">
            {t("confirmedSection")} ({countConfirmed})
          </div>
          <div className="text-xs text-gray-500">{t("count", { count: countConfirmed })}</div>
          {confirmed.length > 0 ? (
            <>
              {Array.isArray(legacyParticipants) && legacyParticipants.length > 0 && (
                <div className="text-sm text-gray-800">
                  {legacyParticipants
                    .map((p) => p?.name)
                    .filter(Boolean)
                    .join(", ")}
                </div>
              )}

              <ul className="list-inside list-disc text-sm text-gray-800">
                {confirmedList.map((p) => (
                  <li key={p.id} className="flex items-center justify-between">
                    <span>{p.name}</span>
                    <span className="text-xs text-gray-500">
                      {[p.registrationStatus, p.paymentStatus].filter(Boolean).join(" • ")}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="text-xs text-gray-500">{t("namesHidden")}</div>
          )}
        </CardContent>
      </Card>

      {!isLegacy && (
        <Card className="border">
          <CardContent className="space-y-2 p-4">
            <div className="text-sm font-semibold text-amber-700">
              {t("waitingSection")} ({countWaiting})
            </div>
            {waiting.length > 0 ? (
              <ul className="list-inside list-disc text-sm text-gray-800">
                {waitingList.map((p) => (
                  <li key={p.id} className="flex items-center justify-between">
                    <span>{p.name}</span>
                    <span className="text-xs text-gray-500">
                      {[p.registrationStatus, p.paymentStatus].filter(Boolean).join(" • ")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-gray-500">{t("namesHidden")}</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default RegisteredUsersList;
