/** Viewer terrain and visibility share one immutable set of persisted world chunks. */
import { createHash } from 'node:crypto';
import { PhysicsEngine } from '@/api/voxel-engine/services/utils/physics';
import type { WorldChunk } from '@/api/voxel-engine/services/chunk-manager';
import { normalizeWorldConfig, worldConfigHash } from '@/api/world/utils/world-config';
import type { Coordinates } from '@daicer/engine/types';

export async function projectRoomTerrain(strapi, world, origin: { x: number; y: number; z: number }) {
  if (!world?.documentId || !origin || !Number.isSafeInteger(origin.x) || !Number.isSafeInteger(origin.y) ||
      !Number.isInteger(origin.z) || origin.z < -3 || origin.z > 3) return null;
  const config = normalizeWorldConfig(world);
  const radius = Math.min(20, Math.floor(config.fogRadius));
  const width = Math.floor((origin.x + radius) / config.chunkSize) - Math.floor((origin.x - radius) / config.chunkSize) + 1;
  const height = Math.floor((origin.y + radius) / config.chunkSize) - Math.floor((origin.y - radius) / config.chunkSize) + 1;
  if (width * height > 32) throw new Error('Viewer terrain window exceeds the supported chunk count.');
  const chunks = new Map<string, Promise<WorldChunk>>();
  const getChunk = (x: number, y: number): Promise<WorldChunk> => {
    const key = `${x},${y}`;
    if (!chunks.has(key)) chunks.set(key, (async () => {
      const chunk: WorldChunk = await strapi.service('api::voxel-engine.voxel-engine').getChunk(x, y, config, world.documentId);
      if (chunk.worldId !== world.documentId || chunk.size !== config.chunkSize || chunk.x !== x || chunk.y !== y ||
          chunk.minZ !== -3 || chunk.maxZ !== 3 || typeof chunk.revision !== 'string') {
        throw new Error('Viewer terrain identity is inconsistent.');
      }
      return chunk;
    })());
    return chunks.get(key)!;
  };
  const visible = await new PhysicsEngine({ chunkSize: config.chunkSize, getChunk }).calculateFieldOfView({ ...origin, z: origin.z as Coordinates['z'] }, radius);
  const tiles = [];
  for (const key of visible) {
    const [x, y, z] = key.split(',').map(Number);
    const cx = Math.floor(x / config.chunkSize), cy = Math.floor(y / config.chunkSize);
    const chunk = await getChunk(cx, cy);
    const tile = chunk.tiles[z - chunk.minZ]?.[y - cy * config.chunkSize]?.[x - cx * config.chunkSize];
    if (!tile) continue;
    // No custom metadata, entities or unseen cells cross this boundary.
    tiles.push({ x, y, z, block: tile.block, biome: tile.biome,
      isWalkable: !!tile.isWalkable, isTransparent: !!tile.isTransparent });
  }
  tiles.sort((a, b) => a.z - b.z || a.y - b.y || a.x - b.x);
  const revision = createHash('sha256').update(JSON.stringify([world.documentId, worldConfigHash(config), tiles])).digest('hex');
  return { worldId: world.documentId, revision, chunkSize: config.chunkSize, minZ: -3, maxZ: 3, tiles };
}

/** Compatibility transport for old map callers: unknown cells stay null. */
export function maskedTerrainChunk(terrain, x: number, y: number, worldId: string, chunkSize: number) {
  const tiles = Array.from({ length: 7 }, () => Array.from({ length: chunkSize }, () => Array(chunkSize).fill(null)));
  if (terrain?.worldId === worldId && terrain.chunkSize === chunkSize) {
    for (const tile of terrain.tiles) {
      if (Math.floor(tile.x / chunkSize) === x && Math.floor(tile.y / chunkSize) === y) {
        tiles[tile.z + 3][tile.y - y * chunkSize][tile.x - x * chunkSize] = tile;
      }
    }
  }
  return { worldId, revision: terrain?.revision ?? null, x, y, size: chunkSize, minZ: -3, maxZ: 3, tiles };
}

export default () => ({ projectRoomTerrain, maskedTerrainChunk });
