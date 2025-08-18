"use client";

import { useState, useEffect, useCallback } from "react";

import type { BankAccountOption } from "@/types/event";
import type { UseBankAccountsReturn } from "@/components/features/events/creation/event-creation-form.types";

export function useBankAccounts(): UseBankAccountsReturn {
  const [bankAccounts, setBankAccounts] = useState<BankAccountOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch bank accounts
  const fetchBankAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/bank-accounts");

      if (!response.ok) {
        throw new Error(`Failed to fetch bank accounts: ${response.status}`);
      }

      const data = await response.json();

      // Transform the data to match our interface
      const formattedAccounts: BankAccountOption[] = data.map((account: any) => ({
        id: account.id,
        name: account.name,
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        isDefault: account.isDefault,
        isActive: account.isActive,
      }));

      // Sort accounts: default first, then active, then alphabetically
      formattedAccounts.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return a.name.localeCompare(b.name);
      });

      setBankAccounts(formattedAccounts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching bank accounts:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchBankAccounts();
  }, [fetchBankAccounts]);

  // Refetch function
  const refetch = useCallback(() => {
    fetchBankAccounts();
  }, [fetchBankAccounts]);

  return {
    bankAccounts,
    isLoading,
    error,
    refetch,
  };
}
