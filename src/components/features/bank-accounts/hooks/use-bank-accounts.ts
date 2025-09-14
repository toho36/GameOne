"use client";

import { useState, useMemo, useCallback } from "react";

import { getJson } from "@/lib/api/client";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { normalizeApiError } from "@/lib/api/errors";
import { bankAccountsKeys } from "@/lib/api/query-keys";
import type { BankAccountsResponse } from "@/types/bank-account";
import type {
  UseBankAccountsOptions,
  UseBankAccountsReturn,
} from "@/types/components/bank-account-management.types";

export function useBankAccounts(options: UseBankAccountsOptions = {}): UseBankAccountsReturn {
  const { search, isActive, ownerId, page: initialPage = 1, limit = 20 } = options;

  const [filters, setFiltersState] = useState({
    search: search || "",
    isActive,
    ownerId,
  });
  const [page, setPage] = useState(initialPage);

  const qs = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== "")
      ),
    });
    return params.toString();
  }, [filters, page, limit]);

  const query = useQuery({
    queryKey: bankAccountsKeys.list({ filters, page, limit }),
    queryFn: async () => getJson<BankAccountsResponse>(`/api/bank-accounts?${qs}`),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const data = query.data as any;
  const bankAccounts = Array.isArray(data) ? data : data?.bankAccounts || [];
  const pagination = (data?.pagination as any) ?? {
    page,
    limit,
    totalCount: Array.isArray(data) ? data.length : data?.bankAccounts?.length || 0,
    totalPages: 1,
    hasMore: false,
  };

  const setFilters = useCallback(
    (newFilters: { search?: string; isActive?: boolean; ownerId?: string }) => {
      setFiltersState((prev) => ({ ...prev, ...newFilters }));
      setPage(1);
    },
    []
  );

  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return {
    bankAccounts,
    pagination,
    isLoading: query.isLoading,
    error: query.error ? normalizeApiError(query.error) : null,
    refetch: query.refetch,
    setFilters,
    setPage: handleSetPage,
  };
}
