"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EventCard } from "./event-card";
import { EventFilters } from "./event-filters";
import { Pagination } from "@/components/ui/pagination";
import { Plus, Calendar, Users } from "lucide-react";
import type { Event, Registration } from "@prisma/client";

interface EventManagementDashboardProps {
  className?: string;
}

interface EventsResponse {
  events: (Event & {
    registrations?: Registration[];
    category?: { name: string; color?: string };
  })[];
  total: number;
  page: number;
  totalPages: number;
}

export function EventManagementDashboard({ className }: EventManagementDashboardProps) {
  const t = useTranslations("EventManagement");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [events, setEvents] = useState<EventsResponse["events"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
    pageSize: 10,
  });

  // Get current page from URL
  const currentPage = parseInt(searchParams.get("page") || "1");

  // Fetch events based on current filters and page
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams(searchParams);
      params.set("page", currentPage.toString());
      params.set("limit", pagination.pageSize.toString());

      const response = await fetch(`/api/events?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data: EventsResponse = await response.json();

      setEvents(data.events);
      setPagination((prev) => ({
        ...prev,
        page: data.page,
        total: data.total,
        totalPages: data.totalPages,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("Error fetching events:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [searchParams, currentPage, pagination.pageSize]);

  // Fetch events when component mounts or filters change
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Handle page change
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Handle event actions
  const handleEditEvent = (eventId: string) => {
    router.push(`/events/${eventId}/edit`);
  };

  const handleViewEvent = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  const handleManageEvent = (eventId: string) => {
    router.push(`/events/${eventId}/manage`);
  };

  const handleDeleteEvent = async (eventId: string) => {
    // TODO: Replace with proper confirmation dialog
    // eslint-disable-next-line no-alert
    if (!confirm("Are you sure you want to delete this event?")) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      // Refresh events after deletion
      fetchEvents();
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("Error deleting event:", err);
      }
      // TODO: Replace with proper toast notification
      // eslint-disable-next-line no-alert
      alert("Failed to delete event. Please try again.");
    }
  };

  // Calculate dashboard metrics
  const totalEvents = pagination.total;
  const publishedEvents = events.filter((e) => e.status === "PUBLISHED").length;
  const draftEvents = events.filter((e) => e.status === "DRAFT").length;
  const totalRegistrations = events.reduce(
    (sum, event) => sum + (event.registrations?.length || 0),
    0
  );

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
        <span className="ml-2 text-gray-600">{t("loading")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="mb-2 text-red-600">{t("error")}</div>
            <div className="mb-4 text-gray-600">{t("errorDesc")}</div>
            <Button onClick={fetchEvents} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
            <p className="mt-2 text-gray-600">{t("subtitle")}</p>
          </div>
          <Button onClick={() => router.push("/events/create")} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t("createEvent")}
          </Button>
        </div>
      </div>

      {/* Dashboard Metrics */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{totalEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">{publishedEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-gray-900">{draftEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                <p className="text-2xl font-bold text-gray-900">{totalRegistrations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <EventFilters />

      {/* Events Grid */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="pb-12 pt-12">
            <div className="text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">{t("noEvents")}</h3>
              <p className="mt-2 text-gray-600">{t("noEventsDesc")}</p>
              <Button onClick={() => router.push("/events/create")} className="mt-4">
                {t("createEvent")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={handleEditEvent}
                onView={handleViewEvent}
                onManage={handleManageEvent}
                onDelete={handleDeleteEvent}
              />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={pagination.pageSize}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
