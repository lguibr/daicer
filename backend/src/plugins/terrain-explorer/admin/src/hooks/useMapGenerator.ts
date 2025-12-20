import { useState, useCallback, useMemo } from 'react';
// @ts-expect-error - Strapi typings are sometimes tricky to find
import { useFetchClient } from '@strapi/strapi/admin';

export interface ChunkDTO {
  chunkX: number;
  chunkY: number;
  worldOffsetX: number;
  worldOffsetY: number;
  size: number;
  grid: { b: string; t: string }[][][]; // [floor][y][x]
}

export interface GridTile {
  x: number;
  y: number;
  z: number;
  biome: string;
  blockType: string;
}

export function useMapGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [chunks, setChunks] = useState<Record<string, ChunkDTO>>({});
  const [floor, setFloor] = useState(3); // Default to surface (index 3)
  const [structures, setStructures] = useState<any[]>([]); // Structures come stamped in grid mostly

  const { post } = useFetchClient();
  const CHUNK_SIZE = 16; // Standard unified size

  const generateChunk = useCallback(
    async (
      roomSeedOrId: string, // We use roomId mostly now because backend needs to look up room settings
      chunkX: number,
      chunkY: number,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _params?: any
    ) => {
      const chunkKey = `${chunkX},${chunkY}`;
      if (chunks[chunkKey]) return;

      setIsGenerating(true);
      try {
        // Call the Admin Route we created
        // NOTE: The backend route '/terrain-explorer/generate-chunk' likely still exists or needs to be checked
        // But the main REST API is /api/terrain/generate (which returns full map)
        // or /api/terrain/chunk (for single chunk)
        // Strapi Admin plugins usually use filtered endpoints.
        // Let's assume we need to hit the backend service directly or calling the plugin controller.

        // Let's call the public API for consistency or plugin specific?
        // Admin usually calls plugin routes.
        // Check server/routes/index.ts usually.

        const { data } = await post('/terrain-explorer/generate-chunk', {
          roomId: roomSeedOrId,
          chunkX,
          chunkY,
          chunkSize: CHUNK_SIZE,
        });

        // data.data should be ChunkDTO
        if (data && data.data) {
          const result = data.data as ChunkDTO;
          setChunks((prev) => ({
            ...prev,
            [chunkKey]: result,
          }));
        }
      } catch (error) {
        console.error('[AdminWorldGen] API Chunk Generation failed:', error);
      } finally {
        setIsGenerating(false);
      }
    },
    [chunks, post, CHUNK_SIZE]
  );

  // Convert chunks to a single flat grid for the current floor
  // This is a naive implementation for the modal viewer
  const grid = useMemo(() => {
    // Find the chunk at 0,0 or similar?
    // Or merge all chunks?
    const chunkKeys = Object.keys(chunks);
    if (chunkKeys.length === 0) return [];

    // Grab first chunk for MVP preview
    // Better: reconstruct map
    const firstChunk = chunks[chunkKeys[0]];
    if (!firstChunk || !firstChunk.grid[floor]) return [];

    // Convert to GridTile[][]
    return firstChunk.grid[floor].map((row, ly) =>
      row.map((tileRaw, lx) => ({
        x: lx + firstChunk.worldOffsetX,
        y: ly + firstChunk.worldOffsetY,
        z: floor - 3,
        biome: tileRaw.b,
        blockType: tileRaw.t,
      }))
    );
  }, [chunks, floor]);

  return {
    isGenerating,
    generateChunk,
    chunks, // Raw ChunkDTO map
    grid, // Current floor grid for visualization
    structures,
    floor,
    setFloor,
    CHUNK_SIZE,
  };
}
