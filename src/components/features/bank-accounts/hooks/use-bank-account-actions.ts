import { useState } from "react";

import { logger } from "@/lib/logger";
import { normalizeApiError } from "@/lib/api/errors";
import {
  useCreateBankAccount,
  useUpdateBankAccount,
  useDeleteBankAccount,
} from "@/components/features/bank-accounts/hooks/use-bank-account-mutations";
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

  const createBankAccount = useCreateBankAccount();
  const updateBankAccount = useUpdateBankAccount();
  const deleteBankAccount = useDeleteBankAccount();

  const handleToggleActive = async (bankAccountId: string, isActive: boolean) => {
    try {
      await updateBankAccount.mutateAsync({ id: bankAccountId, payload: { isActive } });
      refetch();
    } catch (error) {
      logger.error("Update bank account status failed", normalizeApiError(error));
    }
  };

  const handleSetDefault = async (bankAccountId: string) => {
    try {
      await updateBankAccount.mutateAsync({ id: bankAccountId, payload: { isDefault: true } });
      refetch();
    } catch (error) {
      logger.error("Set default bank account failed", normalizeApiError(error));
    }
  };

  const handleSubmitForm = async (
    data: BankAccountFormData,
    editingBankAccount: BankAccount | null
  ) => {
    setIsSubmitting(true);
    setFormErrors({});

    try {
      try {
        if (editingBankAccount) {
          await updateBankAccount.mutateAsync({ id: editingBankAccount.id, payload: data as any });
        } else {
          await createBankAccount.mutateAsync(data as any);
        }
      } catch (e: any) {
        const message = normalizeApiError(e);
        setFormErrors({ general: message });
        throw e;
      }

      refetch();
      closeCreateModal();
    } catch (error) {
      logger.error("Bank account form submission failed", normalizeApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async (deletingBankAccount: BankAccount | null) => {
    if (!deletingBankAccount) return;

    try {
      await deleteBankAccount.mutateAsync(deletingBankAccount.id);
      refetch();
      closeDeleteModal();
    } catch (error) {
      setFormErrors({ general: `Cannot delete bank account: ${normalizeApiError(error)}` });
      logger.error("Delete bank account failed", normalizeApiError(error));
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
