import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EventFiltersProps } from "@/types/components/event-dashboard.types";

export function EventFilters({ filters, onFiltersChange, onClear }: EventFiltersProps) {
  const t = useTranslations("Events");
  const tCommon = useTranslations("Common");

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value === "all" ? undefined : value || undefined,
    });
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== null && value !== ""
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={filters.search || ""}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="w-full lg:w-40">
          <Select
            value={filters.status || "all"}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("filters.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
              <SelectItem value="DRAFT">{t("status.draft")}</SelectItem>
              <SelectItem value="PUBLISHED">{t("status.published")}</SelectItem>
              <SelectItem value="CANCELLED">{t("status.cancelled")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Type Filter */}
        <div className="w-full lg:w-40">
          <Select
            value={filters.type || "all"}
            onValueChange={(value) => handleFilterChange("type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("filters.type")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
              <SelectItem value="CONFERENCE">{t("types.conference")}</SelectItem>
              <SelectItem value="WORKSHOP">{t("types.workshop")}</SelectItem>
              <SelectItem value="WEBINAR">{t("types.webinar")}</SelectItem>
              <SelectItem value="NETWORKING">{t("types.networking")}</SelectItem>
              <SelectItem value="SOCIAL">{t("types.social")}</SelectItem>
              <SelectItem value="OTHER">{t("types.other")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort */}
        <div className="w-full lg:w-40">
          <Select
            value={`${filters.sortBy || "startDate"}-${filters.sortOrder || "asc"}`}
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split("-");
              onFiltersChange({
                ...filters,
                sortBy,
                sortOrder: sortOrder as "asc" | "desc",
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("filters.sortBy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="startDate-asc">{t("sort.dateEarliest")}</SelectItem>
              <SelectItem value="startDate-desc">{t("sort.dateLatest")}</SelectItem>
              <SelectItem value="title-asc">{t("sort.titleAZ")}</SelectItem>
              <SelectItem value="title-desc">{t("sort.titleZA")}</SelectItem>
              <SelectItem value="createdAt-desc">{t("sort.createdNewest")}</SelectItem>
              <SelectItem value="createdAt-asc">{t("sort.createdOldest")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="flex shrink-0 items-center gap-2"
          >
            <XMarkIcon className="h-4 w-4" />
            {tCommon("clear")}
          </Button>
        )}
      </div>
    </div>
  );
}
