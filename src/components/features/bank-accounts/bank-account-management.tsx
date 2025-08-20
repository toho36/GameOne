"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { BankAccountList } from "./bank-account-list";
import { BankAccountFilters } from "./bank-account-filters";
import { BankAccountModal } from "./bank-account-modal";
import { DeleteBankAccountModal } from "./delete-bank-account-modal";
import { useBankAccounts } from "./hooks/use-bank-accounts";
import { useBankAccountModals } from "./hooks/use-bank-account-modals";
import { useBankAccountActions } from "./hooks/use-bank-account-actions";

import type { BankAccountQueryParams } from "@/types/components/bank-account-management.types";

export function BankAccountManagement() {
  const [filters, setFilters] = React.useState<BankAccountQueryParams>({
    page: 1,
    limit: 10,
    search: "",
    isActive: undefined,
  });

  const { bankAccounts, pagination, isLoading, error, refetch } = useBankAccounts(filters);

  const {
    isCreateModalOpen,
    editingBankAccount,
    deletingBankAccount,
    handleCreateBankAccount,
    handleEditBankAccount,
    handleDeleteBankAccount,
    closeCreateModal,
    closeDeleteModal,
  } = useBankAccountModals();

  const {
    isSubmitting,
    formErrors,
    setFormErrors,
    handleToggleActive,
    handleSetDefault,
    handleSubmitForm,
    handleConfirmDelete,
  } = useBankAccountActions({
    refetch,
    closeCreateModal,
    closeDeleteModal,
  });

  const handleFilterChange = (newFilters: Partial<BankAccountQueryParams>) => {
    setFilters((prev: BankAccountQueryParams) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }));
  };

  const handleBankAccountEdit = (bankAccountId: string) => {
    const bankAccount = bankAccounts.find((ba) => ba.id === bankAccountId);
    if (bankAccount) {
      setFormErrors({});
      handleEditBankAccount(bankAccount);
    }
  };

  const handleBankAccountDelete = (bankAccountId: string) => {
    const bankAccount = bankAccounts.find((ba) => ba.id === bankAccountId);
    if (bankAccount) {
      handleDeleteBankAccount(bankAccount);
    }
  };

  const handleFormSubmit = (data: any) => {
    return handleSubmitForm(data, editingBankAccount);
  };

  const handleDeleteConfirm = () => {
    return handleConfirmDelete(deletingBankAccount);
  };

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bank Accounts</h1>
            <p className="text-sm text-gray-600">Manage your organization&apos;s bank accounts</p>
          </div>
          <Button onClick={handleCreateBankAccount}>
            <Plus className="mr-2 h-4 w-4" />
            Add Bank Account
          </Button>
        </div>

        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refetch()}
                  className="bg-red-50 text-red-800 hover:bg-red-100"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <BankAccountModal
          isOpen={isCreateModalOpen}
          onClose={closeCreateModal}
          onSubmit={handleFormSubmit}
          isLoading={isSubmitting}
          errors={formErrors}
          mode={editingBankAccount ? "edit" : "create"}
          initialData={editingBankAccount || undefined}
        />

        <DeleteBankAccountModal
          isOpen={!!deletingBankAccount}
          bankAccount={deletingBankAccount}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteConfirm}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Accounts</h1>
          <p className="text-sm text-gray-600">
            Manage your organization&apos;s bank accounts for event payments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {pagination.totalCount} {pagination.totalCount === 1 ? "account" : "accounts"}
          </Badge>
          <Button onClick={handleCreateBankAccount}>
            <Plus className="mr-2 h-4 w-4" />
            Add Bank Account
          </Button>
        </div>
      </div>

      {/* Filters */}
      <BankAccountFilters
        search={filters.search}
        onSearchChange={(search) => handleFilterChange({ search })}
        isActive={filters.isActive}
        onActiveFilterChange={(isActive) => handleFilterChange({ isActive })}
        onClear={() => setFilters({ page: 1, limit: 10, search: "", isActive: undefined })}
      />

      {/* Bank Accounts List */}
      <BankAccountList
        bankAccounts={bankAccounts}
        isLoading={isLoading}
        onEdit={handleBankAccountEdit}
        onDelete={handleBankAccountDelete}
        onToggleActive={handleToggleActive}
        onSetDefault={handleSetDefault}
      />

      {/* Modals */}
      <BankAccountModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
        errors={formErrors}
        mode={editingBankAccount ? "edit" : "create"}
        initialData={editingBankAccount || undefined}
      />

      <DeleteBankAccountModal
        isOpen={!!deletingBankAccount}
        bankAccount={deletingBankAccount}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

export default BankAccountManagement;
