"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postJson, putJson, deleteJson } from "@/lib/api/client";
import { normalizeApiError } from "@/lib/api/errors";
import { bankAccountsKeys } from "@/lib/api/query-keys";

export function useCreateBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => postJson<any>("/api/bank-accounts", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bankAccountsKeys.lists() });
    },
    onError: (e) => {
      throw new Error(normalizeApiError(e));
    },
  });
}

export function useUpdateBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) =>
      putJson<any>(`/api/bank-accounts/${id}`, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: bankAccountsKeys.lists() });
      if (variables?.id) qc.invalidateQueries({ queryKey: bankAccountsKeys.detail(variables.id) });
    },
    onError: (e) => {
      throw new Error(normalizeApiError(e));
    },
  });
}

export function useDeleteBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => deleteJson(`/api/bank-accounts/${id}`),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: bankAccountsKeys.lists() });
      if (id) qc.invalidateQueries({ queryKey: bankAccountsKeys.detail(id) });
    },
    onError: (e) => {
      throw new Error(normalizeApiError(e));
    },
  });
}

