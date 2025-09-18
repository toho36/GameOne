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

  const names = data.participants?.map((p) => p.name).filter(Boolean) ?? [];

  return (
    <Card className="border">
      <CardContent className="space-y-2 p-4">
        <div className="text-sm font-medium text-gray-900">{t("count", { count: data.count })}</div>
        {names.length > 0 ? (
          <div className="text-sm text-gray-700">{names.join(", ")}</div>
        ) : (
          <div className="text-xs text-gray-500">{t("namesHidden")}</div>
        )}
      </CardContent>
    </Card>
  );
}

export default RegisteredUsersList;
