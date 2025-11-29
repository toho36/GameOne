"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { EventList } from "@/components/features/events/event-list";
import type { PublicEvent, PaginationInfo } from "@/types/features/event-registration";
import { getJson } from "@/lib/api/client";

interface EventsClientPageProps {
  initialEvents: PublicEvent[];
  initialPagination: PaginationInfo;
}

export function EventsClientPage({ initialEvents, initialPagination }: EventsClientPageProps) {
  const t = useTranslations("Events");
  const router = useRouter();
  const [events, setEvents] = useState<PublicEvent[]>(initialEvents);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>(initialPagination);

  // Fetch events
  const fetchEvents = useCallback(
    async (page: number) => {
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
      // Update URL to reflect page change (optional but good for UX)
      // router.push(`/events?page=${page}`, { scroll: false });
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
      router.push(`/events/${event.id}`);
    },
    [router]
  );

  return (
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
  );
}
