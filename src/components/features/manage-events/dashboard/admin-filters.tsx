"use client";

import { useState } from "react";
import { FunnelIcon, UserIcon, CalendarIcon, XMarkIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface AdminFiltersProps {
   
  onFiltersChange: (filterOptions: AdminFilterOptions) => void;
  isAdmin: boolean;
  availableCreators: { id: string; name: string }[];
}

export interface AdminFilterOptions {
  creatorId?: string;
  dateRange?: "all" | "today" | "week" | "month" | "year";
  status?: "all" | "draft" | "published" | "cancelled";
  search?: string;
}

export function AdminFilters({ onFiltersChange, isAdmin, availableCreators }: AdminFiltersProps) {
  const [filters, setFilters] = useState<AdminFilterOptions>({});
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isAdmin) {
    return null;
  }

  const updateFilter = (key: keyof AdminFilterOptions, value: string | undefined) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {};
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some((value) => value && value !== "all");

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">Admin Filters</h3>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              {Object.values(filters).filter((v) => v && v !== "all").length} active
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-1 text-gray-500"
            >
              <XMarkIcon className="h-4 w-4" />
              Clear
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? "Hide" : "Show"} Filters
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Creator Filter */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              <UserIcon className="mr-1 inline h-4 w-4" />
              Creator
            </label>
            <Select
              value={filters.creatorId || "all"}
              onValueChange={(value: string) =>
                updateFilter("creatorId", value === "all" ? undefined : value)
              }
            >
              <option value="all">All Creators</option>
              {availableCreators.map((creator) => (
                <option key={creator.id} value={creator.id}>
                  {creator.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              <CalendarIcon className="mr-1 inline h-4 w-4" />
              Date Range
            </label>
            <Select
              value={filters.dateRange || "all"}
              onValueChange={(value: string) =>
                updateFilter("dateRange", value === "all" ? undefined : value)
              }
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </Select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <Select
              value={filters.status || "all"}
              onValueChange={(value: string) =>
                updateFilter("status", value === "all" ? undefined : value)
              }
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>

          {/* Search Filter */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Search</label>
            <Input
              type="text"
              placeholder="Search events..."
              value={filters.search || ""}
              onChange={(e) => updateFilter("search", e.target.value || undefined)}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
