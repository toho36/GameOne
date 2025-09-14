"use client";

import { useState, useMemo, useCallback } from "react";

import {
  EventsResponse,
  EventFilters,
  UseEventsOptions,
  UseEventsReturn,
} from "@/types/components/event-dashboard.types";
import { getJson } from "@/lib/api/client";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { normalizeApiError } from "@/lib/api/errors";
import { eventsKeys } from "@/lib/api/query-keys";

export function useEvents(options: UseEventsOptions = {}): UseEventsReturn {
  const { filters: initialFilters = {}, page: initialPage = 1, limit = 10 } = options;

  const [filters, setFilters] = useState<EventFilters>(initialFilters);
  const [page, setPage] = useState(initialPage);

  const search = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== "")
      ),
    });
    return params.toString();
  }, [filters, page, limit]);

  const query = useQuery({
    queryKey: eventsKeys.list({ filters, page, limit }),
    queryFn: () => getJson<EventsResponse>(`/api/events?${search}`),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const data = query.data as any;
  const events = Array.isArray(data?.events) ? data.events : [];
  const pagination = (data?.pagination as EventsResponse["pagination"]) ?? {
    page,
    limit,
    totalCount: 0,
    totalPages: 0,
    hasMore: false,
  };

  const handleSetFilters = useCallback((newFilters: EventFilters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return {
    events,
    pagination,
    isLoading: query.isLoading,
    error: query.error ? normalizeApiError(query.error) : null,
    refetch: query.refetch,
    setFilters: handleSetFilters,
    setPage: handleSetPage,
  };
}
