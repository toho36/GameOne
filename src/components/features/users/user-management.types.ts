export interface User {
  id: string;
  kindeId?: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  status: string;
  phoneNumber?: string;
  preferredLocale: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  primaryRole?: Role;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  color?: string;
  priority: number;
  isSystem: boolean;
  isDefault: boolean;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserFilters {
  status?: string;
  role?: string;
  search?: string;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface RolesResponse {
  roles: Role[];
}

export interface UseUsersOptions {
  filters?: UserFilters;
  page?: number;
  limit?: number;
}

export interface UseUsersReturn {
  users: User[];
  pagination: UsersResponse["pagination"];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  // eslint-disable-next-line no-unused-vars
  setFilters: (filters: UserFilters) => void;
  // eslint-disable-next-line no-unused-vars
  setPage: (page: number) => void;
}

export interface UseRolesReturn {
  roles: Role[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UserManagementProps {
  className?: string;
}

export interface UserListProps {
  users: User[];
  isLoading: boolean;
  // eslint-disable-next-line no-unused-vars
  onEdit: (userId: string) => void;
  // eslint-disable-next-line no-unused-vars
  onUpdateRole: (userId: string, roleId: string) => void;
}

export interface UserFiltersProps {
  filters: UserFilters;
  // eslint-disable-next-line no-unused-vars
  onFiltersChange: (filters: UserFilters) => void;
  onClear: () => void;
}
