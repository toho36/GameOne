import { useState } from "react";

import { logger } from "@/lib/logger";
import type { BankAccount, BankAccountFormData, BankAccountFormErrors } from "@/types/bank-account";

interface UseBankAccountActionsProps {
  refetch: () => void;
  closeCreateModal: () => void;
  closeDeleteModal: () => void;
}

export function useBankAccountActions({
  refetch,
  closeCreateModal,
  closeDeleteModal,
}: UseBankAccountActionsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<BankAccountFormErrors>({});

  const handleToggleActive = async (bankAccountId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/bank-accounts/${bankAccountId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update bank account");
      }

      refetch();
    } catch (error) {
      logger.error("Update bank account status failed", error);
    }
  };

  const handleSetDefault = async (bankAccountId: string) => {
    try {
      const response = await fetch(`/api/bank-accounts/${bankAccountId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to set default bank account");
      }

      refetch();
    } catch (error) {
      logger.error("Set default bank account failed", error);
    }
  };

  const handleSubmitForm = async (
    data: BankAccountFormData,
    editingBankAccount: BankAccount | null
  ) => {
    setIsSubmitting(true);
    setFormErrors({});

    try {
      const url = editingBankAccount
        ? `/api/bank-accounts/${editingBankAccount.id}`
        : "/api/bank-accounts";

      const method = editingBankAccount ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.errors) {
          setFormErrors(error.errors);
        } else {
          setFormErrors({ general: error.message || "Failed to save bank account" });
        }
        throw new Error(error.message || "Failed to save bank account");
      }

      refetch();
      closeCreateModal();
    } catch (error) {
      logger.error("Bank account form submission failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async (deletingBankAccount: BankAccount | null) => {
    if (!deletingBankAccount) return;

    try {
      const response = await fetch(`/api/bank-accounts/${deletingBankAccount.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete bank account");
      }

      refetch();
      closeDeleteModal();
    } catch (error) {
      logger.error("Delete bank account failed", error);
    }
  };

  return {
    isSubmitting,
    formErrors,
    setFormErrors,
    handleToggleActive,
    handleSetDefault,
    handleSubmitForm,
    handleConfirmDelete,
  };
}

export default useBankAccountActions;
