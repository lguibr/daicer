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
  entityService: {
    findOne: (uid: string, id: number | string, params?: any) => Promise<any>;
    findMany: (uid: string, params?: any) => Promise<any>;
    create: (uid: string, params: { data: any }) => Promise<any>;
  };
}

interface RoomSettings {
  code?: string;
  [key: string]: any;
}

const getWorldGenerator = async (strapi: Strapi, roomId: number) => {
  const room = await strapi.entityService.findOne('api::room.room', roomId, {
    populate: ['settings'],
  });

  if (!room) throw new Error('Room not found');

  const settings = room.settings as RoomSettings;

  const config = {
    ...DEFAULT_WORLD_CONFIG,
    seed: room.code || settings?.code || 'default_seed',
  };

  return new WorldGenerator(config);
};

export default factories.createCoreService('api::game-event.game-event', ({ strapi }: { strapi: Strapi }) => ({
  /**
   * Log an event to the Time Machine
   */
  async logEvent(roomId: number, type: string, payload: unknown, actorId?: string) {
    const lastEvents = await strapi.entityService.findMany('api::game-event.game-event', {
      filters: { room: roomId },
      sort: { turnNumber: 'desc' },
      limit: 1,
    });
    const lastEvent = Array.isArray(lastEvents) ? lastEvents[0] : lastEvents;
    const turnNumber = lastEvent ? (lastEvent.turnNumber || 0) + 1 : 1;

    return await strapi.entityService.create('api::game-event.game-event', {
      data: {
        room: roomId,
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
  async validateMove(roomId: number, from: Coordinates, to: Coordinates) {
    // Validate inputs with Zod (Runtime Safety)
    try {
      // Just validating the structure, logic handled below
      MapMovePayloadSchema.shape.from.parse(from);
      MapMovePayloadSchema.shape.to.parse(to);
    } catch (_e) {
      return { valid: false, reason: 'Invalid coordinates' };
    }

    const gen = await getWorldGenerator(strapi, roomId);
    const physics = new PhysicsEngine(gen);

    // Shared Coordinates z is number, Engine expects strict union. Validated by runtime check in physics.
    const isWalkable = await physics.isWalkable(to as any);

    return {
      valid: isWalkable,
      reason: isWalkable ? null : 'Blocked',
    };
  },

  /**
   * Reconstruct Game State by replaying events
   */
  async getGameState(roomId: number) {
    const events = await strapi.entityService.findMany('api::game-event.game-event', {
      filters: { room: { id: roomId } },
      sort: { turnNumber: 'asc' },
      limit: -1,
    });

    // Default State
    const state = {
      entities: {} as Record<string, Coordinates>,
    };

    // Replay
    const eventList = Array.isArray(events) ? events : [events];

    for (const event of eventList) {
      if (event.type === 'MOVE') {
        const result = MapMovePayloadSchema.safeParse(event.payload);
        if (result.success) {
          const p = result.data;
          state.entities[String(p.entityId)] = p.to;
        }
      }
      // Handle other event types here (SPAWN, etc.)
    }

    return state;
  },

  /**
   * Inspect Terrain at a location
   */
  async inspectTerrain(roomId: number, x: number, y: number, _radius: number) {
    const gen = await getWorldGenerator(strapi, roomId);

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
