/**
 * World Chunk Socket Handlers
 * Real-time chunk streaming for procedural map generation
 */

import type { Socket } from 'socket.io';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import { getWorldMap } from '@/services/world-gen/worldGenService';
import { getWorkerPool } from '@/workers/workerPool';

// Maximum chunks per batch request to prevent worker pool overload and memory issues
// This limit balances:
// - Worker pool capacity (default 6 workers, processing 6 chunks in parallel)
// - Memory constraints (each chunk can be ~100KB of tile data)
// - Network responsiveness (batches complete in ~1-3 seconds)
const MAX_CHUNKS_PER_BATCH = 50;

const requestChunkSchema = z.object({
  worldId: z.string().min(1),
  chunkX: z.number().int().min(-1000).max(1000),
  chunkY: z.number().int().min(-1000).max(1000),
  chunkZ: z.number().int().min(-10).max(10),
});

const requestChunksSchema = z.object({
  worldId: z.string().min(1),
  chunks: z
    .array(
      z.object({
        chunkX: z.number().int().min(-1000).max(1000),
        chunkY: z.number().int().min(-1000).max(1000),
        chunkZ: z.number().int().min(-10).max(10),
      })
    )
    .max(MAX_CHUNKS_PER_BATCH, {
      message: `Too many chunks requested. Maximum ${MAX_CHUNKS_PER_BATCH} chunks per batch.`,
    }),
});

/**
 * Register world chunk streaming handlers
 */
