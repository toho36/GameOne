"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Filter,
  Download,
  Check,
  X,
  Trash2,
  Eye,
  Calendar,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Shield,
  UserX,
  Mail,
} from "lucide-react";
import type { Event, Registration, User } from "@prisma/client";
import { EventStatus, EventType } from "@prisma/client";
import { cn } from "@/lib/utils";

interface AdminEventDashboardProps {
  className?: string;
}

interface ExtendedEvent extends Event {
  creator: Pick<User, "id" | "name" | "email">;
  registrations?: Registration[];
  category?: { name: string; color?: string };
  _count?: {
    registrations: number;
  };
}

interface AdminEventsResponse {
  events: ExtendedEvent[];
  total: number;
  page: number;
  totalPages: number;
  stats: {
    totalEvents: number;
    pendingApproval: number;
    publishedEvents: number;
    totalRegistrations: number;
    activeEvents: number;
    cancelledEvents: number;
  };
}

interface FilterState {
  search: string;
  status: string;
  type: string;
  creatorId: string;
  city: string;
  startDateFrom: string;
  startDateTo: string;
  requiresPayment: string;
  isOnline: string;
  requiresApproval: string;
  sortBy: string;
  sortOrder: string;
}

interface BulkAction {
  eventIds: string[];
  action: "approve" | "reject" | "delete" | "cancel";
  reason?: string;
}

