"use client";

import { useState, useEffect, useCallback } from "react";

import type { BankAccountsResponse } from "@/types/bank-account";
import type {
  UseBankAccountsOptions,
  UseBankAccountsReturn,
} from "@/types/components/bank-account-management.types";

export function useBankAccounts(options: UseBankAccountsOptions = {}): UseBankAccountsReturn {
  const { search, isActive, ownerId, page: initialPage = 1, limit = 20 } = options;

  const [bankAccounts, setBankAccounts] = useState<BankAccountsResponse["bankAccounts"]>([]);
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit,
    totalCount: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [filters, setFiltersState] = useState({
    search: search || "",
    isActive,
    ownerId,
  });
  const [page, setPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBankAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(
            ([, value]) => value !== undefined && value !== null && value !== ""
          )
        ),
      });

      const response = await fetch(`/api/bank-accounts?${searchParams}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in again.");
        } else if (response.status === 403) {
          throw new Error("insufficient_permissions");
        } else if (response.status >= 500) {
          throw new Error("Server error. Please try again in a few moments.");
        } else {
          throw new Error("Failed to fetch bank accounts. Please check your connection.");
        }
      }

      const data: BankAccountsResponse = await response.json();

      setBankAccounts(Array.isArray(data) ? data : data.bankAccounts || []);

      // Handle pagination if provided
      if (data.pagination) {
        setPagination(data.pagination);
      } else {
        // Fallback for simple array response
        setPagination({
          page: 1,
          limit: Array.isArray(data) ? data.length : data.bankAccounts?.length || 0,
          totalCount: Array.isArray(data) ? data.length : data.bankAccounts?.length || 0,
          totalPages: 1,
          hasMore: false,
        });
      }
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Network error. Please check your internet connection and try again.");
      } else {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, filters]);

  useEffect(() => {
    fetchBankAccounts();
  }, [fetchBankAccounts]);

  const setFilters = useCallback(
    (newFilters: { search?: string; isActive?: boolean; ownerId?: string }) => {
      setFiltersState((prev) => ({ ...prev, ...newFilters }));
      setPage(1); // Reset to first page when filters change
    },
    []
  );

  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return {
    bankAccounts,
    pagination,
    isLoading,
    error,
    refetch: fetchBankAccounts,
    setFilters,
    setPage: handleSetPage,
  };
}
