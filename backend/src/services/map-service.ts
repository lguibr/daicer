import { db } from '@/config/firebase';
import { generateGridChunk } from '@/services/world-gen/grid-chunk-generator';
import { GridChunk, worldToChunkCoords, chunkToWorldCoords, CHUNK_SIZE } from '@daicer/shared/world/grid-chunk-schema';
import { Entity, EntitySchema, EntityType } from '@daicer/shared/world/entity-schema';
import { MapConfig, Room } from '@daicer/shared/room/types';
import { logger } from '@/utils/logger';
import { getStructuresForChunk, stampStructureOnChunk } from '@/services/world-gen/structure-stamper';
import { actionBatcher } from './action-batcher';

export class MapService {
  private static instance: MapService;

  private constructor() {}

  public static getInstance(): MapService {
    if (!MapService.instance) {
      MapService.instance = new MapService();
    }
    return MapService.instance;
  }

  /**
   * Get the map configuration for a room, initializing if missing
   */
  async getMapConfig(roomId: string): Promise<MapConfig> {
    const roomRef = db().collection('rooms').doc(roomId);
    const roomDoc = await roomRef.get();

    if (!roomDoc.exists) {
      throw new Error(`Room ${roomId} not found`);
    }

    const roomData = roomDoc.data() as Room;

    if (roomData.mapConfig) {
      return roomData.mapConfig;
    }

    // Initialize default map config
    const defaultConfig: MapConfig = {
      seed: roomData.code || Math.random().toString(36).substring(7),
      gridEnabled: true,
      globalWaterLevel: -0.1,
      renderSettings: {
        showGrid: true,
        showCoordinates: false,
        fogOfWar: true,
      },
    };

    await roomRef.update({ mapConfig: defaultConfig });
    return defaultConfig;
  }

  /**
   * Update map configuration
   */
  async updateMapConfig(roomId: string, updates: Partial<MapConfig>): Promise<MapConfig> {
    const roomRef = db().collection('rooms').doc(roomId);

    // We need current config to merge
    const currentConfig = await this.getMapConfig(roomId);

    // Ensure renderSettings are properly merged and typed
    const currentRender = currentConfig.renderSettings || { showGrid: true, showCoordinates: false, fogOfWar: true };

    const newConfig: MapConfig = {
      ...currentConfig,
      ...updates,
      renderSettings: {
        showGrid: updates.renderSettings?.showGrid ?? currentRender.showGrid,
        showCoordinates: updates.renderSettings?.showCoordinates ?? currentRender.showCoordinates,
        fogOfWar: updates.renderSettings?.fogOfWar ?? currentRender.fogOfWar,
      },
    };

    await roomRef.update({ mapConfig: newConfig });
    return newConfig;
  }

  /**
   * Get a chunk, generating it if it doesn't exist
   * Now uses the Room's MapConfig for generation parameters and handles Structure Stamping
   */
  async getChunk(roomId: string, chunkX: number, chunkY: number, z: number = 0): Promise<GridChunk> {
    const chunkId = `${chunkX}_${chunkY}_${z}`;
    const chunkRef = db().collection('rooms').doc(roomId).collection('grid_chunks').doc(chunkId);

    // Fetch chunk and room data (for config & structures)
    const [chunkDoc, roomConfig] = await Promise.all([chunkRef.get(), this.getMapConfig(roomId)]);

    // We also need the full Room object to get the structures list
    // optimization: maybe cache this or pass it in? For now fetch.
    const roomRef = db().collection('rooms').doc(roomId);
    const roomData = (await roomRef.get()).data() as Room;

    const structuresList = roomData.structures || [];
    let shouldHaveStructure = false;
    let overlappingStructures: any[] = [];

    // Check for overlapping structures if we are on surface (z=0 for now)
    // Adjust if structures support 3D
    if (z === 0 && structuresList.length > 0) {
      overlappingStructures = getStructuresForChunk(
        structuresList,
        chunkX * CHUNK_SIZE,
        chunkY * CHUNK_SIZE,
        CHUNK_SIZE,
        roomConfig.seed
      );
      shouldHaveStructure = overlappingStructures.length > 0;
    }

    if (chunkDoc.exists) {
      const chunk = chunkDoc.data() as GridChunk;

      // Smart Cache Invalidation
      const isStale = shouldHaveStructure && !chunk.hasStructure;

      if (!isStale) {
        return chunk;
      }
      logger.info(`[MapService] Chunk ${chunkId} is stale (missing structure), regenerating...`);
    }

    // Generate new chunk
    // 1. Terrain
    const chunk = generateGridChunk(chunkX, chunkY, z, {
      seed: roomConfig.seed,
      waterLevel: roomConfig.globalWaterLevel,
      // Pass other config params as needed
    });

    // 2. Structures
    if (shouldHaveStructure) {
      for (const structure of overlappingStructures) {
        chunk.tiles = stampStructureOnChunk(
          chunk.tiles,
          structure,
          chunkX * CHUNK_SIZE,
          chunkY * CHUNK_SIZE,
          CHUNK_SIZE,
          z // Phase 1: Pass Z
        );
      }
      chunk.hasStructure = true;
      logger.info(`[MapService] Stamped ${overlappingStructures.length} structures on chunk ${chunkId}`);
    }

    // Save to DB
    await chunkRef.set(chunk);
    return chunk;
  }

  /**
   * Get entities in a specific area (Viewport)
   */
  async getEntitiesInArea(
    roomId: string,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    z: number = 0
  ): Promise<Entity[]> {
    // Firestore range queries are limited to one field.
    // We'll filter primarily by X then filter Y in memory.
    const snapshot = await db()
      .collection('rooms')
      .doc(roomId)
      .collection('entities')
      .where('z', '==', z)
      .where('x', '>=', minX)
      .where('x', '<=', maxX)
      .get();

    const entities: Entity[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as Entity;
      if (data.y >= minY && data.y <= maxY) {
        entities.push(data);
      }
    });

