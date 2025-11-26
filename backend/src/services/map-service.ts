import { db } from '@/services/firestore';
import { generateGridChunk } from '@/services/world-gen/grid-chunk-generator';
import { logger } from '@/utils/logger';
import { 
  GridChunk, 
  GridTile, 
  Entity, 
  EntitySchema, 
  chunkToWorldCoords, 
  worldToChunkCoords, 
  CHUNK_SIZE 
} from '@daicer/shared/world';

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
   * Get a chunk, generating it if it doesn't exist
   */
  async getChunk(roomId: string, chunkX: number, chunkY: number, z: number = 0): Promise<GridChunk> {
    const chunkId = `${chunkX}_${chunkY}_${z}`;
    const chunkRef = db.collection('rooms').doc(roomId).collection('grid_chunks').doc(chunkId);
    const doc = await chunkRef.get();

    if (doc.exists) {
      return doc.data() as GridChunk;
    }

    // Generate new chunk
    // First get room seed
    const roomDoc = await db.collection('rooms').doc(roomId).get();
    const seed = roomDoc.data()?.seed || roomId;

    const chunk = generateGridChunk(chunkX, chunkY, z, {
      seed,
      waterLevel: -0.1,
      mountainousness: 1.0,
      caveFrequency: 0.5,
    });

    // Save to DB
    await chunkRef.set(chunk);
    return chunk;
  }

  /**
   * Get entities in a specific area
   */
  async getEntitiesInArea(roomId: string, minX: number, minY: number, maxX: number, maxY: number, z: number = 0): Promise<Entity[]> {
    const snapshot = await db.collection('rooms').doc(roomId).collection('entities')
      .where('z', '==', z)
      .where('x', '>=', minX)
      .where('x', '<=', maxX)
      .get();

    const entities: Entity[] = [];
    snapshot.forEach(doc => {
      const data = doc.data() as Entity;
      if (data.y >= minY && data.y <= maxY) {
        entities.push(data);
      }
    });

    return entities;
  }

  /**
   * Move an entity to a new position
   */
  async moveEntity(roomId: string, entityId: string, targetX: number, targetY: number, targetZ: number = 0): Promise<Entity> {
    const entityRef = db.collection('rooms').doc(roomId).collection('entities').doc(entityId);
    const doc = await entityRef.get();

    if (!doc.exists) {
      throw new Error(`Entity ${entityId} not found`);
    }

    const entity = doc.data() as Entity;

    // Validate movement (e.g., check collision with terrain)
    // For now, just check if target chunk exists/is generated
    const { chunkX, chunkY } = worldToChunkCoords(targetX, targetY);
    const chunk = await this.getChunk(roomId, chunkX, chunkY, targetZ);
    
    // Check if tile is passable (simple check)
    const localX = Math.abs(targetX % CHUNK_SIZE);
    const localY = Math.abs(targetY % CHUNK_SIZE);
    const tile = chunk.tiles.find(t => t.x === targetX && t.y === targetY); // This search is inefficient for large chunks, but fine for 8x8

    if (tile && tile.blockType !== 'air' && tile.blockType !== 'water') { // Assuming simple collision
       // Allow movement for now, maybe add strict collision later
    }

    const updatedEntity = {
      ...entity,
      x: targetX,
      y: targetY,
      z: targetZ
    };

    await entityRef.set(updatedEntity);
    return updatedEntity;
  }

  /**
   * Spawn a new entity
   */
  async spawnEntity(roomId: string, entityData: Omit<Entity, 'id'>): Promise<Entity> {
    const collectionRef = db.collection('rooms').doc(roomId).collection('entities');
    const docRef = collectionRef.doc();
    
    const entity: Entity = {
      ...entityData,
      id: docRef.id,
      roomId
    };

    // Validate with schema
    const validated = EntitySchema.parse(entity);
    
    await docRef.set(validated);
    return validated;
  }
}

export const mapService = MapService.getInstance();
