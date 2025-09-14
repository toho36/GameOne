"use client";

import { useCallback } from "react";

import { getJson } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";
import { normalizeApiError } from "@/lib/api/errors";
import { bankAccountsKeys } from "@/lib/api/query-keys";
import type { BankAccountOption } from "@/types/event";
import type { UseBankAccountsReturn } from "@/types/components/event-creation-form.types";

export function useBankAccounts(): UseBankAccountsReturn {
  const query = useQuery({
    queryKey: bankAccountsKeys.list({ isActive: true, limit: 100 }),
    queryFn: async () => {
      const data = await getJson<any>("/api/bank-accounts?isActive=true&limit=100");
      const accounts = Array.isArray(data) ? data : (data?.bankAccounts ?? []);
      const formatted: BankAccountOption[] = accounts.map((account: any) => ({
        id: account.id,
        name: account.name,
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        isDefault: account.isDefault,
        isActive: account.isActive,
      }));
      formatted.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return a.name.localeCompare(b.name);
      });
      return formatted;
    },
    staleTime: 60_000,
  });

  const refetch = useCallback(() => {
    void query.refetch();
  }, [query]);

  return {
    bankAccounts: (query.data as BankAccountOption[] | undefined) ?? [],
    isLoading: query.isLoading,
    error: query.error ? normalizeApiError(query.error) : null,
    refetch,
  };
}
