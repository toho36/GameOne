"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { EventList } from "@/components/features/events/event-list";
import type { PublicEvent, PaginationInfo } from "@/types/features/event-registration";
import { getJson } from "@/lib/api/client";

export default function EventsPage() {
  const t = useTranslations("Events");
  const router = useRouter();
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    async (page: number = 1) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
        });

        const payload = await getJson<any>(`/api/events/public?${params}`);
        const nextEvents: PublicEvent[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.events)
              ? payload.events
              : [];
        const nextPagination: PaginationInfo = payload?.pagination ?? {
          page,
          limit: pagination.limit,
          total: nextEvents.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        };
        setEvents(nextEvents);
        setPagination(nextPagination);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit]
  );

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-lg text-gray-600">{t("description")}</p>
      </div>

      <div className="space-y-6">
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
