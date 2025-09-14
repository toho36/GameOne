"use client";

import { useTranslations } from "next-intl";
import { EventCard } from "./event-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { PublicEvent } from "@/types/features/event-registration";

interface EventListProps {
  events: PublicEvent[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  variant?: "grid" | "list";
  // eslint-disable-next-line no-unused-vars
  onEventSelect?: (event: PublicEvent) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function EventList({
  events,
  loading = false,
  error = null,
  emptyMessage,
  variant = "grid",
  onEventSelect,
  onLoadMore,
  hasMore = false,
}: EventListProps) {
  const t = useTranslations("EventList");

  if (loading && events.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="mb-4 h-48 rounded-lg bg-gray-200"></div>
            <div className="space-y-3">
              <div className="h-4 w-3/4 rounded bg-gray-200"></div>
              <div className="h-3 w-1/2 rounded bg-gray-200"></div>
              <div className="h-3 w-2/3 rounded bg-gray-200"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4 text-red-600">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-medium text-gray-900">{t("error.title")}</h3>
        <p className="mb-4 text-gray-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="hover:bg-primary-dark inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {t("error.retry")}
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        title={emptyMessage || t("empty.title")}
        description={t("empty.description")}
        icon="calendar"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Event Grid/List */}
      <div
        className={
          variant === "grid" ? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"
        }
      >
        {events.map((_event) => (
          <EventCard
            key={_event.id}
            event={_event}
            variant="default"
            onClick={() => onEventSelect?.(_event)}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && onLoadMore && (
        <div className="text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg
                  className="-ml-1 mr-3 h-5 w-5 animate-spin text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {t("loadMore.loading")}
              </>
            ) : (
              t("loadMore.button")
            )}
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="text-center text-sm text-gray-500">
        {t("results.count", { count: events.length })}
      </div>
    </div>
  );
}
