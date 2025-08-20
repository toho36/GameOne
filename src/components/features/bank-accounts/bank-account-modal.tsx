"use client";

import React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { BankAccountForm } from "./bank-account-form";
import type { BankAccountModalProps } from "@/types/components/bank-account-management.types";

export function BankAccountModal({
  isOpen,
  onClose,
  mode,
  initialData,
  onSubmit,
  isLoading = false,
  errors,
}: BankAccountModalProps) {
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const modalTitle = mode === "create" ? "Create Bank Account" : "Edit Bank Account";
  const modalDescription =
    mode === "create"
      ? "Add a new bank account to your organization. Fill in the required information below."
      : "Update the bank account information. Make sure all details are correct.";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
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
        <DialogHeader className="sr-only">
          <DialogTitle>{modalTitle}</DialogTitle>
          <DialogDescription>{modalDescription}</DialogDescription>
        </DialogHeader>

        <div className="p-1">
          <BankAccountForm
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onClose}
            isLoading={isLoading}
            errors={errors}
            mode={mode}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BankAccountModal;
