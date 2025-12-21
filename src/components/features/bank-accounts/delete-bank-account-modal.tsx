"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

import type { DeleteBankAccountModalProps } from "@/types/components/bank-account-management.types";

export function DeleteBankAccountModal({
  isOpen,
  onClose,
  onConfirm,
  bankAccount,
  isLoading = false,
}: DeleteBankAccountModalProps) {
  const t = useTranslations("BankAccounts");

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      // Error handling is managed by parent component
      logger.error("Bank account deletion confirmation failed", error);
    }
  };

  if (!bankAccount) {
    return null;
  }

  const isDefaultAccount = bankAccount.isDefault;
  const canDelete = !isDefaultAccount;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-md"
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking outside while loading
          if (isLoading) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing with escape key while loading
          if (isLoading) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <span>{t("delete.title")}</span>
          </DialogTitle>
          <DialogDescription className="text-left">
            {canDelete ? (
              <>
                {t("delete.confirmMessage", { name: bankAccount.name })}
                <br />
                <br />
                {t("delete.warning")}
              </>
            ) : (
              <>
                {t("delete.cannotDelete", { name: bankAccount.name })}
                <br />
                <br />
                {t("delete.setAnotherDefault")}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Account Details */}
          <div className="rounded-lg bg-gray-50 p-4">
            <h4 className="mb-2 text-sm font-medium text-gray-900">{t("delete.accountDetails")}</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>{t("delete.bank")}:</span>
                <span className="font-medium">{bankAccount.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("delete.account")}:</span>
                <span className="font-mono">{bankAccount.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("bankCode")}:</span>
                <span className="font-mono">{bankAccount.bankCode}</span>
              </div>
              {bankAccount.iban && (
                <div className="flex justify-between">
                  <span>{t("iban")}:</span>
                  <span className="font-mono text-xs">{bankAccount.iban}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{t("Common.status")}:</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${bankAccount.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                      }`}
                  >
                    {t(bankAccount.isActive ? "status.active" : "status.inactive")}
                  </span>
                  {bankAccount.isDefault && (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                      {t("default")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Warning for default account */}
          {isDefaultAccount && (
            <div className="rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">{t("delete.defaultWarning")}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {t("cancel")}
            </Button>
            {canDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirm}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
                    {t("deleting")}
                  </div>
                ) : (
                  t("deleteAccount")
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteBankAccountModal;
