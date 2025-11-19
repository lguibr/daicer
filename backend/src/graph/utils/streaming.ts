/**
 * LangGraph Streaming Utilities
 * Provides Socket.IO integration for real-time graph event streaming
 */

import type { Server } from 'socket.io';
import { logger } from '@/utils/logger';

/**
 * Stream event types emitted during world generation
 */
export interface StreamEvent {
  type:
    | 'world_gen_chunk'
    | 'history_generation_start'
    | 'history_generation_complete'
    | 'structure_placement_complete'
    | 'road_generation_complete'
    | 'terrain_collapse_complete'
    | 'graph_progress'
    | 'graph_error'
    | 'graph_complete';
  content?: string;
  accumulated?: string;
  totalYears?: number;
  eraCount?: number;
  periodCount?: number;
  totalStructures?: number;
  totalRoads?: number;
  influences?: number;
  node?: string;
  data?: unknown;
  error?: string;
  timestamp?: number;
}

/**
 * Create a writer function for LangGraph streaming
 * Emits events to Socket.IO for real-time frontend updates
 *
 * @param io - Socket.IO server instance
 * @param roomId - Room ID to emit events to
 * @returns Writer function compatible with LangGraph config.configurable.writer
 */
export function createStreamWriter(io: Server, roomId: string) {
  return (event: StreamEvent) => {
    try {
      // Add timestamp if not present
      const enrichedEvent = {
        ...event,
        timestamp: event.timestamp || Date.now(),
      };

      // Emit to all clients in the room
      io.to(roomId).emit('world:stream', enrichedEvent);

      // Log for debugging
      logger.debug(`[Streaming] Emitted ${event.type} to room ${roomId}`, {
        type: event.type,
        hasContent: !!event.content,
        dataKeys: event.data ? Object.keys(event.data) : [],
      });
    } catch (error) {
      logger.error('[Streaming] Failed to emit event:', error);
    }
  };
}

/**
 * Check if streaming is available for a room
 * Validates that Socket.IO is initialized and room has active connections
 *
 * @param io - Socket.IO server instance
 * @param roomId - Room ID to check
 * @returns True if streaming is available
 */
export async function isStreamingAvailable(io: Server, roomId: string): Promise<boolean> {
  try {
    if (!io || !io.to) {
      logger.warn('[Streaming] Socket.IO not initialized');
      return false;
    }

    const socketsInRoom = await io.in(roomId).fetchSockets();
    if (socketsInRoom.length === 0) {
      logger.warn(`[Streaming] No active connections in room ${roomId}`);
      return false;
    }

    logger.debug(`[Streaming] Room ${roomId} has ${socketsInRoom.length} active connections`);
    return true;
  } catch (error) {
    logger.error('[Streaming] Error checking streaming availability:', error);
    return false;
  }
}
