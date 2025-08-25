"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { MagnifyingGlassIcon, UserPlusIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { UserList } from "@/components/features/users/user-list";
import { UserFilters } from "@/components/features/users/user-filters";
import { useUsers } from "@/components/features/users/hooks/use-users";
import { logger } from "@/lib/logger";
import {
  UserManagementProps,
  UserFilters as UserFiltersType,
} from "@/types/components/user-management.types";

export function UserManagement({ className }: UserManagementProps) {
  const router = useRouter();
  const t = useTranslations("Users");
  const tCommon = useTranslations("Common");
  const [filters, setFilters] = useState<UserFiltersType>({});
  const [searchQuery, setSearchQuery] = useState("");

  const {
    users,
    pagination,
    isLoading,
    error,
    refetch,
    setFilters: updateFilters,
    setPage,
  } = useUsers({ filters: { ...filters, search: searchQuery } });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    updateFilters({ ...filters, search: query });
  };

  const handleFiltersChange = (newFilters: UserFiltersType) => {
    setFilters(newFilters);
    updateFilters({ ...newFilters, search: searchQuery });
  };

  const handleCreateUser = () => {
    router.push("/users/create");
  };

  const handleEditUser = (userId: string) => {
    router.push(`/users/${userId}/edit`);
  };

  const handleUpdateUserRole = async (userId: string, roleId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId }),
      });

      if (!response.ok) {
        const error = await response.json();
        // Log error and let the component handle UI feedback
        logger.error("Role update failed:", error);
        throw new Error(error.error || error.message || t("errors.roleUpdateFailed"));
      }

      refetch();
    } catch (error) {
      logger.error("Update user role error:", error);
      // Re-throw to let the UserList component handle error display
      throw error;
    }
  };

  const renderErrorState = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">{t("title")}</h2>
        <Button onClick={handleCreateUser} className="flex items-center gap-2">
          <UserPlusIcon className="h-5 w-5" />
          {t("addUser")}
        </Button>
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start space-x-3">
          <svg
            className="h-6 w-6 flex-shrink-0 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">{t("errors.loadFailed")}</h3>
            <p className="mt-1 text-sm text-red-700">
              {error && error.includes("insufficient_permissions")
                ? t("errors.insufficientPermissions")
                : t("errors.generalError")}
            </p>
            <div className="mt-4">
              <Button onClick={refetch} variant="outline" size="sm">
                {t("retryLoading")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (error) {
    return <div className={`${className || ""}`}>{renderErrorState()}</div>;
  }

  return (
    <div className={`space-y-6 ${className || ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">{t("title")}</h2>
        <Button onClick={handleCreateUser} className="flex items-center gap-2">
          <UserPlusIcon className="h-5 w-5" />
          {t("addUser")}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Filters */}
      <UserFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClear={() => {
          setFilters({});
          updateFilters({ search: searchQuery });
        }}
      />

      {/* User List */}
      <UserList
        users={users}
        isLoading={isLoading}
        onEdit={handleEditUser}
        onUpdateRole={handleUpdateUserRole}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => setPage(pagination.page - 1)}
          >
            {tCommon("previous")}
          </Button>

          <span className="text-sm text-gray-600">
            {tCommon("page")} {pagination.page} {tCommon("of")} {pagination.totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasMore}
            onClick={() => setPage(pagination.page + 1)}
          >
            {tCommon("next")}
          </Button>
        </div>
      )}
    </div>
  );
}
