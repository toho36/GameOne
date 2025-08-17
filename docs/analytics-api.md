# Real-time Event Analytics API

This document describes the comprehensive real-time analytics API for event
management, including caching, server-sent events (SSE), and performance
optimizations.

## Overview

The analytics API provides comprehensive insights into event performance with
real-time updates, efficient caching, and detailed metrics. It's designed to
handle high-traffic scenarios with robust error handling and type safety.

## API Endpoints

### GET `/api/events/[id]/analytics`

Retrieves comprehensive analytics data for a specific event with intelligent
caching.

#### Query Parameters

- `skipCache` (boolean, optional): Force fresh data retrieval, bypassing cache
- `realTime` (boolean, optional): Broadcast updates to connected SSE clients

#### Request Example

```bash
curl -X GET "/api/events/123/analytics?skipCache=false&realTime=true" \
  -H "Authorization: Bearer <token>"
```

#### Response

```typescript
interface AnalyticsResponse {
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
    date: string; // YYYY-MM-DD format
    registrations: number;
    payments: number;
  }>;
  demographics: {
    registrationTypes: Record<string, number>;
    sources: Record<string, number>;
  };
  attendanceStats?: {
    attended: number;
    noShow: number;
    confirmed: number;
  } | null;
  event?: {
    capacity: number;
    title: string;
  };
  cached?: boolean;
  cacheTimestamp?: number;
  timestamp: string;
}
```

#### Status Codes

- `200` - Success
- `401` - Not authenticated
- `403` - Unauthorized (no access to event)
- `404` - Event not found
- `500` - Internal server error

### POST `/api/events/[id]/analytics/refresh`

Manually refreshes analytics cache and broadcasts updates to connected SSE
clients.

#### Request Example

```bash
curl -X POST "/api/events/123/analytics/refresh" \
  -H "Authorization: Bearer <token>"
```

#### Response

```typescript
interface AnalyticsRefreshResponse {
  success: boolean;
  message: string;
  data: AnalyticsResponse;
  timestamp: string;
}
```

### GET `/api/events/[id]/analytics/stream`

Establishes a Server-Sent Events (SSE) connection for real-time analytics
updates.

#### Connection Example

```javascript
const eventSource = new EventSource("/api/events/123/analytics/stream");

eventSource.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log("Analytics update:", message);
};
```

#### SSE Message Types

```typescript
type SSEMessageType =
  | "connection_established"
  | "initial_data"
  | "analytics_update"
  | "heartbeat"
  | "error";

interface SSEMessage {
  type: SSEMessageType;
  eventId?: string;
  data?: AnalyticsResponse;
  timestamp: string;
  error?: string;
}
```

## Features

### 1. Intelligent Caching

- **TTL**: 5-minute cache duration
- **In-Memory Storage**: Fast access with automatic expiration
- **Cache Control**: Optional cache bypass with `skipCache` parameter
- **Performance Monitoring**: Cache hit/miss logging

### 2. Real-time Updates

- **Server-Sent Events**: Persistent connection for live updates
- **Automatic Reconnection**: Client-side retry logic with exponential backoff
- **Heartbeat System**: Connection health monitoring every 30 seconds
- **Broadcast System**: Efficient multi-client update distribution

### 3. Comprehensive Analytics

#### Registration Metrics

- Total registrations by status
- Waiting list tracking
- Registration sources and types
- Timeline data (30-day history)

#### Payment Analytics

- Revenue calculations
- Payment completion rates
- Pending payment tracking
- Real payment data integration

#### Attendance Tracking

- Post-event attendance rates
- No-show statistics
- Confirmation tracking

#### Demographics

- Registration type breakdown
- Source attribution
- Real-time demographic updates

### 4. Performance Optimizations

#### Database Queries

- Optimized aggregation queries
- Raw SQL for complex timeline data
- Indexed lookups for fast access
- Batch operations where possible

#### Caching Strategy

- Event-specific cache keys
- Automatic cache invalidation
- Memory-efficient storage
- Cache warming capabilities

#### SSE Management

- Connection pooling per event
- Automatic cleanup of broken connections
- Resource-efficient broadcasting
- Connection state tracking

### 5. Error Handling & Monitoring

#### Comprehensive Error Codes

```typescript
const ERROR_CODES = {
  NOT_AUTHENTICATED: "NOT_AUTHENTICATED",
  EVENT_NOT_FOUND: "EVENT_NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_PARAMETERS: "INVALID_PARAMETERS",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  CACHE_ERROR: "CACHE_ERROR",
} as const;
```

