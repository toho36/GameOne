"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { postJson } from "@/lib/api/client";
import { normalizeApiError } from "@/lib/api/errors";
import { EventList } from "./event-list";
import { EventFilters as EventFiltersComponent } from "./event-filters";
import { EventStats } from "./event-stats";
import { useEvents } from "./hooks/use-events";
import { useDeleteEvent } from "./hooks/use-event-mutations";
import { EventDashboardProps, EventFilters } from "@/types/components/event-dashboard.types";

export function EventDashboard({ className }: EventDashboardProps) {
  const router = useRouter();
  const t = useTranslations("Events");
  const [filters, setFilters] = useState<EventFilters>({});

  const {
    events,
    pagination,
    isLoading,
    error,
    refetch,
    setFilters: updateFilters,
    setPage,
  } = useEvents({ filters });

  const handleCreateEvent = () => {
    router.push("/manage-events/create");
  };

  const handleEditEvent = (eventId: string) => {
    router.push(`/manage-events/${eventId}/edit`);
  };

  const deleteEvent = useDeleteEvent();
  const handleDeleteEvent = async (eventId: string) => {
    // eslint-disable-next-line no-alert
    if (!confirm(t("deleteEvent") + "?")) return;

    try {
      await deleteEvent.mutateAsync(eventId);
      refetch();
    } catch (error) {
      const message = normalizeApiError(error);
      logger.error("Event deletion failed", message);
      // eslint-disable-next-line no-alert
      alert(message);
    }
  };

  const handleToggleStatus = async (eventId: string, currentStatus: string) => {
    const action = currentStatus === "PUBLISHED" ? "unpublish" : "publish";

    try {
      await postJson(`/api/events/${eventId}/publish`, { action });
      refetch();
    } catch (error) {
      const message = normalizeApiError(error);
      logger.error(`Event ${action} operation failed`, message);
      // eslint-disable-next-line no-alert
      alert(message);
    }
  };

  const handleFiltersChange = (newFilters: EventFilters) => {
    setFilters(newFilters);
    updateFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    updateFilters({});
  };

  // Calculate stats (defensive against undefined)
  const totalEvents = pagination?.totalCount ?? 0;
  const publishedEvents = Array.isArray(events)
    ? events.filter((e) => e.status === "PUBLISHED").length
    : 0;
  const draftEvents = Array.isArray(events) ? events.filter((e) => e.status === "DRAFT").length : 0;
  const totalRegistrations = Array.isArray(events)
    ? events.reduce((sum, e) => sum + e.registrationCount, 0)
    : 0;

  const renderErrorState = () => (
    <div className="space-y-6">
      {/* Header with Create Button - Always Available */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Your Events</h2>
        <Button onClick={handleCreateEvent} className="flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Create Event
        </Button>
      </div>

      {/* Error Message */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start space-x-3">
          <svg
            className="h-6 w-6 flex-shrink-0 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Failed to Load Events</h3>
            <p className="mt-1 text-sm text-red-700">
              {(error && error.includes("Network")) || (error && error.includes("connection"))
                ? "Network connection issue. Please check your internet and try again."
                : error && error.includes("Authentication")
                  ? "Please refresh the page and log in again."
                  : "Unable to fetch your events. This might be a temporary issue with the server."}
            </p>
            <div className="mt-4 flex flex-col space-y-2 sm:flex-row sm:space-x-3 sm:space-y-0">
              <Button
                onClick={refetch}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Retry Loading Events
              </Button>
              <p className="text-xs text-red-600 sm:self-center">
                You can still create new events while we resolve this issue.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alternative Action */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center space-x-2">
          <svg
            className="h-5 w-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-blue-800">
            <strong>Good news:</strong> You can still create new events! The event creation feature
            works independently.
          </p>
        </div>
      </div>
    </div>
  );

  if (error) {
    return <div className={`${className || ""}`}>{renderErrorState()}</div>;
  }

  return (
    <div className={`space-y-6 ${className || ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">{t("title")}</h2>
        <Button onClick={handleCreateEvent} className="flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          {t("createEvent")}
        </Button>
      </div>

      {/* Stats */}
      <EventStats
        totalEvents={totalEvents}
        publishedEvents={publishedEvents}
        draftEvents={draftEvents}
        totalRegistrations={totalRegistrations}
      />

      {/* Filters */}
      <EventFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClear={handleClearFilters}
      />

      {/* Event List */}
      <EventList
        events={events}
        isLoading={isLoading}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        onToggleStatus={handleToggleStatus}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => setPage(pagination.page - 1)}
          >
            Previous
          </Button>

          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasMore}
            onClick={() => setPage(pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
