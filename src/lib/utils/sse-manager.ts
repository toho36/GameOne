import { logger } from "@/lib/logger";

// Store for SSE connections organized by event ID
const sseConnections = new Map<string, Set<ReadableStreamDefaultController>>();

export interface SSEMessage {
  type: string;
  eventId?: string;
  data?: any;
  timestamp: string;
}

/**
 * Add a new SSE connection for an event
 */
export function addSSEConnection(
  eventId: string,
  controller: ReadableStreamDefaultController
): void {
  if (!sseConnections.has(eventId)) {
    sseConnections.set(eventId, new Set());
  }
  sseConnections.get(eventId)!.add(controller);
  logger.info("SSE connection added", {
    eventId,
    totalConnections: sseConnections.get(eventId)!.size,
  });
}

/**
 * Remove an SSE connection for an event
 */
export function removeSSEConnection(
  eventId: string,
  controller: ReadableStreamDefaultController
): void {
  const connections = sseConnections.get(eventId);
  if (connections) {
    connections.delete(controller);
    if (connections.size === 0) {
      sseConnections.delete(eventId);
      logger.info("All SSE connections removed for event", { eventId });
    } else {
      logger.info("SSE connection removed", { eventId, remainingConnections: connections.size });
    }
  }
}

/**
 * Broadcast a message to all connected SSE clients for a specific event
 */
export function broadcastToEvent(eventId: string, message: SSEMessage): void {
  const connections = sseConnections.get(eventId);
  if (!connections || connections.size === 0) {
    logger.debug("No SSE connections to broadcast to", { eventId });
    return;
  }

  const messageString = `data: ${JSON.stringify({
    ...message,
    eventId,
    timestamp: message.timestamp || new Date().toISOString(),
  })}\n\n`;

  const encoder = new TextEncoder();
  const brokenConnections: ReadableStreamDefaultController[] = [];

  // Send to all connected clients for this event
  connections.forEach((controller) => {
    try {
      controller.enqueue(encoder.encode(messageString));
    } catch (error) {
      // Mark broken connections for removal
      brokenConnections.push(controller);
      logger.warn("Failed to send SSE message to connection", {
        eventId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Remove broken connections
  brokenConnections.forEach((controller) => {
    connections.delete(controller);
  });

  // Clean up empty connection sets
  if (connections.size === 0) {
    sseConnections.delete(eventId);
  }

  logger.debug("SSE message broadcast", {
    eventId,
    messageType: message.type,
    successfulConnections: connections.size,
    brokenConnections: brokenConnections.length,
  });
}

/**
 * Broadcast analytics update to all connected clients for an event
 */
export function broadcastAnalyticsUpdate(eventId: string, analyticsData: any): void {
  broadcastToEvent(eventId, {
    type: "analytics_update",
    data: analyticsData,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Send heartbeat to all connections for an event
 */
export function sendHeartbeat(eventId: string): void {
  broadcastToEvent(eventId, {
    type: "heartbeat",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Send initial connection confirmation
 */
export function sendConnectionEstablished(
  eventId: string,
  controller: ReadableStreamDefaultController
): void {
  const message = `data: ${JSON.stringify({
    type: "connection_established",
    eventId,
    timestamp: new Date().toISOString(),
  })}\n\n`;

  try {
    controller.enqueue(new TextEncoder().encode(message));
    logger.info("Connection established message sent", { eventId });
  } catch (error) {
    logger.error("Failed to send connection established message", { eventId, error });
  }
}

/**
 * Send initial analytics data to a specific connection
 */
export function sendInitialData(
  eventId: string,
  controller: ReadableStreamDefaultController,
  analyticsData: any
): void {
  const message = `data: ${JSON.stringify({
    type: "initial_data",
    eventId,
    data: analyticsData,
    timestamp: new Date().toISOString(),
  })}\n\n`;

  try {
    controller.enqueue(new TextEncoder().encode(message));
    logger.info("Initial data sent", { eventId });
  } catch (error) {
    logger.error("Failed to send initial data", { eventId, error });
  }
}

/**
 * Get connection count for an event
 */
export function getConnectionCount(eventId: string): number {
  return sseConnections.get(eventId)?.size || 0;
}

/**
 * Get total connection count across all events
 */
export function getTotalConnectionCount(): number {
  let total = 0;
  sseConnections.forEach((connections) => {
    total += connections.size;
  });
  return total;
}

/**
 * Get list of events with active connections
 */
export function getActiveEvents(): string[] {
  return Array.from(sseConnections.keys());
}

/**
 * Clean up all connections (useful for shutdown)
 */
export function cleanupAllConnections(): void {
  sseConnections.clear();
  logger.info("All SSE connections cleaned up");
}
