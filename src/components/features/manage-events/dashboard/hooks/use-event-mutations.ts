"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postJson, putJson, deleteJson } from "@/lib/api/client";
import { normalizeApiError } from "@/lib/api/errors";
import { eventsKeys } from "@/lib/api/query-keys";

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => postJson<any>("/api/events", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventsKeys.lists() });
    },
    onError: (e) => {
      throw new Error(normalizeApiError(e));
    },
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) =>
      putJson<any>(`/api/events/${id}`, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: eventsKeys.lists() });
      if (variables?.id) qc.invalidateQueries({ queryKey: eventsKeys.detail(variables.id) });
    },
    onError: (e) => {
      throw new Error(normalizeApiError(e));
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => deleteJson(`/api/events/${id}`),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: eventsKeys.lists() });
      if (id) qc.invalidateQueries({ queryKey: eventsKeys.detail(id) });
    },
    onError: (e) => {
      throw new Error(normalizeApiError(e));
    },
  });
}

