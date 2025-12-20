import { factories } from '@strapi/strapi';
import { createUnifiedTerrainGenerator, DEFAULT_GENERATION_PARAMS } from '@daicer/shared';

// Cache generators by seed to avoid re-initializing noise/structures (optimization)
const generatorCache = new Map();

const getGenerator = (seed: string) => {
  if (!generatorCache.has(seed)) {
    // TODO: Load custom params from room settings if available
    generatorCache.set(seed, createUnifiedTerrainGenerator(seed, DEFAULT_GENERATION_PARAMS));
  }
  return generatorCache.get(seed);
};

export default ({ strapi }) => ({
  async generateChunk(roomId, chunkX, chunkY, chunkSize = 16) {
    // 1. Fetch Room to get Seed
    const room = await strapi.documents('api::room.room').findOne({
      documentId: roomId,
    });

    if (!room) {
      throw new Error(`Room not found: ${roomId}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settings = room.settings as any;
    const seed = settings?.seed || roomId; // Fallback to roomId if no seed

    // 2. Get Generator
    const generator = getGenerator(seed);

    // 3. Generate Chunk (returns ChunkDTO directly)
    // Note: shared generator returns standard ChunkDTO
    return generator(chunkX, chunkY, chunkSize);
  },

  async generateInitialMap(roomId) {
    // Generate 3x3 chunks around 0,0 for initial load
    // This covers -16 to +32 coords roughly if we do -1, 0, 1?
    // Or just 0,0, 64 size?
    // The old one did 64x64.
    // Unified generator works in chunks.
    // Let's return 4 chunks: (0,0), (1,0), (0,1), (1,1) -> 32x32 area?
    // Or just one big chunk if size is arbitrary?
    // createUnifiedTerrainGenerator returns a function(chunkX, chunkY, size).
    // It calculates worldOffset = chunkX * size.

    // If we want 64x64 at 0,0:
    // We can just ask for chunk (0,0) with size 64!

    const room = await strapi.documents('api::room.room').findOne({
      documentId: roomId,
    });
    if (!room) throw new Error('Room not found');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settings = room.settings as any;
    const seed = settings?.seed || roomId;

    console.log(`[TerrainService] generating initial map for room ${roomId} (seed: ${seed})`);

    const generator = getGenerator(seed);

    // Generate single large chunk for initial view to mimic old behavior but with 3D data
    // Size 64
    const initialChunk = generator(0, 0, 64);

    console.log(
      `[TerrainService] Generated initial chunk. Size: ${initialChunk.size}, Grid Layers: ${initialChunk.grid.length}`
    );
    // Log the center tile to sanity check
    const centerTile = initialChunk.grid[3]?.[32]?.[32];
    console.log(`[TerrainService] Sample Tile (32,32, Surface):`, centerTile);

    return [initialChunk];
  },
});