export function AdminEventDashboard({ className }: AdminEventDashboardProps) {
  // const t = useTranslations("AdminEventDashboard");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [events, setEvents] = useState<ExtendedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [stats, setStats] = useState<AdminEventsResponse["stats"] | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
    pageSize: 20,
  });

  // Initialize filters from URL params
  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get("search") || "",
    status: searchParams.get("status") || "",
    type: searchParams.get("type") || "",
    creatorId: searchParams.get("creatorId") || "",
    city: searchParams.get("city") || "",
    startDateFrom: searchParams.get("startDateFrom") || "",
    startDateTo: searchParams.get("startDateTo") || "",
    requiresPayment: searchParams.get("requiresPayment") || "",
    isOnline: searchParams.get("isOnline") || "",
    requiresApproval: searchParams.get("requiresApproval") || "",
    sortBy: searchParams.get("sortBy") || "createdAt",
    sortOrder: searchParams.get("sortOrder") || "desc",
  });

  // Get current page from URL
  const currentPage = parseInt(searchParams.get("page") || "1");

  // Check admin permissions on component mount
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const response = await fetch("/api/auth/permissions");
        if (response.ok) {
          const data = await response.json();
          setUserPermissions(data.permissions || []);

          // Check if user has admin permissions
          const hasAdminAccess =
            data.permissions.includes("admin:events:manage") ||
            data.permissions.includes("admin:all") ||
            data.permissions.includes("events:admin");

          if (!hasAdminAccess) {
            setError("Access denied. Admin permissions required.");
            return;
          }
        }
      } catch {
        setError("Failed to verify permissions");
      }
    };

    checkPermissions();
  }, []);

  // Fetch events with admin endpoint
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams(searchParams);
      params.set("page", currentPage.toString());
      params.set("limit", pagination.pageSize.toString());
      params.set("admin", "true"); // Flag for admin endpoint

      const response = await fetch(`/api/admin/events?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied. Admin permissions required.");
        }
        throw new Error("Failed to fetch events");
      }

      const data: AdminEventsResponse = await response.json();

      setEvents(data.events);
      setStats(data.stats);
      setPagination((prev) => ({
        ...prev,
        page: data.page,
        total: data.total,
        totalPages: data.totalPages,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, [searchParams, currentPage, pagination.pageSize]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    // Reset to page 1 when filters change
    params.set("page", "1");

    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.push(newUrl, { scroll: false });
  }, [filters, router]);

  // Fetch events when filters or page changes
  useEffect(() => {
    if (userPermissions.length > 0) {
      fetchEvents();
    }
  }, [fetchEvents, userPermissions]);

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      search: "",
      status: "",
      type: "",
      creatorId: "",
      city: "",
      startDateFrom: "",
      startDateTo: "",
      requiresPayment: "",
      isOnline: "",
      requiresApproval: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleSelectEvent = (eventId: string, checked: boolean) => {
    setSelectedEvents((prev) => {
      const newSelection = new Set(prev);
      if (checked) {
        newSelection.add(eventId);
      } else {
        newSelection.delete(eventId);
      }
      return newSelection;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEvents(new Set(events.map((event) => event.id)));
    } else {
      setSelectedEvents(new Set());
    }
  };

  const handleBulkAction = async (action: BulkAction["action"], reason?: string) => {
    if (selectedEvents.size === 0) return;

    setBulkActionLoading(true);
    try {
      const response = await fetch("/api/admin/events/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventIds: Array.from(selectedEvents),
          action,
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error("Bulk action failed");
      }

      // Refresh events and clear selection
      await fetchEvents();
      setSelectedEvents(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk action failed");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams(searchParams);
      params.set("export", "true");

      const response = await fetch(`/api/admin/events/export?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `events-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setError("Export failed");
    }
  };

  const getStatusBadgeColor = (status: EventStatus) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-100 text-green-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      case "POSTPONED":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: EventStatus) => {
    switch (status) {
      case "PUBLISHED":
        return <CheckCircle className="h-4 w-4" />;
      case "DRAFT":
        return <Clock className="h-4 w-4" />;
      case "CANCELLED":
        return <X className="h-4 w-4" />;
      case "COMPLETED":
        return <Check className="h-4 w-4" />;
      case "POSTPONED":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => key !== "sortBy" && key !== "sortOrder" && value !== ""
  );

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
        <span className="ml-2 text-gray-600">Loading admin dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="text-center">
            <Shield className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <div className="mb-2 font-semibold text-red-600">{error}</div>
            <div className="mb-4 text-gray-600">
              This dashboard requires administrator privileges.
            </div>
            <Button onClick={() => router.push("/dashboard")} variant="outline">
              Return to Dashboard
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
            <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
              <Shield className="h-8 w-8 text-blue-600" />
              Admin Event Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Manage all events across the platform with administrative controls
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {showFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Platform-wide Statistics */}
      {stats && (
        <div className="mb-8 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingApproval}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Published</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.publishedEvents}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRegistrations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Events</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <X className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Cancelled</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.cancelledEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Advanced Filters */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Advanced Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    {
                      Object.values(filters).filter(
                        (v) => v !== "" && v !== "createdAt" && v !== "desc"
                      ).length
                    }{" "}
                    active
                  </Badge>
                )}
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  Clear All
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <Label htmlFor="search">Search Events</Label>
                <Input
                  id="search"
                  placeholder="Search by title, description, or creator..."
                  value={filters.search}
                  onChange={(e) => updateFilter("search", e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Creator Filter */}
              <div>
                <Label htmlFor="creatorId">Creator</Label>
                <Input
                  id="creatorId"
                  placeholder="Creator ID or email"
                  value={filters.creatorId}
                  onChange={(e) => updateFilter("creatorId", e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Status Filter */}
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => updateFilter("status", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    {Object.values(EventStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={filters.type} onValueChange={(value) => updateFilter("type", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    {Object.values(EventType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City Filter */}
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Enter city"
                  value={filters.city}
                  onChange={(e) => updateFilter("city", e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Date Range */}
              <div>
                <Label htmlFor="startDateFrom">From Date</Label>
                <Input
                  id="startDateFrom"
                  type="date"
                  value={filters.startDateFrom}
                  onChange={(e) => updateFilter("startDateFrom", e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="startDateTo">To Date</Label>
                <Input
                  id="startDateTo"
                  type="date"
                  value={filters.startDateTo}
                  onChange={(e) => updateFilter("startDateTo", e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Payment Filter */}
              <div>
                <Label htmlFor="requiresPayment">Payment</Label>
                <Select
                  value={filters.requiresPayment}
                  onValueChange={(value) => updateFilter("requiresPayment", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All events</SelectItem>
                    <SelectItem value="true">Paid events only</SelectItem>
                    <SelectItem value="false">Free events only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Online Filter */}
              <div>
                <Label htmlFor="isOnline">Location Type</Label>
                <Select
                  value={filters.isOnline}
                  onValueChange={(value) => updateFilter("isOnline", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All events</SelectItem>
                    <SelectItem value="true">Online only</SelectItem>
                    <SelectItem value="false">In-person only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Approval Required Filter */}
              <div>
                <Label htmlFor="requiresApproval">Approval</Label>
                <Select
                  value={filters.requiresApproval}
                  onValueChange={(value) => updateFilter("requiresApproval", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All events</SelectItem>
                    <SelectItem value="true">Requires approval</SelectItem>
                    <SelectItem value="false">No approval needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Options */}
              <div>
                <Label htmlFor="sortBy">Sort By</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => updateFilter("sortBy", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Created Date</SelectItem>
                    <SelectItem value="startDate">Event Date</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="registrations">Registrations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Select
                  value={filters.sortOrder}
                  onValueChange={(value) => updateFilter("sortOrder", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {selectedEvents.size > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {selectedEvents.size} event{selectedEvents.size === 1 ? "" : "s"} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleBulkAction("approve")}
                  disabled={bulkActionLoading}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="mr-1 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  onClick={() => handleBulkAction("reject")}
                  disabled={bulkActionLoading}
                  size="sm"
                  variant="destructive"
                >
                  <X className="mr-1 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleBulkAction("cancel")}
                  disabled={bulkActionLoading}
                  size="sm"
                  variant="outline"
                >
                  <UserX className="mr-1 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={() => handleBulkAction("delete")}
                  disabled={bulkActionLoading}
                  size="sm"
                  variant="destructive"
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Platform Events</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedEvents.size === events.length && events.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-gray-600">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No events found</h3>
              <p className="mt-2 text-gray-600">
                {hasActiveFilters
                  ? "Try adjusting your filters to see more events."
                  : "No events have been created yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-2 py-3 text-left font-medium text-gray-600">
                      <Checkbox
                        checked={selectedEvents.size === events.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Event</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Creator</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Registrations</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-2 py-3">
                        <Checkbox
                          checked={selectedEvents.has(event.id)}
                          onCheckedChange={(checked) =>
                            handleSelectEvent(event.id, checked as boolean)
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs">
                          <div className="truncate font-medium text-gray-900">{event.title}</div>
                          <div className="truncate text-sm text-gray-500">
                            {event.city && `${event.city}, `}
                            {event.isOnline ? "Online" : event.venue || "TBA"}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {event.creator.name || "Unknown"}
                          </div>
                          <div className="text-gray-500">{event.creator.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={cn(
                            "inline-flex items-center gap-1",
                            getStatusBadgeColor(event.status)
                          )}
                        >
                          {getStatusIcon(event.status)}
                          {event.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">{event.type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="text-gray-900">
                            {new Date(event.startDate).toLocaleDateString()}
                          </div>
                          <div className="text-gray-500">
                            {new Date(event.startDate).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {event._count?.registrations || event.registrations?.length || 0} /{" "}
                            {event.capacity}
                          </div>
                          <div className="text-gray-500">
                            {Math.round(
                              ((event._count?.registrations || event.registrations?.length || 0) /
                                event.capacity) *
                                100
                            )}
                            % full
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/events/${event.id}`)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/events/${event.id}/edit`)}
                            className="h-8 w-8 p-0"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(`mailto:${event.creator.email}`, "_blank")}
                            className="h-8 w-8 p-0"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {events.length > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={pagination.pageSize}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