#### Logging & Monitoring

- Structured logging with event IDs
- Performance timing metrics
- Error tracking with stack traces
- Cache hit/miss statistics
- SSE connection monitoring

## Client-Side Integration

### React Hook Example

```typescript
import { useAnalyticsSSE } from '@/lib/utils/analytics-sse-client';

function EventAnalyticsDashboard({ eventId }: { eventId: string }) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null);

  const { client, connectionState, connect, disconnect } = useAnalyticsSSE(eventId, {
    onAnalyticsUpdate: setAnalyticsData,
    onConnectionStatusChange: (status) => {
      console.log('Connection status:', status);
    },
    autoReconnect: true,
    maxReconnectAttempts: 10
  });

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return (
    <div>
      <div>Connection: {connectionState}</div>
      {analyticsData && (
        <div>
          <h3>Analytics Data</h3>
          <p>Total Registrations: {analyticsData.registrationStats.total}</p>
          <p>Revenue: €{analyticsData.paymentStats.totalRevenue}</p>
        </div>
      )}
    </div>
  );
}
```

### Manual API Usage

```typescript
// Fetch analytics data
const response = await fetch(`/api/events/${eventId}/analytics?realTime=true`);
const analytics = await response.json();

// Refresh analytics
const refreshResponse = await fetch(
  `/api/events/${eventId}/analytics/refresh`,
  {
    method: "POST",
  }
);
const refreshResult = await refreshResponse.json();

// Establish SSE connection
const createSSEClient = (eventId: string) => {
  const eventSource = new EventSource(
    `/api/events/${eventId}/analytics/stream`
  );

  eventSource.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);

    switch (message.type) {
      case "analytics_update":
        console.log("New analytics data:", message.data);
        break;
      case "heartbeat":
        console.log("Connection alive");
        break;
    }
  });

  return eventSource;
};
```

## Security Considerations

### Authentication & Authorization

- User authentication required for all endpoints
- Event ownership verification
- Role-based access control
- Secure session management

### Data Protection

- Sensitive data filtering
- Rate limiting considerations
- Input validation and sanitization
- CORS configuration for SSE

### Performance Security

- Memory usage monitoring
- Connection limits per user
- Cache size limitations
- Resource cleanup on disconnection

## Deployment Considerations

### Environment Variables

```env
# Database configuration
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Logging configuration
LOG_LEVEL="info"
```

### Production Optimizations

- Enable connection pooling
- Configure load balancer sticky sessions for SSE
- Set up monitoring and alerting
- Configure log aggregation
- Enable performance profiling

### Scaling Considerations

- Horizontal scaling with shared cache (Redis)
- Load balancer configuration for SSE
- Database read replicas for analytics queries
- CDN for static assets

## Testing

### Unit Tests

- Service layer testing
- Cache functionality verification
- Error handling validation
- Type safety confirmation

### Integration Tests

- End-to-end API testing
- SSE connection testing
- Database query performance
- Cache invalidation scenarios

### Performance Tests

- Load testing with multiple connections
- Cache performance under load
- Database query optimization
- Memory leak detection

## Monitoring & Observability

### Key Metrics

- API response times
- Cache hit/miss ratios
- SSE connection counts
- Database query performance
- Error rates by endpoint

### Alerting

- High error rates
- Performance degradation
- Memory usage spikes
- SSE connection failures

### Logging

- Structured JSON logging
- Request/response correlation IDs
- Performance timing data
- User action tracking

## Future Enhancements

1. **Redis Integration**: Replace in-memory cache with Redis for better scaling
2. **WebSocket Support**: Bidirectional communication for advanced features
3. **Analytics Export**: PDF/Excel export functionality
4. **Historical Data**: Long-term analytics storage and querying
5. **Machine Learning**: Predictive analytics and insights
6. **Multi-tenant Support**: Organization-level analytics aggregation

## API Reference Summary

| Endpoint                             | Method | Purpose            | Cache | SSE      |
| ------------------------------------ | ------ | ------------------ | ----- | -------- |
| `/api/events/[id]/analytics`         | GET    | Get analytics data | ✅    | Optional |
| `/api/events/[id]/analytics/refresh` | POST   | Refresh cache      | ✅    | ✅       |
| `/api/events/[id]/analytics/stream`  | GET    | SSE connection     | -     | ✅       |

This comprehensive analytics API provides the foundation for real-time event
monitoring and insights, with robust performance, security, and scalability
features.
