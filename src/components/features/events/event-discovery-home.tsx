"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { PublicEvent, PaginationInfo } from "@/types/features/event-registration";
import { getJson } from "@/lib/api/client";
import { EventList } from "@/components/features/events/event-list";
import { useRouter } from "@/i18n/navigation";

export function EventDiscoveryHome() {
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

  const fetchEvents = useCallback(
    async (page: number = 1) => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({ page: String(page), limit: String(pagination.limit) });
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

  const handleEventSelect = useCallback(
    (event: PublicEvent) => {
      router.push(`/events/${event.id}`);
    },
    [router]
  );

  const handleLoadMore = useCallback(() => {
    if (pagination.hasNext) fetchEvents(pagination.page + 1);
  }, [pagination.hasNext, pagination.page, fetchEvents]);

  useEffect(() => {
    fetchEvents();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-600">{t("description")}</p>
      </div>
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
    </div>
  );
}
