/**
 * Client-side utility for connecting to the real-time analytics SSE stream
 * Provides a robust EventSource wrapper with automatic reconnection and error handling
 */

import React from "react";
import { logger } from "@/lib/logger";
import {
  SSEMessage,
  AnalyticsSSEClient,
  AnalyticsEventHandler,
  AnalyticsResponse,
} from "@/types/analytics";

export interface AnalyticsSSEClientOptions {
  eventId: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  // eslint-disable-next-line no-unused-vars
  onAnalyticsUpdate?: (data: AnalyticsResponse) => void;
  onConnectionStatusChange?: (
    // eslint-disable-next-line no-unused-vars
    status: "connecting" | "connected" | "disconnected" | "error"
  ) => void;
  // eslint-disable-next-line no-unused-vars
  onError?: (error: Event) => void;
}

export class AnalyticsSSEClientImpl implements AnalyticsSSEClient {
  private eventSource: EventSource | null = null;
  private eventId: string;
  private options: Required<AnalyticsSSEClientOptions>;
  private connectionState: "connecting" | "connected" | "disconnected" | "error" = "disconnected";
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private messageHandlers: Set<AnalyticsEventHandler> = new Set();
  // eslint-disable-next-line no-unused-vars
  private errorHandlers: Set<(error: Event) => void> = new Set();

  constructor(options: AnalyticsSSEClientOptions) {
    this.eventId = options.eventId;
    this.options = {
      autoReconnect: true,
      reconnectInterval: 5000, // 5 seconds
      maxReconnectAttempts: 10,
      onAnalyticsUpdate: () => {},
      onConnectionStatusChange: () => {},
      onError: () => {},
      ...options,
    };
  }

  connect(): void {
    if (this.eventSource && this.eventSource.readyState !== EventSource.CLOSED) {
      logger.warn("SSE client already connected or connecting", { eventId: this.eventId });
      return;
    }

    this.setConnectionState("connecting");

    try {
      const url = `/api/events/${this.eventId}/analytics/stream`;
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        logger.info("SSE connection opened", { eventId: this.eventId });
        this.setConnectionState("connected");
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch {
          logger.error("Error parsing SSE message", { eventId: this.eventId, data: event.data });
        }
      };

      this.eventSource.onerror = (error) => {
        logger.error("SSE connection error", { eventId: this.eventId, error });
        this.setConnectionState("error");
        this.errorHandlers.forEach((handler) => {
          try {
            handler(error);
          } catch {
            logger.error("Error in SSE error handler");
          }
        });

        // Trigger auto-reconnect if enabled
        if (
          this.options.autoReconnect &&
          this.reconnectAttempts < this.options.maxReconnectAttempts
        ) {
          this.scheduleReconnect();
        }
      };
    } catch {
      logger.error("Error creating SSE connection", { eventId: this.eventId });
      this.setConnectionState("error");
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.setConnectionState("disconnected");
    logger.info("SSE connection disconnected", { eventId: this.eventId });
  }

  onMessage(handler: AnalyticsEventHandler): void {
    this.messageHandlers.add(handler);
  }

  // eslint-disable-next-line no-unused-vars
  onError(handler: (error: Event) => void): void {
    this.errorHandlers.add(handler);
  }

  getConnectionState(): "connecting" | "connected" | "disconnected" | "error" {
    return this.connectionState;
  }

  private setConnectionState(state: "connecting" | "connected" | "disconnected" | "error"): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.options.onConnectionStatusChange(state);
      logger.debug("SSE connection state changed", { eventId: this.eventId, state });
    }
  }

  private handleMessage(message: SSEMessage): void {
    logger.debug("Received SSE message", { eventId: this.eventId, messageType: message.type });

    // Notify all message handlers
    this.messageHandlers.forEach((handler) => {
      try {
        handler(message);
      } catch {
        logger.error("Error in SSE message handler");
      }
    });

    // Handle specific message types
    switch (message.type) {
      case "connection_established":
        logger.info("SSE connection confirmed by server", { eventId: this.eventId });
        break;

      case "initial_data":
      case "analytics_update":
        if (message.data) {
          this.options.onAnalyticsUpdate(message.data);
        }
        break;

      case "heartbeat":
        logger.debug("Received heartbeat", { eventId: this.eventId });
        break;

      case "error":
        logger.error("Server error message", { eventId: this.eventId, error: message.error });
        break;

      default:
        logger.warn("Unknown SSE message type", {
          eventId: this.eventId,
          messageType: message.type,
        });
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1), // Exponential backoff
      30000 // Max 30 seconds
    );

    logger.info("Scheduling SSE reconnect", {
      eventId: this.eventId,
      attempt: this.reconnectAttempts,
      delay,
    });

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }
}

/**
 * Create a new Analytics SSE client
 */
export function createAnalyticsSSEClient(options: AnalyticsSSEClientOptions): AnalyticsSSEClient {
  return new AnalyticsSSEClientImpl(options);
}

/**
 * Hook for React components to use the Analytics SSE client
 */
export function useAnalyticsSSE(eventId: string, options: Partial<AnalyticsSSEClientOptions> = {}) {
  const [connectionState, setConnectionState] = React.useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("disconnected");
  const [client] = React.useState(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return createAnalyticsSSEClient({
      eventId,
      onConnectionStatusChange: setConnectionState,
      ...options,
    });
  });

  React.useEffect(() => {
    return () => {
      client?.disconnect();
    };
  }, [client]);

  if (typeof window === "undefined") {
    // Server-side rendering
    return {
      client: null,
      connectionState: "disconnected" as const,
      connect: () => {},
      disconnect: () => {},
    };
  }

  return {
    client,
    connectionState,
    connect: () => client?.connect(),
    disconnect: () => client?.disconnect(),
  };
}
