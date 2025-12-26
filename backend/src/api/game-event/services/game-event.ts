/**
 * game-event service
 */

import { factories } from '@strapi/strapi';
import { Voxel } from '@daicer/engine';

const getWorldGenerator = async (strapi: any, roomId: number) => {
  // @ts-ignore
  const room = await strapi.entityService.findOne('api::room.room', roomId, {
    populate: ['settings'] as any,
  });

  if (!room) throw new Error('Room not found');

  const config = {
    seed: room.code || 'default_seed',
    chunkSize: 32,
    seaLevel: 0,
    globalScale: 0.01,
    elevationScale: 1,
    moistureScale: 1,
    temperatureOffset: 0,
    roughness: 0.5,
    detail: 0.5,
    structureChance: 0.1,
    structureSpacing: 500,
    structureSizeAvg: 20,
    roadDensity: 0.2,
    fogRadius: 10,
  };

  return new Voxel.WorldGenerator(config);
};

// @ts-ignore
export default factories.createCoreService('api::game-event.game-event', ({ strapi }) => ({
  /**
   * Log an event to the Time Machine
   */
  async logEvent(roomId: number, type: string, payload: any, actorId?: string) {
    // Determine the next turn number based on the last event (naive approach)
    // In a real system we might track this in the Room directly or count events
    // @ts-ignore
    const lastEvent = await strapi.entityService.findMany('api::game-event.game-event', {
      filters: { room: roomId },
      sort: { turnNumber: 'desc' },
      limit: 1,
    });

    const validLastEvent = Array.isArray(lastEvent) ? lastEvent[0] : lastEvent;
    // @ts-ignore
    const turnNumber = validLastEvent ? (validLastEvent.turnNumber || 0) + 1 : 1;

    // @ts-ignore
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
  async validateMove(
    roomId: number,
    from: { x: number; y: number; z: number },
    to: { x: number; y: number; z: number }
  ) {
    const gen = await getWorldGenerator(strapi, roomId);
    const physics = new Voxel.PhysicsEngine(gen);

    // @ts-ignore
    const isWalkable = physics.isWalkable({ x: to.x, y: to.y, z: to.z as any });

    return {
      valid: isWalkable,
      reason: isWalkable ? null : 'Blocked',
    };
  },

  /**
   * Reconstruct Game State by replaying events
   */
  async getGameState(roomId: number) {
    // @ts-ignore
    const events = await strapi.entityService.findMany('api::game-event.game-event', {
      filters: { room: roomId },
      sort: { turnNumber: 'asc' },
      limit: -1, // Fetch all (careful in production!)
    });

    // Default State
    const state = {
      entities: {} as Record<string, { x: number; y: number; z: number }>,
    };

    // Replay
    const eventList = (Array.isArray(events) ? events : [events]) as any[];
    for (const event of eventList) {
      if (event.type === 'MOVE') {
        const p = event.payload as Voxel.MoveEventPayload;
        if (p.entityId && p.to) {
          state.entities[p.entityId] = p.to;
        }
      }
      // Handle other event types here (SPAWN, etc.)
    }

    return state;
  },

  /**
   * Inspect Terrain at a location
   */
  async inspectTerrain(roomId: number, x: number, y: number, radius: number) {
    const gen = await getWorldGenerator(strapi, roomId);

    // Convert world coords to chunk coords
    const chunkSize = 32; // Defined in config above
    const chunkX = Math.floor(x / chunkSize);
    const chunkY = Math.floor(y / chunkSize);

    // Get the chunk
    const chunk = gen.getChunk(chunkX, chunkY);

    // Find tile in chunk
    const localX = ((x % chunkSize) + chunkSize) % chunkSize;
    const localY = ((y % chunkSize) + chunkSize) % chunkSize;
    // Assuming surface (z=0) for standard inspection, or we iterate Z
    const z = 0;

    // Helper to safe get
    const safeGet = (cx: number, cy: number, lx: number, ly: number) => {
      const c = gen.getChunk(cx, cy);
      // @ts-ignore
      if (c && c.tiles && c.tiles[z] && c.tiles[z][lx] && c.tiles[z][lx][ly]) {
        // @ts-ignore
        return c.tiles[z][lx][ly];
      }
      return null;
    };

    const tile = safeGet(chunkX, chunkY, localX, localY);

    if (!tile) return `Void at ${x},${y}`;
    return `Terrain: ${tile.biome} (${tile.block})`;
  },
}));
