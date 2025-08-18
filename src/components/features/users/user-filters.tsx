"use client";

import { Button } from "@/components/ui/button";
import { UserFiltersProps } from "@/components/features/users/user-management.types";
import { useRoles } from "@/components/features/users/hooks/use-roles";

export function UserFilters({ filters, onFiltersChange, onClear }: UserFiltersProps) {
  const { roles, isLoading: rolesLoading } = useRoles();

  const statusOptions = [
    { value: "ACTIVE", label: "Active" },
    { value: "PENDING_VERIFICATION", label: "Pending Verification" },
    { value: "SUSPENDED", label: "Suspended" },
    { value: "INACTIVE", label: "Inactive" },
  ];

  const hasActiveFilters = Object.values(filters).some((value) => value && value !== "");

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
            Status:
          </label>
          <select
            id="status-filter"
            value={filters.status || ""}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
            className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Role Filter */}
        <div className="flex items-center space-x-2">
          <label htmlFor="role-filter" className="text-sm font-medium text-gray-700">
            Role:
          </label>
          <select
            id="role-filter"
            value={filters.role || ""}
            onChange={(e) => onFiltersChange({ ...filters, role: e.target.value })}
            disabled={rolesLoading}
            className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="no-role">No Role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="text-gray-600 hover:text-gray-900"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.status && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
              Status:{" "}
              {statusOptions.find((s) => s.value === filters.status)?.label || filters.status}
            </span>
          )}
          {filters.role && (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
              Role:{" "}
              {filters.role === "no-role"
                ? "No Role"
                : roles.find((r) => r.id === filters.role)?.displayName || filters.role}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
