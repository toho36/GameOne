"use client";

import { useState } from "react";
import {
  PencilIcon,
  TrashIcon,
  StarIcon,
  EyeIcon,
  EyeSlashIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";

import { Button } from "@/components/ui/button";
import type { BankAccountCardProps } from "@/types/components/bank-account-management.types";

export function BankAccountCard({
  bankAccount,
  onEdit,
  onDelete,
  onToggleActive,
  onSetDefault,
  isUpdating = false,
}: BankAccountCardProps) {
  const [showFullAccount, setShowFullAccount] = useState(false);

  const formatAccountNumber = (accountNumber: string) => {
    if (showFullAccount) return accountNumber;

    if (accountNumber.length <= 6) return accountNumber;
    return `${accountNumber.slice(0, 4)}****${accountNumber.slice(-2)}`;
  };

  const formatIBAN = (iban?: string) => {
    if (!iban) return null;
    if (showFullAccount) return iban;

    return `${iban.slice(0, 8)}****${iban.slice(-4)}`;
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:border-gray-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header with name and badges */}
          <div className="mb-3 flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">{bankAccount.name}</h3>

            {bankAccount.isDefault && (
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                <StarSolidIcon className="mr-1 h-3 w-3" />
                Default
              </span>
            )}

            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                bankAccount.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
              }`}
            >
              {bankAccount.isActive ? "Active" : "Inactive"}
            </span>

            {bankAccount.qrCodeEnabled && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                <QrCodeIcon className="mr-1 h-3 w-3" />
                QR Enabled
              </span>
            )}
          </div>

          {/* Bank information */}
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Bank:</span>
              <span>{bankAccount.bankName}</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-medium">Account:</span>
              <span className="font-mono">{formatAccountNumber(bankAccount.accountNumber)}</span>
              <button
                onClick={() => setShowFullAccount(!showFullAccount)}
                className="text-gray-400 hover:text-gray-600"
                title={showFullAccount ? "Hide account details" : "Show full account details"}
              >
                {showFullAccount ? (
                  <EyeSlashIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-medium">Bank Code:</span>
              <span className="font-mono">{bankAccount.bankCode}</span>
            </div>

            {bankAccount.iban && (
              <div className="flex items-center space-x-2">
                <span className="font-medium">IBAN:</span>
                <span className="font-mono">{formatIBAN(bankAccount.iban)}</span>
              </div>
            )}

            {bankAccount.swift && (
              <div className="flex items-center space-x-2">
                <span className="font-medium">SWIFT:</span>
                <span className="font-mono">{bankAccount.swift}</span>
              </div>
            )}

            {bankAccount.owner && (
              <div className="flex items-center space-x-2">
                <span className="font-medium">Owner:</span>
                <span>{bankAccount.owner.name || bankAccount.owner.email}</span>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="mt-4 text-xs text-gray-400">
            Created: {new Date(bankAccount.createdAt).toLocaleDateString()}
            {bankAccount.updatedAt !== bankAccount.createdAt && (
              <> • Updated: {new Date(bankAccount.updatedAt).toLocaleDateString()}</>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-start space-x-2">
          {!bankAccount.isDefault && bankAccount.isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSetDefault(bankAccount.id)}
              disabled={isUpdating}
              className="flex items-center gap-1"
              title="Set as default"
            >
              <StarIcon className="h-4 w-4" />
              <span className="sr-only">Set as default</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleActive(bankAccount.id, !bankAccount.isActive)}
            disabled={isUpdating}
            className={`flex items-center gap-1 ${
              bankAccount.isActive
                ? "text-red-600 hover:text-red-700"
                : "text-green-600 hover:text-green-700"
            }`}
            title={bankAccount.isActive ? "Deactivate" : "Activate"}
          >
            {bankAccount.isActive ? "Deactivate" : "Activate"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(bankAccount.id)}
            disabled={isUpdating}
            className="flex items-center gap-1"
            title="Edit bank account"
          >
            <PencilIcon className="h-4 w-4" />
            <span className="sr-only">Edit {bankAccount.name}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(bankAccount.id)}
            disabled={isUpdating || bankAccount.isDefault}
            className="flex items-center gap-1 text-red-600 hover:text-red-700"
            title={bankAccount.isDefault ? "Cannot delete default account" : "Delete bank account"}
          >
            <TrashIcon className="h-4 w-4" />
            <span className="sr-only">Delete {bankAccount.name}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
