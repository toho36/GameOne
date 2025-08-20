import { useState } from "react";

import type { BankAccount } from "@/types/bank-account";

export function useBankAccountModals() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBankAccount, setEditingBankAccount] = useState<BankAccount | null>(null);
  const [deletingBankAccount, setDeletingBankAccount] = useState<BankAccount | null>(null);

  const handleCreateBankAccount = () => {
    setEditingBankAccount(null);
    setIsCreateModalOpen(true);
  };

  const handleEditBankAccount = (bankAccount: BankAccount) => {
    setEditingBankAccount(bankAccount);
    setIsCreateModalOpen(true);
  };

  const handleDeleteBankAccount = (bankAccount: BankAccount) => {
    setDeletingBankAccount(bankAccount);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setEditingBankAccount(null);
  };

  const closeDeleteModal = () => {
    setDeletingBankAccount(null);
  };

  return {
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingBankAccount,
    deletingBankAccount,
    handleCreateBankAccount,
    handleEditBankAccount,
    handleDeleteBankAccount,
    closeCreateModal,
    closeDeleteModal,
  };
}

export default useBankAccountModals;
