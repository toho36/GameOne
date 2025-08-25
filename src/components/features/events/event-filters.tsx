"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Search, Filter, X, Calendar, MapPin, Tag, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import type { EventFilters, EventCategory } from "@/types/features/event-registration";

interface EventFiltersProps {
  categories: EventCategory[];
  // eslint-disable-next-line no-unused-vars
  onFiltersChange: (filters: EventFilters) => void;
  onClearFilters: () => void;
}

export function EventFilters({ categories, onFiltersChange, onClearFilters }: EventFiltersProps) {
  const t = useTranslations("EventFilters");
  const isInitialMount = useRef(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<EventFilters>({
    search: "",
    categoryId: undefined,
    startDate: undefined,
    endDate: undefined,
    location: "",
    tags: [],
    priceMin: undefined,
    priceMax: undefined,
    isPrivate: undefined,
  });

  useEffect(() => {
    // Skip the first render to prevent infinite loops
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Apply filters when local filters change
    onFiltersChange(localFilters);
  }, [localFilters, onFiltersChange]);

  const handleFilterChange = (field: keyof EventFilters, value: any) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: EventFilters = {
      search: "",
      categoryId: undefined,
      startDate: undefined,
      endDate: undefined,
      location: "",
      tags: [],
      priceMin: undefined,
      priceMax: undefined,
      isPrivate: undefined,
    };
    setLocalFilters(clearedFilters);
    onClearFilters();
  };

  const handleSearchChange = (value: string) => {
    handleFilterChange("search", value);
  };

  const handleCategoryChange = (categoryId: string | undefined) => {
    // Convert "all" to undefined for the "all categories" option
    const actualCategoryId = categoryId === "all" ? undefined : categoryId;
    handleFilterChange("categoryId", actualCategoryId);
  };

  const handleDateRangeChange = (startDate: Date | undefined, endDate: Date | undefined) => {
    handleFilterChange("startDate", startDate);
    handleFilterChange("endDate", endDate);
  };

  const handleLocationChange = (location: string) => {
    handleFilterChange("location", location);
  };

  const handleTagsChange = (tags: string[]) => {
    handleFilterChange("tags", tags);
  };

  const handlePriceRangeChange = (min: number | undefined, max: number | undefined) => {
    handleFilterChange("priceMin", min);
    handleFilterChange("priceMax", max);
  };

  const handlePrivacyChange = (isPrivate: boolean | undefined) => {
    handleFilterChange("isPrivate", isPrivate);
  };

  const hasActiveFilters = Object.values(localFilters).some(
    (value) =>
      value !== undefined &&
      value !== "" &&
      value !== false &&
      (Array.isArray(value) ? value.length > 0 : true)
  );

  const activeFilterCount = Object.values(localFilters).filter(
    (value) =>
      value !== undefined &&
      value !== "" &&
      value !== false &&
      (Array.isArray(value) ? value.length > 0 : true)
  ).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t("title")}
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="text-red-600 hover:text-red-700"
              >
                <X className="mr-1 h-4 w-4" />
                {t("clearAll")}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? t("collapse") : t("expand")}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            placeholder={t("search.placeholder")}
            value={localFilters.search || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Basic Filters Row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Category Filter */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("category.label")}
            </label>
            <Select
              value={localFilters.categoryId || "all"}
              onValueChange={(value) => handleCategoryChange(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("category.placeholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("category.all")}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("location.label")}
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                placeholder={t("location.placeholder")}
                value={localFilters.location || ""}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("price.label")}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <DollarSign className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  type="number"
                  placeholder={t("price.min")}
                  value={localFilters.priceMin || ""}
                  onChange={(e) =>
                    handlePriceRangeChange(
                      e.target.value ? parseFloat(e.target.value) : undefined,
                      localFilters.priceMax
                    )
                  }
                  className="pl-7"
                />
              </div>
              <span className="self-center text-gray-500">-</span>
              <div className="relative flex-1">
                <DollarSign className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  type="number"
                  placeholder={t("price.max")}
                  value={localFilters.priceMax || ""}
                  onChange={(e) =>
                    handlePriceRangeChange(
                      localFilters.priceMin,
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  className="pl-7"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="space-y-4 border-t border-gray-200 pt-4">
            {/* Date Range Filters */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t("date.startDate")}
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {localFilters.startDate ? (
                        format(localFilters.startDate, "PPP")
                      ) : (
                        <span className="text-gray-500">{t("date.selectStart")}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={localFilters.startDate}
                      onSelect={(date) => handleDateRangeChange(date, localFilters.endDate)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t("date.endDate")}
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {localFilters.endDate ? (
                        format(localFilters.endDate, "PPP")
                      ) : (
                        <span className="text-gray-500">{t("date.selectEnd")}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={localFilters.endDate}
                      onSelect={(date) => handleDateRangeChange(localFilters.startDate, date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Privacy Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t("privacy.label")}
              </label>
              <div className="flex gap-2">
                <Button
                  variant={localFilters.isPrivate === undefined ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePrivacyChange(undefined)}
                >
                  {t("privacy.all")}
                </Button>
                <Button
                  variant={localFilters.isPrivate === false ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePrivacyChange(false)}
                >
                  {t("privacy.public")}
                </Button>
                <Button
                  variant={localFilters.isPrivate === true ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePrivacyChange(true)}
                >
                  {t("privacy.private")}
                </Button>
              </div>
            </div>

            {/* Tags Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t("tags.label")}
              </label>
              <div className="flex flex-wrap gap-2">
                {["workshop", "conference", "meetup", "webinar", "training", "networking"].map(
                  (tag) => (
                    <Button
                      key={tag}
                      variant={localFilters.tags?.includes(tag) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const currentTags = localFilters.tags || [];
                        const newTags = currentTags.includes(tag)
                          ? currentTags.filter((t) => t !== tag)
                          : [...currentTags, tag];
                        handleTagsChange(newTags);
                      }}
                    >
                      <Tag className="mr-1 h-3 w-3" />
                      {tag}
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex flex-wrap gap-2">
              {localFilters.search && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {t("search.label")}: {localFilters.search}
                  <button
                    onClick={() => handleSearchChange("")}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {localFilters.categoryId && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {t("category.label")}:{" "}
                  {categories.find((c) => c.id === localFilters.categoryId)?.name}
                  <button
                    onClick={() => handleCategoryChange(undefined)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {localFilters.location && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {t("location.label")}: {localFilters.location}
                  <button
                    onClick={() => handleLocationChange("")}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {localFilters.startDate && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {t("date.startDate")}: {format(localFilters.startDate, "MMM dd")}
                  <button
                    onClick={() => handleDateRangeChange(undefined, localFilters.endDate)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {localFilters.endDate && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {t("date.endDate")}: {format(localFilters.endDate, "MMM dd")}
                  <button
                    onClick={() => handleDateRangeChange(localFilters.startDate, undefined)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {localFilters.priceMin !== undefined && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {t("price.min")}: ${localFilters.priceMin}
                  <button
                    onClick={() => handlePriceRangeChange(undefined, localFilters.priceMax)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {localFilters.priceMax !== undefined && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {t("price.max")}: ${localFilters.priceMax}
                  <button
                    onClick={() => handlePriceRangeChange(localFilters.priceMin, undefined)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {localFilters.tags &&
                localFilters.tags.length > 0 &&
                localFilters.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {t("tags.label")}: {tag}
                    <button
                      onClick={() => {
                        const newTags = localFilters.tags?.filter((t) => t !== tag) || [];
                        handleTagsChange(newTags);
                      }}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
