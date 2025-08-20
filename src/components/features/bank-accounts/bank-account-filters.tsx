"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { BankAccountFiltersProps } from "@/types/components/bank-account-management.types";

export function BankAccountFilters({
  search,
  onSearchChange,
  isActive,
  onActiveFilterChange,
  onClear,
}: BankAccountFiltersProps) {
  const t = useTranslations("BankAccounts");
  const tCommon = useTranslations("Common");

  const hasActiveFilters = search || isActive !== undefined;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="min-w-64 flex-1">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t("filters.searchPlaceholder")}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Active Status Filter */}
        <div className="flex items-center space-x-2">
          <label htmlFor="active-filter" className="text-sm font-medium text-gray-700">
            {t("filters.status")}:
          </label>
          <select
            id="active-filter"
            value={isActive === undefined ? "" : isActive.toString()}
            onChange={(e) => {
              const value = e.target.value;
              onActiveFilterChange(value === "" ? undefined : value === "true");
            }}
            className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">{tCommon("all")}</option>
            <option value="true">{t("status.active")}</option>
            <option value="false">{t("status.inactive")}</option>
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
            {tCommon("clear")} {tCommon("filters")}
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {search && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
              {t("filters.search")}: &quot;{search}&quot;
            </span>
          )}
          {isActive !== undefined && (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
              {t("filters.status")}: {isActive ? t("status.active") : t("status.inactive")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
