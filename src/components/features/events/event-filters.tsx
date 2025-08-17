"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Filter, Search, Calendar, MapPin, Tag } from "lucide-react";
import { EventStatus, EventType } from "@prisma/client";
import { cn } from "@/lib/utils";

interface EventFiltersProps {
  className?: string;
}

interface FilterState {
  search: string;
  status: string;
  type: string;
  city: string;
  startDateFrom: string;
  startDateTo: string;
  requiresPayment: string;
  isOnline: string;
}

export function EventFilters({ className }: EventFiltersProps) {
  const t = useTranslations("EventManagement.filters");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filters from URL params
  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get("search") || "",
    status: searchParams.get("status") || "",
    type: searchParams.get("type") || "",
    city: searchParams.get("city") || "",
    startDateFrom: searchParams.get("startDateFrom") || "",
    startDateTo: searchParams.get("startDateTo") || "",
    requiresPayment: searchParams.get("requiresPayment") || "",
    isOnline: searchParams.get("isOnline") || "",
  });

  // Track if filters are applied
  const hasActiveFilters = Object.values(filters).some((value) => value !== "");

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    // Reset to page 1 when filters change
    params.set("page", "1");

    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.push(newUrl, { scroll: false });
  }, [filters, router]);

  // Update local state when URL changes
  useEffect(() => {
    setFilters({
      search: searchParams.get("search") || "",
      status: searchParams.get("status") || "",
      type: searchParams.get("type") || "",
      city: searchParams.get("city") || "",
      startDateFrom: searchParams.get("startDateFrom") || "",
      startDateTo: searchParams.get("startDateTo") || "",
      requiresPayment: searchParams.get("requiresPayment") || "",
      isOnline: searchParams.get("isOnline") || "",
    });
  }, [searchParams]);

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilter = (key: keyof FilterState) => {
    setFilters((prev) => ({ ...prev, [key]: "" }));
  };

  const clearAllFilters = () => {
    setFilters({
      search: "",
      status: "",
      type: "",
      city: "",
      startDateFrom: "",
      startDateTo: "",
      requiresPayment: "",
      isOnline: "",
    });
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter((value) => value !== "").length;
  };

  return (
    <Card className={cn("mb-6", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t("title")}
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFilterCount()}
              </Badge>
            )}
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              <X className="mr-1 h-4 w-4" />
              {t("clearAll")}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <Label htmlFor="search" className="text-sm font-medium text-gray-700">
              <Search className="mr-1 inline h-4 w-4" />
              Search
            </Label>
            <Input
              id="search"
              placeholder={t("searchEvents")}
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Status Filter */}
          <div>
            <Label htmlFor="status" className="text-sm font-medium text-gray-700">
              <Tag className="mr-1 inline h-4 w-4" />
              {t("status")}
            </Label>
            <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                {Object.values(EventStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.status && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter("status")}
                className="mt-1 h-6 px-2 text-xs"
              >
                <X className="mr-1 h-3 w-3" />
                Clear
              </Button>
            )}
          </div>

          {/* Type Filter */}
          <div>
            <Label htmlFor="type" className="text-sm font-medium text-gray-700">
              <Tag className="mr-1 inline h-4 w-4" />
              {t("type")}
            </Label>
            <Select value={filters.type} onValueChange={(value) => updateFilter("type", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                {Object.values(EventType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.type && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter("type")}
                className="mt-1 h-6 px-2 text-xs"
              >
                <X className="mr-1 h-3 w-3" />
                Clear
              </Button>
            )}
          </div>

          {/* City Filter */}
          <div>
            <Label htmlFor="city" className="text-sm font-medium text-gray-700">
              <MapPin className="mr-1 inline h-4 w-4" />
              {t("location")}
            </Label>
            <Input
              id="city"
              placeholder="Enter city"
              value={filters.city}
              onChange={(e) => updateFilter("city", e.target.value)}
              className="mt-1"
            />
            {filters.city && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter("city")}
                className="mt-1 h-6 px-2 text-xs"
              >
                <X className="mr-1 h-3 w-3" />
                Clear
              </Button>
            )}
          </div>

          {/* Date Range */}
          <div>
            <Label htmlFor="startDateFrom" className="text-sm font-medium text-gray-700">
              <Calendar className="mr-1 inline h-4 w-4" />
              From Date
            </Label>
            <Input
              id="startDateFrom"
              type="date"
              value={filters.startDateFrom}
              onChange={(e) => updateFilter("startDateFrom", e.target.value)}
              className="mt-1"
            />
            {filters.startDateFrom && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter("startDateFrom")}
                className="mt-1 h-6 px-2 text-xs"
              >
                <X className="mr-1 h-3 w-3" />
                Clear
              </Button>
            )}
          </div>

          <div>
            <Label htmlFor="startDateTo" className="text-sm font-medium text-gray-700">
              <Calendar className="mr-1 inline h-4 w-4" />
              To Date
            </Label>
            <Input
              id="startDateTo"
              type="date"
              value={filters.startDateTo}
              onChange={(e) => updateFilter("startDateTo", e.target.value)}
              className="mt-1"
            />
            {filters.startDateTo && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter("startDateTo")}
                className="mt-1 h-6 px-2 text-xs"
              >
                <X className="mr-1 h-3 w-3" />
                Clear
              </Button>
            )}
          </div>

          {/* Payment Filter */}
          <div>
            <Label htmlFor="requiresPayment" className="text-sm font-medium text-gray-700">
              Payment Required
            </Label>
            <Select
              value={filters.requiresPayment}
              onValueChange={(value) => updateFilter("requiresPayment", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="All events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All events</SelectItem>
                <SelectItem value="true">Paid events only</SelectItem>
                <SelectItem value="false">Free events only</SelectItem>
              </SelectContent>
            </Select>
            {filters.requiresPayment && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter("requiresPayment")}
                className="mt-1 h-6 px-2 text-xs"
              >
                <X className="mr-1 h-3 w-3" />
                Clear
              </Button>
            )}
          </div>

          {/* Online Filter */}
          <div>
            <Label htmlFor="isOnline" className="text-sm font-medium text-gray-700">
              Event Type
            </Label>
            <Select
              value={filters.isOnline}
              onValueChange={(value) => updateFilter("isOnline", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="All events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All events</SelectItem>
                <SelectItem value="true">Online events only</SelectItem>
                <SelectItem value="false">In-person events only</SelectItem>
              </SelectContent>
            </Select>
            {filters.isOnline && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter("isOnline")}
                className="mt-1 h-6 px-2 text-xs"
              >
                <X className="mr-1 h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
