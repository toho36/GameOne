"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { EventList } from "@/components/features/events/event-list";
import { EventFilters } from "@/components/features/events/event-filters";
import { EventSearch } from "@/components/features/events/event-search";
import { Link } from "@/i18n/navigation";
import type {
  PublicEvent,
  EventCategory,
  EventFilters as EventFiltersType,
  PaginationInfo,
} from "@/types/features/event-registration";

export default function EventsPage() {
  const t = useTranslations("Events");
  const router = useRouter();
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EventFiltersType>({
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
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Fetch events
  const fetchEvents = useCallback(
    async (page: number = 1, newFilters?: EventFiltersType) => {
      try {
        setLoading(true);
        setError(null);

        const currentFilters = newFilters || filters;
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
        });

        // Add filters to params
        if (currentFilters.search) params.append("search", currentFilters.search);
        if (currentFilters.categoryId) params.append("categoryId", currentFilters.categoryId);
        if (currentFilters.location) params.append("location", currentFilters.location);
        if (currentFilters.startDate)
          params.append("startDate", currentFilters.startDate.toISOString());
        if (currentFilters.endDate) params.append("endDate", currentFilters.endDate.toISOString());
        if (currentFilters.priceMin !== undefined)
          params.append("priceMin", currentFilters.priceMin.toString());
        if (currentFilters.priceMax !== undefined)
          params.append("priceMax", currentFilters.priceMax.toString());
        if (currentFilters.isPrivate !== undefined)
          params.append("isPrivate", currentFilters.isPrivate.toString());
        if (currentFilters.tags && currentFilters.tags.length > 0)
          params.append("tags", currentFilters.tags.join(","));

        const response = await fetch(`/api/events/public?${params}`);

        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }

        const data = await response.json();

        if (data.success) {
          setEvents(data.data);
          setPagination(data.pagination);
        } else {
          throw new Error(data.error?.message || "Failed to fetch events");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.limit]
  );

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/events/categories");

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data = await response.json();

      if (data.success) {
        setCategories(data.data);
      }
    } catch {
      // Silently fail for categories, not critical
    }
  };

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (newFilters: EventFiltersType) => {
      setFilters(newFilters);
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchEvents(1, newFilters);
    },
    [fetchEvents]
  );

  // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      const newFilters = { ...filters, search: query };
      setFilters(newFilters);
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchEvents(1, newFilters);
    },
    [filters, fetchEvents]
  );

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    const newFilters = { ...filters, search: "" };
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchEvents(1, newFilters);
  }, [filters, fetchEvents]);

  // Handle clear all filters
  const handleClearFilters = useCallback(() => {
    const clearedFilters: EventFiltersType = {
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
    setFilters(clearedFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchEvents(1, clearedFilters);
  }, [fetchEvents]);

  // Handle pagination
  const handlePageChange = useCallback(
    (page: number) => {
      setPagination((prev) => ({ ...prev, page }));
      fetchEvents(page);
    },
    [fetchEvents]
  );

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (pagination.hasNext) {
      handlePageChange(pagination.page + 1);
    }
  }, [pagination.hasNext, pagination.page, handlePageChange]);

  // Handle event selection
  const handleEventSelect = useCallback(
    (event: PublicEvent) => {
      // Use Next.js router with locale support instead of window.location.href
      router.push(`/events/${event.id}`);
    },
    [router]
  );

  // Initial data fetch
  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <Link href="/" className="hover:text-gray-700 hover:underline">
              {t("breadcrumb.home")}
            </Link>
          </li>
          <li className="flex items-center">
            <span className="mx-2">/</span>
            <span className="font-medium text-gray-900">{t("breadcrumb.events")}</span>
          </li>
        </ol>
      </nav>

      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-lg text-gray-600">{t("description")}</p>
      </div>

      <div className="space-y-6">
        {/* Search */}
        <EventSearch
          onSearch={handleSearch}
          onClear={handleClearSearch}
          placeholder={t("search.placeholder")}
        />

        {/* Filters */}
        <EventFilters
          onFiltersChange={handleFiltersChange}
          categories={categories}
          onClearFilters={handleClearFilters}
        />

        {/* Event List */}
        <EventList
          events={events}
          loading={loading}
          error={error}
          emptyMessage={t("empty.message")}
          variant="grid"
          onEventSelect={handleEventSelect}
          onLoadMore={handleLoadMore}
          hasMore={pagination.hasNext}
        />

        {/* Pagination Controls */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("pagination.previous")}
            </button>

            <span className="px-4 py-2 text-sm text-gray-700">
              {t("pagination.page", {
                current: pagination.page,
                total: pagination.totalPages,
              })}
            </span>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("pagination.next")}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
