/**
 * Map Features Socket Handlers
 * Query features and entities by geospatial position
 * Rule 2: Player Vision is Geospatial
 */

import type { Socket } from 'socket.io';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import { getRoom } from '@/services/firestore/rooms';
import { getEntitiesInRadius } from '@/services/geospatialQuery';
// import { getRoomById } from '@/services/room/queries';

const queryFeaturesSchema = z.object({
  roomId: z.string().min(1),
  x: z.number().int(),
  y: z.number().int(),
  z: z.number().int().default(0),
  radius: z.number().min(1).max(100),
  viewMode: z.enum(['player', 'dm']).default('player'),
});

/**
 * Register map feature query handlers
 */
export function registerMapFeatureHandlers(socket: Socket, userId: string): void {
  /**
   * Query features within radius of a position
   * Client emits: map:features:query
   * Server responds: map:features:result or map:features:error
   */
  socket.on('map:features:query', async (data, ack) => {
    try {
      const validation = queryFeaturesSchema.safeParse(data);
      if (!validation.success) {
        const error = { error: 'Invalid request', details: validation.error.message };
        socket.emit('map:features:error', error);
        if (typeof ack === 'function') ack(error);
        return;
      }

      const { roomId, x, y, z, radius, viewMode } = validation.data;

      // Verify room access
      const room = await getRoom(roomId);
      if (!room) {
        const error = { error: 'Room not found' };
        logger.error('[MapFeatures] Room not found', { roomId, userId });
        socket.emit('map:features:error', error);
        if (typeof ack === 'function') ack(error);
        return;
      }

      // Get game state from room
      const gameState = room.state || null;

      // Query entities and features
      const result = getEntitiesInRadius(gameState, { x, y, z }, radius, viewMode);

      const response = {
        roomId,
        center: { x, y, z },
        radius,
        viewMode,
        ...result,
      };

      socket.emit('map:features:result', response);
      if (typeof ack === 'function') ack(null); // Success

      logger.debug('[MapFeatures] Query completed', {
        roomId,
        position: { x, y, z },
        radius,
        viewMode,
        featureCount: result.features.length,
        entityCount: result.entities.length,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Feature query failed';
      logger.error('[MapFeatures] Query error:', error);
      socket.emit('map:features:error', { error: errorMsg });
      if (typeof ack === 'function') ack({ error: errorMsg });
    }
  });

  /**
   * Query single tile features
   * Client emits: map:tile:query
   * Server responds: map:tile:result or map:features:error
   */
  socket.on('map:tile:query', async (data, ack) => {
    try {
      const validation = z
        .object({
          roomId: z.string().min(1),
          x: z.number().int(),
          y: z.number().int(),
          z: z.number().int().default(0),
        })
        .safeParse(data);

      if (!validation.success) {
        const error = { error: 'Invalid request', details: validation.error.message };
        socket.emit('map:features:error', error);
        if (typeof ack === 'function') ack(error);
        return;
      }

      const { roomId, x, y, z: posZ } = validation.data;

      // Verify room access
      const room = await getRoom(roomId);
      if (!room) {
        const error = { error: 'Room not found' };
        socket.emit('map:features:error', error);
        if (typeof ack === 'function') ack(error);
        return;
      }

      const gameState = room.state || null;

      // Query with 0.5 radius (same tile only)
      const result = getEntitiesInRadius(
        gameState,
        { x, y, z: posZ },
        0.5,
        'dm' // Always show everything for single tile
      );

      const response = {
        roomId,
        position: { x, y, z },
        ...result,
      };

      socket.emit('map:tile:result', response);
      if (typeof ack === 'function') ack(null);

      logger.debug('[MapFeatures] Tile query completed', {
        roomId,
        position: { x, y, z },
        featureCount: result.features.length,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Tile query failed';
      logger.error('[MapFeatures] Tile query error:', error);
      socket.emit('map:features:error', { error: errorMsg });
      if (typeof ack === 'function') ack({ error: errorMsg });
    }
  });
}
