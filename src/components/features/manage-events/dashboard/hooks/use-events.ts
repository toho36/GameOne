"use client";

import { useState, useEffect, useCallback } from "react";

import {
  EventsResponse,
  EventFilters,
  UseEventsOptions,
  UseEventsReturn,
} from "@/types/components/event-dashboard.types";

export function useEvents(options: UseEventsOptions = {}): UseEventsReturn {
  const { filters: initialFilters = {}, page: initialPage = 1, limit = 10 } = options;

  const [events, setEvents] = useState<EventsResponse["events"]>([]);
  const [pagination, setPagination] = useState<EventsResponse["pagination"]>({
    page: initialPage,
    limit,
    totalCount: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [filters, setFilters] = useState<EventFilters>(initialFilters);
  const [page, setPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(
            ([, value]) => value !== undefined && value !== null && value !== ""
          )
        ),
      });

      const response = await fetch(`/api/events?${searchParams}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in again.");
        } else if (response.status === 403) {
          throw new Error("You don't have permission to view events.");
        } else if (response.status >= 500) {
          throw new Error("Server error. Please try again in a few moments.");
        } else {
          throw new Error("Failed to fetch events. Please check your connection.");
        }
      }

      const data: EventsResponse = await response.json();

      setEvents(data.events);
      setPagination(data.pagination);
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Network error. Please check your internet connection and try again.");
      } else {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, filters]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSetFilters = useCallback((newFilters: EventFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  }, []);

  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return {
    events,
    pagination,
    isLoading,
    error,
    refetch: fetchEvents,
    setFilters: handleSetFilters,
    setPage: handleSetPage,
  };
}
