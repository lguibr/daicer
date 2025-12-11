/**
 * Map Features Socket Handlers
 * Query features and entities by geospatial position
 */

import type { Socket } from 'socket.io';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import { getRoom } from '@/services/firestore/rooms';
import { mapService } from '@/services/map-service';

const queryFeaturesSchema = z.object({
  roomId: z.string().min(1),
  x: z.number().int(),
  y: z.number().int(),
  z: z.number().int().default(0),
  radius: z.number().min(1).max(10).default(1), // Radius in CHUNKS
  viewMode: z.enum(['player', 'dm']).default('player'),
});

/**
 * Register map feature query handlers
 */
export function registerMapFeatureHandlers(socket: Socket, userId: string): void {
  /**
   * Query map view (Chunks + Entities) around a center
   * Client emits: map:view:query
   * Server responds: map:view:result
   */
  socket.on('map:view:query', async (data, ack) => {
    try {
      const validation = queryFeaturesSchema.safeParse(data);
      if (!validation.success) {
        const error = { error: 'Invalid request', details: validation.error.message };
        socket.emit('map:view:error', error);
        if (typeof ack === 'function') ack(error);
        return;
      }

      const { roomId, x, y, z: posZ, radius, viewMode } = validation.data;

      // Verify room access
      const room = await getRoom(roomId);
      if (!room) {
        const error = { error: 'Room not found' };
        socket.emit('map:view:error', error);
        if (typeof ack === 'function') ack(error);
        return;
      }

      // Get centralized map view
      const result = await mapService.getMapView(roomId, { x, y, z: posZ }, radius);

      // Filter secrets if player mode (though mapService currently returns all)
      // We can filter entities here
      let entities = result.entities;
      if (viewMode === 'player') {
        entities = entities.filter((e) => e.isPublic || e.ownerId === userId);
      }

      const response = {
        roomId,
        center: { x, y, z: posZ },
        chunks: result.chunks,
        entities,
      };

      socket.emit('map:view:result', response);
      if (typeof ack === 'function') ack(null); // Success
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Map view query failed';
      logger.error('[MapFeatures] Query error:', error);
      socket.emit('map:view:error', { error: errorMsg });
      if (typeof ack === 'function') ack({ error: errorMsg });
    }
  });

  // Keep legacy handler for backward compatibility if needed, or remove it.
  // Given "clean up", let's deprecate or minimal-wrapper it.
  // Actually, let's remove the legacy 'map:features:query' to force migration?
  // The user asked for "stable during the process", so breaking changes might be risky if I don't update frontend immediately.
  // But I AM updating frontend in this task. So I will focus on the new 'map:view:query'.
}
