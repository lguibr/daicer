/**
 * game-event service
 */

import { factories } from '@strapi/strapi';
import { WorldGenerator } from '../../voxel-engine/services/world-generator-logic';
import { PhysicsEngine } from '../../voxel-engine/services/utils/physics';
import { MapMovePayloadSchema } from '@daicer/shared';
import { DEFAULT_WORLD_CONFIG } from '@daicer/engine';
import type { Coordinates } from '@daicer/shared';

// Minimal Strapi Type Definition for safety
interface Strapi {
  documents: (uid: string) => {
    findOne: (params: unknown) => Promise<unknown>;
    findMany: (params: unknown) => Promise<unknown[]>;
    create: (params: { data: unknown }) => Promise<unknown>;
  };
}

const getWorldGenerator = async (strapi: Strapi, roomDocumentId: string) => {
  const room = await strapi.documents('api::room.room').findOne({
    documentId: roomDocumentId,
    populate: ['world'],
  });

  if (!room) throw new Error('Room not found');

  const world = (room as { world: Record<string, unknown> }).world || {};

  const config = {
    ...DEFAULT_WORLD_CONFIG,
    seed: ((room as { code?: string }).code as string) || (world.seed as string) || 'default_seed',
  };

  return new WorldGenerator(config);
};

export default factories.createCoreService('api::game-event.game-event', ({ strapi }: { strapi: Strapi }) => ({
  /**
   * Log an event to the Time Machine
   */
  async logEvent(roomDocumentId: string, type: string, payload: unknown, actorId?: string) {
    const lastEvents = await strapi.documents('api::game-event.game-event').findMany({
      filters: { room: { documentId: roomDocumentId } },
      sort: 'turnNumber:desc',
      limit: 1,
    });
    const lastEvent = lastEvents.length > 0 ? (lastEvents[0] as { turnNumber?: number }) : null;
    const turnNumber = lastEvent ? (lastEvent.turnNumber || 0) + 1 : 1;

    return await strapi.documents('api::game-event.game-event').create({
      data: {
        room: roomDocumentId,
        type,
        payload,
        actorId,
        timestamp: Date.now(),
        turnNumber,
      },
    });
  },

  /**
   * Validate a move request via the Engine
   */
  async validateMove(roomDocumentId: string, from: Coordinates, to: Coordinates) {
    // Validate inputs with Zod (Runtime Safety)
    try {
      // Just validating the structure, logic handled below
      MapMovePayloadSchema.shape.from.parse(from);
      MapMovePayloadSchema.shape.to.parse(to);
    } catch {
      return { valid: false, reason: 'Invalid coordinates' };
    }

    const gen = await getWorldGenerator(strapi, roomDocumentId);
    const physics = new PhysicsEngine(gen);

    // Shared Coordinates z is number, Engine expects strict union. Validated by runtime check in physics.
    const isWalkable = await physics.isWalkable(to as { x: number; y: number; z: 0 | 1 | 2 | 3 | -1 | -2 | -3 });

    // Also check for entity collision
    const gameState = await this.getGameState(roomDocumentId);

    // Check if any entity is already at the destination (simple collision)
    // In a real system we'd check against entity sizes, but for now 1 tile = 1 entity
    const occupied = Object.values(gameState.entities).some(
      (pos) => pos.x === to.x && pos.y === to.y && pos.z === to.z
    );

    if (occupied) {
      return { valid: false, reason: 'Destination occupied' };
    }

    return {
      valid: isWalkable,
      reason: isWalkable ? null : 'Blocked',
    };
  },

  /**
   * Reconstruct Game State by replaying events
   */
  async getGameState(roomDocumentId: string) {
    const events = await strapi.documents('api::game-event.game-event').findMany({
      filters: { room: { documentId: roomDocumentId } },
      sort: 'turnNumber:asc',
      limit: 10000, // Reasonable limit for now
    });

    // Default State
    const state = {
      entities: {} as Record<string, Coordinates>,
    };

    // Replay
    for (const event of events as { type: string; payload: unknown }[]) {
      if (event.type === 'MOVE') {
        const result = MapMovePayloadSchema.safeParse(event.payload);
        if (result.success) {
          const p = result.data;
          state.entities[String(p.entityId)] = p.to;
        }
      } else if (event.type === 'SPAWN_ENTITY') {
        // Assume payload has { entityId, position }
        // We need to support this for consistent state
        const p = event.payload as { entityId: string; position: Coordinates };
        if (p?.entityId && p?.position) {
          state.entities[String(p.entityId)] = p.position;
        }
      }
    }

    return state;
  },

  /**
   * Inspect Terrain at a location
   */
  async inspectTerrain(roomDocumentId: string, x: number, y: number, _radius: number) {
    const gen = await getWorldGenerator(strapi, roomDocumentId);

    // Convert world coords to chunk coords
    const chunkSize = 32;
    const chunkX = Math.floor(x / chunkSize);
    const chunkY = Math.floor(y / chunkSize);

    // Get the chunk
    const chunk = await gen.getChunk(chunkX, chunkY);

    // Find tile in chunk
    const localX = ((x % chunkSize) + chunkSize) % chunkSize;
    const localY = ((y % chunkSize) + chunkSize) % chunkSize;
    // Assuming surface (z=0) for standard inspection
    const z = 0;

    if (chunk && chunk.tiles && chunk.tiles[z] && chunk.tiles[z][localY] && chunk.tiles[z][localY][localX]) {
      const tile = chunk.tiles[z][localY][localX];
      return `Terrain: ${tile.biome} (${tile.block})`;
    }

    return `Void at ${x},${y}`;
  },
}));
