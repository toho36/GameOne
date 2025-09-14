"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postJson, putJson, deleteJson } from "@/lib/api/client";
import { normalizeApiError } from "@/lib/api/errors";
import { usersKeys } from "@/lib/api/query-keys";

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => postJson<any>("/api/users", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersKeys.lists() });
    },
    onError: (e) => {
      throw new Error(normalizeApiError(e));
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) =>
      putJson<any>(`/api/users/${id}`, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: usersKeys.lists() });
      if (variables?.id) qc.invalidateQueries({ queryKey: usersKeys.detail(variables.id) });
    },
    onError: (e) => {
      throw new Error(normalizeApiError(e));
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => deleteJson(`/api/users/${id}`),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: usersKeys.lists() });
      if (id) qc.invalidateQueries({ queryKey: usersKeys.detail(id) });
    },
    onError: (e) => {
      throw new Error(normalizeApiError(e));
    },
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, roleId }: { id: string; roleId: string }) =>
      putJson(`/api/users/${id}/role`, { roleId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersKeys.lists() });
    },
    onError: (e) => {
      throw new Error(normalizeApiError(e));
    },
  });
}
