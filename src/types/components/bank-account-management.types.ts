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

  setFilters: (filters: { search?: string; isActive?: boolean; ownerId?: string }) => void;

  setPage: (page: number) => void;
}

export interface BankAccountManagementProps {
  className?: string;
}

export interface BankAccountListProps {
  bankAccounts: BankAccount[];
  isLoading: boolean;

  onEdit: (bankAccountId: string) => void;

  onDelete: (bankAccountId: string) => void;

  onToggleActive: (bankAccountId: string, isActive: boolean) => void;

  onSetDefault: (bankAccountId: string) => void;
}

export interface BankAccountFiltersProps {
  search: string;

  onSearchChange: (search: string) => void;
  isActive?: boolean;

  onActiveFilterChange: (isActive?: boolean) => void;
  onClear: () => void;
}

export interface BankAccountFormProps {
  initialData?: Partial<BankAccountFormData>;

  onSubmit: (data: BankAccountFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  errors?: BankAccountFormErrors;
  mode: "create" | "edit";
}

export interface BankAccountCardProps {
  bankAccount: BankAccount;

  onEdit: (bankAccountId: string) => void;

  onDelete: (bankAccountId: string) => void;

  onToggleActive: (bankAccountId: string, isActive: boolean) => void;

  onSetDefault: (bankAccountId: string) => void;
  isUpdating?: boolean;
}

export interface BankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialData?: Partial<BankAccountFormData>;

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
