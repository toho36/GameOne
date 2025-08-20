"use client";

import { BankAccountCard } from "@/components/features/bank-accounts/bank-account-card";
import type { BankAccountListProps } from "@/types/components/bank-account-management.types";

export function BankAccountList({
  bankAccounts,
  isLoading,
  onEdit,
  onDelete,
  onToggleActive,
  onSetDefault,
}: BankAccountListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="h-6 w-40 rounded bg-gray-200"></div>
                  <div className="h-5 w-16 rounded bg-gray-200"></div>
                </div>
                <div className="h-4 w-48 rounded bg-gray-200"></div>
                <div className="h-4 w-64 rounded bg-gray-200"></div>
              </div>
              <div className="flex space-x-2">
                <div className="h-8 w-16 rounded bg-gray-200"></div>
                <div className="h-8 w-16 rounded bg-gray-200"></div>
                <div className="h-8 w-8 rounded bg-gray-200"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (bankAccounts.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto max-w-md">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-6 w-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">No bank accounts found</h3>
          <p className="text-gray-600">
            No bank accounts match your current search and filter criteria. Try adjusting your
            filters or add a new bank account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bankAccounts.map((bankAccount) => (
        <BankAccountCard
          key={bankAccount.id}
          bankAccount={bankAccount}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleActive={onToggleActive}
          onSetDefault={onSetDefault}
        />
      ))}
    </div>
  );
}
