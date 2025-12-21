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
  userRoles?: UserRole[];
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

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: string;
  assignedBy?: string;
  expiresAt?: string;
  isActive: boolean;
  role: Role;
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

  setFilters: (filters: UserFilters) => void;

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

  onEdit: (userId: string) => void;

  onUpdateRole: (userId: string, roleId: string) => void;
}

export interface UserFiltersProps {
  filters: UserFilters;

  onFiltersChange: (filters: UserFilters) => void;
  onClear: () => void;
}
