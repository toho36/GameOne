"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getJson, deleteJson } from "@/lib/api/client";
import { eventsKeys } from "@/lib/api/query-keys";
import type { MyRegistrationStatus } from "@/types/features/registration/my-registration.types";

export function useMyRegistration(eventId: string, enabled: boolean) {
  return useQuery({
    queryKey: eventsKeys.myRegistration(eventId),
    queryFn: () => getJson<MyRegistrationStatus>(`/api/events/${eventId}/registration`),
    enabled,
    staleTime: 10_000,
  });
}

export function useUnregister(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      deleteJson<{ id?: string; removedFromWaitingList?: boolean }>(
        `/api/events/${eventId}/registration`
      ),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: eventsKeys.participants(eventId) as any }),
        qc.invalidateQueries({ queryKey: eventsKeys.myRegistration(eventId) as any }),
      ]);
    },
  });
}
