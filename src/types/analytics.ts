/**
 * Comprehensive TypeScript definitions for Event Analytics API
 * Provides type safety for real-time analytics data structures
 */

export interface RegistrationStats {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  waitingList: number;
}

export interface PaymentStats {
  totalRevenue: number;
  paidCount: number;
  pendingCount: number;
  completionRate: number;
}

export interface TimelineDataPoint {
  date: string;
  registrations: number;
  payments: number;
}

export interface Demographics {
  registrationTypes: Record<string, number>;
  sources: Record<string, number>;
}

export interface AttendanceStats {
  attended: number;
  noShow: number;
  confirmed: number;
}

export interface EventBasicInfo {
  capacity: number;
  title: string;
}

export interface AnalyticsResponse {
  registrationStats: RegistrationStats;
  paymentStats: PaymentStats;
  timeline: TimelineDataPoint[];
  demographics: Demographics;
  attendanceStats?: AttendanceStats | null;
  event?: EventBasicInfo;
  cached?: boolean;
  cacheTimestamp?: number | undefined;
  timestamp?: string;
}

export interface AnalyticsRefreshResponse {
  success: boolean;
  message: string;
  data: AnalyticsResponse;
  timestamp: string;
}

export interface AnalyticsCacheEntry {
  data: AnalyticsResponse;
  timestamp: number;
  ttl: number;
}

export interface AnalyticsQueryParams {
  skipCache?: boolean;
  includeRealTime?: boolean;
}

// SSE Message Types
export type SSEMessageType =
  | "connection_established"
  | "initial_data"
  | "analytics_update"
  | "heartbeat"
  | "error"
  | "cache_update";

export interface SSEMessage {
  type: SSEMessageType;
  eventId?: string;
  data?: any;
  timestamp: string;
  error?: string;
}

export interface SSEConnectionEstablishedMessage extends SSEMessage {
  type: "connection_established";
  eventId: string;
}

export interface SSEInitialDataMessage extends SSEMessage {
  type: "initial_data";
  eventId: string;
  data: AnalyticsResponse;
}

export interface SSEAnalyticsUpdateMessage extends SSEMessage {
  type: "analytics_update";
  eventId: string;
  data: AnalyticsResponse;
}

export interface SSEHeartbeatMessage extends SSEMessage {
  type: "heartbeat";
}

export interface SSEErrorMessage extends SSEMessage {
  type: "error";
  error: string;
}

// API Error Types
export interface AnalyticsAPIError {
  error: string;
  details?: Record<string, any>;
  timestamp?: string;
}

export interface AnalyticsAPIErrorResponse {
  error: string;
  status: number;
  timestamp: string;
}

// Utility Types
// eslint-disable-next-line no-unused-vars
export type AnalyticsEventHandler = (message: SSEMessage) => void;

export interface AnalyticsSSEClient {
  connect: () => void;
  disconnect: () => void;
  // eslint-disable-next-line no-unused-vars
  onMessage: (handler: AnalyticsEventHandler) => void;
  // eslint-disable-next-line no-unused-vars
  onError: (handler: (error: Event) => void) => void;
  getConnectionState: () => "connecting" | "connected" | "disconnected" | "error";
}
