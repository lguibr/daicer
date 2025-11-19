/**
 * SSE Connection Health Monitoring
 * Tracks connection alive time, detects stale connections, and auto-closes timed-out streams
 */

import type { Response } from 'express';
import { logger } from '@/utils/logger';

interface ConnectionHealth {
  connectedAt: number;
  lastEventAt: number;
  eventCount: number;
  roomId: string;
  section: string;
}

// Track health for all active SSE connections
const connectionHealthMap = new Map<string, ConnectionHealth>();

// Cleanup interval (check every 30s)
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Configuration
 */
const CONFIG = {
  MAX_CONNECTION_TIME: 5 * 60 * 1000, // 5 minutes max connection time
  STALE_THRESHOLD: 15 * 1000, // 15 seconds without events = stale warning
  CLEANUP_INTERVAL: 30 * 1000, // Check for stale connections every 30s
};

/**
 * Register a new SSE connection for health tracking
 */
export function registerSSEConnection(connectionKey: string, roomId: string, section: string): void {
  const now = Date.now();

  connectionHealthMap.set(connectionKey, {
    connectedAt: now,
    lastEventAt: now,
    eventCount: 0,
    roomId,
    section,
  });

  logger.debug('[SSE Health] Connection registered', {
    connectionKey,
    roomId,
    section,
  });

  // Start cleanup interval if not already running
  if (!cleanupInterval) {
    startCleanupInterval();
  }
}

/**
 * Update last event time for a connection
 */
export function recordSSEEvent(connectionKey: string): void {
  const health = connectionHealthMap.get(connectionKey);

  if (health) {
    health.lastEventAt = Date.now();
    health.eventCount += 1;
  }
}

/**
 * Remove connection from health tracking
 */
export function unregisterSSEConnection(connectionKey: string): void {
  const health = connectionHealthMap.get(connectionKey);

  if (health) {
    const durationMs = Date.now() - health.connectedAt;

    logger.debug('[SSE Health] Connection unregistered', {
      connectionKey,
      durationMs,
      eventCount: health.eventCount,
    });

    connectionHealthMap.delete(connectionKey);
  }

  // Stop cleanup interval if no connections remain
  if (connectionHealthMap.size === 0 && cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

/**
 * Check if a connection is stale (no events for >15s)
 */
export function isConnectionStale(connectionKey: string): boolean {
  const health = connectionHealthMap.get(connectionKey);

  if (!health) {
    return false;
  }

  const timeSinceLastEvent = Date.now() - health.lastEventAt;
  return timeSinceLastEvent > CONFIG.STALE_THRESHOLD;
}

/**
 * Get health stats for a connection
 */
export function getConnectionHealth(connectionKey: string): ConnectionHealth | null {
  return connectionHealthMap.get(connectionKey) || null;
}

/**
 * Get all active connections
 */
export function getAllConnections(): Map<string, ConnectionHealth> {
  return new Map(connectionHealthMap);
}

/**
 * Start the cleanup interval to check for stale/timed-out connections
 */
function startCleanupInterval(): void {
  cleanupInterval = setInterval(() => {
    const now = Date.now();

    for (const [key, health] of connectionHealthMap.entries()) {
      const connectionAge = now - health.connectedAt;
      const timeSinceLastEvent = now - health.lastEventAt;

      // Warn if stale (no events for >15s)
      if (timeSinceLastEvent > CONFIG.STALE_THRESHOLD && health.eventCount > 0) {
        logger.warn('[SSE Health] Stale connection detected', {
          connectionKey: key,
          roomId: health.roomId,
          section: health.section,
          timeSinceLastEventMs: timeSinceLastEvent,
          eventCount: health.eventCount,
        });
      }

      // Warn if connection is approaching timeout
      if (connectionAge > CONFIG.MAX_CONNECTION_TIME * 0.9) {
        logger.warn('[SSE Health] Connection approaching max age', {
          connectionKey: key,
          roomId: health.roomId,
          section: health.section,
          connectionAgeMs: connectionAge,
          maxAgeMs: CONFIG.MAX_CONNECTION_TIME,
        });
      }

      // Auto-close connections that exceed max time
      if (connectionAge > CONFIG.MAX_CONNECTION_TIME) {
        logger.error('[SSE Health] Connection timeout - auto-closing', {
          connectionKey: key,
          roomId: health.roomId,
          section: health.section,
          connectionAgeMs: connectionAge,
        });

        // Connection will be cleaned up by the close handler
        connectionHealthMap.delete(key);
      }
    }
  }, CONFIG.CLEANUP_INTERVAL);
}

/**
 * Enhanced SSE event sender with health tracking
 */
export function sendSSEWithHealth(res: Response, connectionKey: string, event: { type: string; data: any }): void {
  try {
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${JSON.stringify(event.data)}\n\n`);

    // Record the event
    recordSSEEvent(connectionKey);
  } catch (error) {
    logger.error('[SSE Health] Failed to send event', {
      connectionKey,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
