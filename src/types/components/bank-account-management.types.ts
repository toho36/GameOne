import type { BankAccount, BankAccountFormData, BankAccountFormErrors } from "@/types/bank-account";

export interface UseBankAccountsOptions {
  search?: string;
  isActive?: boolean;
  ownerId?: string;
  page?: number;
  limit?: number;
}

export interface UseBankAccountsReturn {
  bankAccounts: BankAccount[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  // eslint-disable-next-line no-unused-vars
  setFilters: (filters: { search?: string; isActive?: boolean; ownerId?: string }) => void;
  // eslint-disable-next-line no-unused-vars
  setPage: (page: number) => void;
}

export interface BankAccountManagementProps {
  className?: string;
}

export interface BankAccountListProps {
  bankAccounts: BankAccount[];
  isLoading: boolean;
  // eslint-disable-next-line no-unused-vars
  onEdit: (bankAccountId: string) => void;
  // eslint-disable-next-line no-unused-vars
  onDelete: (bankAccountId: string) => void;
  // eslint-disable-next-line no-unused-vars
  onToggleActive: (bankAccountId: string, isActive: boolean) => void;
  // eslint-disable-next-line no-unused-vars
  onSetDefault: (bankAccountId: string) => void;
}

export interface BankAccountFiltersProps {
  search: string;
  // eslint-disable-next-line no-unused-vars
  onSearchChange: (search: string) => void;
  isActive?: boolean;
  // eslint-disable-next-line no-unused-vars
  onActiveFilterChange: (isActive?: boolean) => void;
  onClear: () => void;
}

export interface BankAccountFormProps {
  initialData?: Partial<BankAccountFormData>;
  // eslint-disable-next-line no-unused-vars
  onSubmit: (data: BankAccountFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  errors?: BankAccountFormErrors;
  mode: "create" | "edit";
}

export interface BankAccountCardProps {
  bankAccount: BankAccount;
  // eslint-disable-next-line no-unused-vars
  onEdit: (bankAccountId: string) => void;
  // eslint-disable-next-line no-unused-vars
  onDelete: (bankAccountId: string) => void;
  // eslint-disable-next-line no-unused-vars
  onToggleActive: (bankAccountId: string, isActive: boolean) => void;
  // eslint-disable-next-line no-unused-vars
  onSetDefault: (bankAccountId: string) => void;
  isUpdating?: boolean;
}

export interface BankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialData?: Partial<BankAccountFormData>;
  // eslint-disable-next-line no-unused-vars
  onSubmit: (data: BankAccountFormData) => Promise<void>;
  isLoading?: boolean;
  errors?: BankAccountFormErrors;
}

export interface DeleteBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  bankAccount: BankAccount | null;
  isLoading?: boolean;
}

export interface BankAccountQueryParams {
  page: number;
  limit: number;
  search: string;
  isActive?: boolean;
  ownerId?: string;
}