export function registerWorldChunkHandlers(socket: Socket, userId: string): void {
  /**
   * Request a single chunk with timeout support
   * Client emits: world:chunk:request
   * Server responds: world:chunk:data or world:chunk:error
   */
  socket.on('world:chunk:request', async (data, ack) => {
    const startTime = Date.now();

    try {
      const validation = requestChunkSchema.safeParse(data);
      if (!validation.success) {
        const error = { error: 'Invalid request', details: validation.error.message };
        socket.emit('world:chunk:error', error);
        if (typeof ack === 'function') ack(error);
        return;
      }

      const { worldId, chunkX, chunkY, chunkZ } = validation.data;

      // Verify world access
      const world = await getWorldMap(worldId);
      if (!world) {
        const error = { error: 'World not found' };
        logger.error('[WorldChunks] World not found', { worldId, userId });
        socket.emit('world:chunk:error', error);
        if (typeof ack === 'function') ack(error);
        return;
      }

      logger.debug('[WorldChunks] Access check', {
        worldId,
        userId,
        worldCreatedBy: world.createdBy,
        match: world.createdBy === userId,
      });

      if (world.createdBy !== userId) {
        const error = { error: 'Access denied' };
        logger.warn('[WorldChunks] Access denied', { worldId, userId, worldCreatedBy: world.createdBy });
        socket.emit('world:chunk:error', error);
        if (typeof ack === 'function') ack(error);
        return;
      }

      // Generate chunk using worker pool
      const workerPool = getWorkerPool();
      const chunk = await workerPool.run({
        seed: world.seed,
        chunkX,
        chunkY,
        chunkZ,
        params: world.parameters,
      });

      // Validate chunk structure
      if (!chunk || !chunk.tiles || !Array.isArray(chunk.tiles)) {
        const error = { error: 'Invalid chunk data' };
        logger.error('[WorldChunks] Invalid chunk structure', { worldId, chunkX, chunkY, chunkZ });
        socket.emit('world:chunk:error', error);
        if (typeof ack === 'function') ack(error);
        return;
      }

      // Compress response - for 2D rendering, send ONE tile per (x,y) position
      // Group by x,y and pick the topmost non-air tile
      const tileMap = new Map<string, (typeof chunk.tiles)[0]>();

      for (const tile of chunk.tiles) {
        const key = `${tile.x},${tile.y}`;
        const existing = tileMap.get(key);

        // Keep the tile with highest z that isn't air
        if (tile.blockType !== 'air') {
          if (!existing || tile.z > existing.z) {
            tileMap.set(key, tile);
          }
        }
      }

      const surfaceTiles = Array.from(tileMap.values()).map((tile: any) => ({
        x: tile.x,
        y: tile.y,
        z: tile.z,
        biome: tile.biome,
        elevation: tile.elevation,
      }));

      const response = {
        worldId,
        chunkX: chunk.chunkX,
        chunkY: chunk.chunkY,
        chunkZ: chunk.chunkZ,
        tiles: surfaceTiles,
        biomes: chunk.biomes ? Array.from(chunk.biomes) : [],
      };

      socket.emit('world:chunk:data', response);
      if (typeof ack === 'function') ack(null); // Success acknowledgement

      const elapsed = Date.now() - startTime;
      logger.debug(
        `[WorldChunks] Generated chunk (${chunkX},${chunkY},${chunkZ}) - ${surfaceTiles.length} tiles in ${elapsed}ms`
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Chunk generation failed';
      logger.error('[WorldChunks] Chunk generation error:', error);
      socket.emit('world:chunk:error', { error: errorMsg });
      if (typeof ack === 'function') ack({ error: errorMsg });
    }
  });

  /**
   * Request multiple chunks in batch with concurrency control
   * Client emits: world:chunks:request with array of chunk coords
   * Server responds with individual world:chunk:data for each, then world:chunks:complete
   */
  socket.on('world:chunks:request', async (data, ack) => {
    const startTime = Date.now();

    try {
      const validation = requestChunksSchema.safeParse(data);
      if (!validation.success) {
        const errorDetails = JSON.stringify(validation.error.issues, null, 2);
        const chunkCount = Array.isArray(data?.chunks) ? data.chunks.length : 'unknown';
        const error = {
          error: 'Invalid batch request',
          details: errorDetails,
          message: `Received ${chunkCount} chunks, maximum ${MAX_CHUNKS_PER_BATCH} allowed per batch`,
        };
        logger.warn('[WorldChunks] Batch validation failed', {
          worldId: data?.worldId,
          requestedChunks: chunkCount,
          maxAllowed: MAX_CHUNKS_PER_BATCH,
        });
        socket.emit('world:chunk:error', error);
        if (typeof ack === 'function') ack(error);
        return;
      }

      const { worldId, chunks } = validation.data;

      // Verify world access once
      const world = await getWorldMap(worldId);
      if (!world) {
        const error = { error: 'World not found' };
        socket.emit('world:chunk:error', error);
        if (typeof ack === 'function') ack(error);
        return;
      }

      if (world.createdBy !== userId) {
        const error = { error: 'Access denied' };
        logger.warn('[WorldChunks] Batch access denied', { worldId, userId });
        socket.emit('world:chunk:error', error);
        if (typeof ack === 'function') ack(error);
        return;
      }

      // Process chunks in parallel batches for performance
      const workerPool = getWorkerPool();
      const BATCH_SIZE = 6; // Process 6 at a time
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(async (coord) => {
            const chunk = await workerPool.run({
              seed: world.seed,
              chunkX: coord.chunkX,
              chunkY: coord.chunkY,
              chunkZ: coord.chunkZ,
              params: world.parameters,
            });

            if (!chunk || !chunk.tiles) {
              logger.error('[WorldChunks] Worker returned invalid chunk', {
                worldId,
                coord,
                chunkType: typeof chunk,
                chunkKeys: chunk ? Object.keys(chunk) : 'null',
                hasTiles: chunk ? 'tiles' in chunk : false,
              });
              throw new Error(`Invalid chunk structure for (${coord.chunkX},${coord.chunkY},${coord.chunkZ})`);
            }

            // Compress response - for 2D rendering, send ONE tile per (x,y) position
            const tileMap = new Map<string, (typeof chunk.tiles)[0]>();

            for (const tile of chunk.tiles) {
              const key = `${tile.x},${tile.y}`;
              const existing = tileMap.get(key);

              // Keep the tile with highest z that isn't air
              if (tile.blockType !== 'air') {
                if (!existing || tile.z > existing.z) {
                  tileMap.set(key, tile);
                }
              }
            }

            const surfaceTiles = Array.from(tileMap.values()).map((tile: any) => ({
              x: tile.x,
              y: tile.y,
              z: tile.z,
              biome: tile.biome,
              elevation: tile.elevation,
            }));

            return {
              worldId,
              chunkX: chunk.chunkX,
              chunkY: chunk.chunkY,
              chunkZ: chunk.chunkZ,
              tiles: surfaceTiles,
              biomes: chunk.biomes ? Array.from(chunk.biomes) : [],
            };
          })
        );

        // Emit successful chunks
        for (const result of results) {
          if (result.status === 'fulfilled') {
            socket.emit('world:chunk:data', result.value);
            successCount++;
          } else {
            failCount++;
            logger.error('[WorldChunks] Batch chunk failed:', result.reason);
          }
        }
      }

      const elapsed = Date.now() - startTime;
      logger.info(`[WorldChunks] Batch complete: ${successCount}/${chunks.length} chunks in ${elapsed}ms`);

      socket.emit('world:chunks:complete', { worldId, count: successCount, failed: failCount });
      if (typeof ack === 'function') ack(null); // Success acknowledgement
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Batch generation failed';
      logger.error('[WorldChunks] Batch generation error:', error);
      socket.emit('world:chunk:error', { error: errorMsg });
      if (typeof ack === 'function') ack({ error: errorMsg });
    }
  });
}
