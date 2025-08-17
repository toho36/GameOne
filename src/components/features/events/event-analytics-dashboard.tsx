"use client";

/**
 * EventAnalyticsDashboard Component
 *
 * A comprehensive analytics dashboard for event management with:
 * - Key Performance Indicators (total registrations, revenue, capacity utilization)
 * - Registration timeline chart with Chart.js integration
 * - Payment completion rate visualization
 * - Demographic breakdown charts
 * - Responsive design and mobile-friendly layout
 * - Internationalization support
 * - Error handling and loading states
 *
 * Usage:
 * ```tsx
 * import { EventAnalyticsDashboard } from "@/components/features/events";
 *
 * function EventDetailsPage() {
 *   return (
 *     <EventAnalyticsDashboard
 *       eventId="event-123"
 *       className="my-4"
 *     />
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Download,
  RefreshCw,
  Target,
  CheckCircle,
  Clock,
} from "lucide-react";
import { format, parseISO } from "date-fns";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface EventAnalyticsData {
  registrationStats: {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    waitingList: number;
  };
  paymentStats: {
    totalRevenue: number;
    paidCount: number;
    pendingCount: number;
    completionRate: number;
  };
  timeline: Array<{
    date: string;
    registrations: number;
    payments: number;
  }>;
  demographics: {
    registrationTypes: Record<string, number>;
    sources: Record<string, number>;
  };
  event?: {
    capacity: number;
    title: string;
  };
  capacityStats?: {
    capacity: number;
    utilization: number;
    utilizationRate: number;
  };
}

interface EventAnalyticsDashboardProps {
  eventId: string;
  className?: string;
}

export function EventAnalyticsDashboard({ eventId, className }: EventAnalyticsDashboardProps) {
  const t = useTranslations("EventAnalytics");
  const [data, setData] = useState<EventAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/events/${eventId}/analytics`);

      if (!response.ok) {
        throw new Error(response.status === 404 ? "Event not found" : "Failed to fetch analytics");
      }

      const analyticsData = await response.json();

      // Enhanced analytics data with calculated metrics
      const capacity = analyticsData.event?.capacity || 100;
      const enhancedData: EventAnalyticsData = {
        ...analyticsData,
        capacityStats: {
          capacity,
          utilization: analyticsData.registrationStats.confirmed,
          utilizationRate:
            capacity > 0 ? (analyticsData.registrationStats.confirmed / capacity) * 100 : 0,
        },
      };

      setData(enhancedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("Error fetching analytics:", err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
  };

  const handleExport = () => {
    // Export analytics data as JSON
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `event-${eventId}-analytics-${format(new Date(), "yyyy-MM-dd")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [eventId, fetchAnalytics]);

  // Chart configurations
  const registrationTimelineData = {
    labels: data?.timeline.map((item) => format(parseISO(item.date), "MMM dd")) || [],
    datasets: [
      {
        label: t("registrations"),
        data: data?.timeline.map((item) => item.registrations) || [],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: t("payments"),
        data: data?.timeline.map((item) => item.payments) || [],
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const registrationStatusData = {
    labels: [t("confirmed"), t("pending"), t("cancelled"), t("waitingList")],
    datasets: [
      {
        data: [
          data?.registrationStats.confirmed || 0,
          data?.registrationStats.pending || 0,
          data?.registrationStats.cancelled || 0,
          data?.registrationStats.waitingList || 0,
        ],
        backgroundColor: [
          "rgb(34, 197, 94)", // Green for confirmed
          "rgb(251, 191, 36)", // Yellow for pending
          "rgb(239, 68, 68)", // Red for cancelled
          "rgb(156, 163, 175)", // Gray for waiting list
        ],
        borderWidth: 0,
      },
    ],
  };

  const paymentCompletionData = {
    labels: [t("paid"), t("pending")],
    datasets: [
      {
        data: [data?.paymentStats.paidCount || 0, data?.paymentStats.pendingCount || 0],
        backgroundColor: [
          "rgb(34, 197, 94)", // Green for paid
          "rgb(251, 191, 36)", // Yellow for pending
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <LoadingSpinner className="h-8 w-8" />
        <span className="ml-2 text-gray-600">{t("loading")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="mb-2 text-red-600">{t("error")}</div>
            <div className="mb-4 text-gray-600">{error}</div>
            <Button onClick={fetchAnalytics} variant="outline">
              {t("retry")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-gray-600">{t("noData")}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-gray-600">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {t("refresh")}
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {t("export")}
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">{t("totalRegistrations")}</p>
                <p className="text-2xl font-bold text-gray-900">{data.registrationStats.total}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    {data.registrationStats.confirmed} {t("confirmed")}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">{t("totalRevenue")}</p>
                <p className="text-2xl font-bold text-gray-900">
                  €{data.paymentStats.totalRevenue.toFixed(2)}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {data.paymentStats.completionRate.toFixed(1)}% {t("completion")}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">{t("capacityUtilization")}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.capacityStats?.utilizationRate.toFixed(1)}%
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {data.capacityStats?.utilization} / {data.capacityStats?.capacity}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">{t("pendingApprovals")}</p>
                <p className="text-2xl font-bold text-gray-900">{data.registrationStats.pending}</p>
                <div className="mt-2 flex items-center gap-2">
                  {data.registrationStats.waitingList > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="mr-1 h-3 w-3" />
                      {data.registrationStats.waitingList} {t("waitingList")}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1: Timeline and Registration Status */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t("registrationTimeline")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line data={registrationTimelineData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t("registrationStatus")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Doughnut data={registrationStatusData} options={doughnutOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Payment Completion and Demographics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t("paymentCompletion")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Doughnut data={paymentCompletionData} options={doughnutOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t("registrationSources")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-80 items-center justify-center">
              {Object.keys(data.demographics.sources).length === 0 ? (
                <div className="text-center text-gray-500">
                  <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <p>{t("noSourceData")}</p>
                </div>
              ) : (
                <Doughnut
                  data={{
                    labels: Object.keys(data.demographics.sources),
                    datasets: [
                      {
                        data: Object.values(data.demographics.sources),
                        backgroundColor: [
                          "rgb(59, 130, 246)",
                          "rgb(34, 197, 94)",
                          "rgb(251, 191, 36)",
                          "rgb(239, 68, 68)",
                          "rgb(156, 163, 175)",
                        ],
                        borderWidth: 0,
                      },
                    ],
                  }}
                  options={doughnutOptions}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>{t("summaryStatistics")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {(
                  (data.registrationStats.confirmed / data.registrationStats.total) * 100 || 0
                ).toFixed(1)}
                %
              </div>
              <div className="text-sm text-gray-600">{t("confirmationRate")}</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {data.registrationStats.total > 0
                  ? (data.paymentStats.totalRevenue / data.registrationStats.total).toFixed(2)
                  : "0.00"}
                €
              </div>
              <div className="text-sm text-gray-600">{t("averageRevenue")}</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(
                  (data.registrationStats.cancelled / data.registrationStats.total) * 100 || 0
                ).toFixed(1)}
                %
              </div>
              <div className="text-sm text-gray-600">{t("cancellationRate")}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