    return entities;
  }

  /**
   * Get Map Viewport
   * Returns everything needed to render a section of the map:
   * Chunks + Entities + Memories (which are just entities now)
   */
  async getMapView(
    roomId: string,
    center: { x: number; y: number; z: number },
    radius: number // in chunks
  ): Promise<{ chunks: GridChunk[]; entities: Entity[] }> {
    const { chunkX, chunkY } = worldToChunkCoords(center.x, center.y);

    // Calculate chunk range
    const minChunkX = chunkX - radius;
    const maxChunkX = chunkX + radius;
    const minChunkY = chunkY - radius;
    const maxChunkY = chunkY + radius;

    // Fetch Chunks
    const chunkPromises: Promise<GridChunk>[] = [];
    for (let x = minChunkX; x <= maxChunkX; x++) {
      for (let y = minChunkY; y <= maxChunkY; y++) {
        chunkPromises.push(this.getChunk(roomId, x, y, center.z));
      }
    }

    const chunks = await Promise.all(chunkPromises);

    // Calculate World Bounds for Entity Fetch
    const minWorld = chunkToWorldCoords(minChunkX, minChunkY);
    const maxWorld = chunkToWorldCoords(maxChunkX + 1, maxChunkY + 1); // +1 to include the full last chunk

    // Fetch Entities (Players, NPCs, Memories)
    const entities = await this.getEntitiesInArea(roomId, minWorld.x, minWorld.y, maxWorld.x, maxWorld.y, center.z);

    return { chunks, entities };
  }

  /**
   * Move an entity to a new position
   */
  async moveEntity(
    roomId: string,
    entityId: string,
    targetX: number,
    targetY: number,
    targetZ: number = 0
  ): Promise<Entity> {
    const entityRef = db().collection('rooms').doc(roomId).collection('entities').doc(entityId);
    const doc = await entityRef.get();

    if (!doc.exists) {
      throw new Error(`Entity ${entityId} not found`);
    }

    const entity = doc.data() as Entity;

    // Validate movement / Generate destination chunk
    const { chunkX, chunkY } = worldToChunkCoords(targetX, targetY);
    const chunk = await this.getChunk(roomId, chunkX, chunkY, targetZ);

    // Basic collision check (optional, can be disabled/enabled via config)
    const tile = chunk.tiles.find((t) => t.x === targetX && t.y === targetY);
    if (tile && tile.blockType !== 'air' && tile.blockType !== 'water') {
      // Collision logic here
    }

    const updatedEntity = {
      ...entity,
      x: targetX,
      y: targetY,
      z: targetZ,
    };

    await entityRef.set(updatedEntity);
    return updatedEntity;
  }

  /**
   * Queue an entity move for batch execution
   * Optimized to avoid extra reads if entity is already known
   */
  async queueMoveEntity(
    roomId: string,
    entity: Entity,
    targetX: number,
    targetY: number,
    targetZ: number = 0
  ): Promise<void> {
    const entityRef = db().collection('rooms').doc(roomId).collection('entities').doc(entity.id);

    // Validate movement / Generate destination chunk (async but cached/fast)
    const { chunkX, chunkY } = worldToChunkCoords(targetX, targetY);
    // Note: We might want to skip chunk generation here if strictly optimizing,
    // but collision check needs it. Assuming chunk exists or generated.
    const chunk = await this.getChunk(roomId, chunkX, chunkY, targetZ);

    // Basic collision check
    const tile = chunk.tiles.find((t) => t.x === targetX && t.y === targetY);
    if (tile && tile.blockType !== 'air' && tile.blockType !== 'water') {
      logger.warn(`[MapService] Collision detected for ${entity.id} at ${targetX},${targetY}`);
      // return without moving? Or force move? For now, allow it but log.
    }

    const updatedEntity = {
      ...entity,
      x: targetX,
      y: targetY,
      z: targetZ,
    };

    actionBatcher.add(roomId, {
      type: 'set',
      ref: entityRef,
      data: updatedEntity,
    });
  }

  /**
   * Spawn a new entity (Player, NPC, or Memory)
   */
  async spawnEntity(roomId: string, entityData: Omit<Entity, 'id' | 'roomId'>): Promise<Entity> {
    const collectionRef = db().collection('rooms').doc(roomId).collection('entities');
    const docRef = collectionRef.doc();

    const entity: Entity = {
      ...entityData,
      id: docRef.id,
      roomId,
      metadata: entityData.metadata || {},
    };

    // Validate with schema
    const validated = EntitySchema.parse(entity);

    await docRef.set(validated);
    logger.info(`[MapService] Spawned entity ${validated.type} at (${validated.x}, ${validated.y})`);
    return validated;
  }

  /**
   * Add a Memory (wrapper around spawnEntity for convenience)
   */
  async addMemory(
    roomId: string,
    x: number,
    y: number,
    z: number,
    text: string,
    isSecret: boolean = false
  ): Promise<Entity> {
    return this.spawnEntity(roomId, {
      type: 'memory' as EntityType,
      name: 'Memory',
      x,
      y,
      z,
      loreText: text,
      isSecret,
      visibilityRadius: 0,
      isPublic: !isSecret,
      scale: 1,
      metadata: {},
    });
  }

  async deleteEntity(roomId: string, entityId: string): Promise<void> {
    await db().collection('rooms').doc(roomId).collection('entities').doc(entityId).delete();
  }
}

export const mapService = MapService.getInstance();
