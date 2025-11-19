/**
 * useWorldChunks Hook
 * WebSocket-based chunk loading for procedural worlds
 */

import { useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../services/socket';

export interface ChunkCoord {
  chunkX: number;
  chunkY: number;
  chunkZ: number;
}

export interface ChunkData {
  worldId: string;
  chunkX: number;
  chunkY: number;
  chunkZ: number;
  tiles: Array<{
    x: number;
    y: number;
    z: number;
    biome: string;
    elevation: number;
  }>;
  biomes: string[];
}

interface UseWorldChunksOptions {
  worldId: string | null;
  onChunkLoaded?: (chunk: ChunkData) => void;
  onChunkStart?: () => void;
  onError?: (error: string) => void;
  onBatchComplete?: (count: number) => void;
}

// Server enforces max 50 chunks per batch to prevent overload
const MAX_BATCH_SIZE = 50;

export function useWorldChunks({
  worldId,
  onChunkLoaded,
  onChunkStart,
  onError,
  onBatchComplete,
}: UseWorldChunksOptions) {
  const requestCache = useRef<Set<string>>(new Set());

  // Listen for chunk data
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !worldId) return;

    const handleChunkData = (data: ChunkData) => {
      if (data.worldId === worldId) {
        const key = `${data.chunkX},${data.chunkY},${data.chunkZ}`;
        requestCache.current.delete(key);
        onChunkLoaded?.(data);
      }
    };

    const handleChunkError = (error: { error: string }) => {
      onError?.(error.error);
    };

    const handleBatchComplete = (data: { worldId: string; count: number }) => {
      if (data.worldId === worldId) {
        requestCache.current.clear();
        onBatchComplete?.(data.count);
      }
    };

    socket.on('world:chunk:data', handleChunkData);
    socket.on('world:chunk:error', handleChunkError);
    socket.on('world:chunks:complete', handleBatchComplete);

    return () => {
      socket.off('world:chunk:data', handleChunkData);
      socket.off('world:chunk:error', handleChunkError);
      socket.off('world:chunks:complete', handleBatchComplete);
    };
  }, [worldId, onChunkLoaded, onError, onBatchComplete]);

  // Request single chunk with retry
  const requestChunk = useCallback(
    (chunkX: number, chunkY: number, chunkZ: number) => {
      const socket = getSocket();
      if (!socket || !worldId) return;

      const key = `${chunkX},${chunkY},${chunkZ}`;
      if (requestCache.current.has(key)) {
        return; // Already requested
      }

      requestCache.current.add(key);

      // Use timeout for acknowledgement
      socket.timeout(15000).emit(
        'world:chunk:request',
        {
          worldId,
          chunkX,
          chunkY,
          chunkZ,
        },
        (err: Error) => {
          if (err) {
            console.error('[WorldChunks] Chunk request timeout:', key);
            requestCache.current.delete(key);
            onError?.('Chunk request timeout');
          }
        }
      );
    },
    [worldId, onError]
  );

  // Request batch of chunks with timeout and automatic batching
  const requestChunks = useCallback(
    (chunks: ChunkCoord[]) => {
      const socket = getSocket();
      if (!socket || !worldId || chunks.length === 0) return;

      // Notify start of loading
      onChunkStart?.();

      // Filter out already requested chunks
      const newChunks = chunks.filter((coord) => {
        const key = `${coord.chunkX},${coord.chunkY},${coord.chunkZ}`;
        return !requestCache.current.has(key);
      });

      if (newChunks.length === 0) return;

      // Mark as requested
      newChunks.forEach((coord) => {
        const key = `${coord.chunkX},${coord.chunkY},${coord.chunkZ}`;
        requestCache.current.add(key);
      });

      // Split into batches of MAX_BATCH_SIZE to respect server limits
      const batches: ChunkCoord[][] = [];
      for (let i = 0; i < newChunks.length; i += MAX_BATCH_SIZE) {
        batches.push(newChunks.slice(i, i + MAX_BATCH_SIZE));
      }

      console.log(`[WorldChunks] Requesting ${newChunks.length} chunks in ${batches.length} batch(es)`);

      // Send batches sequentially with slight delay to avoid overwhelming server
      batches.forEach((batch, batchIndex) => {
        setTimeout(() => {
          socket.timeout(30000).emit(
            'world:chunks:request',
            {
              worldId,
              chunks: batch,
            },
            (err: Error) => {
              if (err) {
                console.error(`[WorldChunks] Batch ${batchIndex + 1}/${batches.length} request timeout`);
                // Clear failed requests so they can be retried
                batch.forEach((coord) => {
                  const key = `${coord.chunkX},${coord.chunkY},${coord.chunkZ}`;
                  requestCache.current.delete(key);
                });
                onError?.(`Batch chunk request timeout (batch ${batchIndex + 1}/${batches.length})`);
              }
            }
          );
        }, batchIndex * 100); // 100ms delay between batches
      });
    },
    [worldId, onChunkStart, onError]
  );

  // Clear cache (useful on world change)
  const clearCache = useCallback(() => {
    requestCache.current.clear();
  }, []);

  const socket = getSocket();

  return {
    requestChunk,
    requestChunks,
    clearCache,
    isConnected: socket?.connected ?? false,
  };
}
