import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { GridTile } from '@daicer/shared';

interface ChunkGenerator {
  generateChunk: (worldX: number, worldY: number, width: number, height: number) => GridTile[][];
}

interface SimpleTerrainManagerOptions {
  initialGrid: GridTile[][];
  chunkSize?: number;
  loadRadius?: number;
  chunkGenerator?: ChunkGenerator;
}

export function useSimpleTerrainManager({
  initialGrid,
  chunkSize = 16,
  loadRadius = 8,
  chunkGenerator,
}: SimpleTerrainManagerOptions) {
  // Store chunks as a map of "x,y" -> GridTile[][]
  const [chunks, setChunks] = useState<Map<string, GridTile[][]>>(new Map());

  // Track the top-left corner of the expanded grid in world coordinates
  const [, setGridWorldOffset] = useState({ x: 0, y: 0 });

  // Track loaded chunk keys to avoid re-generation
  const loadedChunksRef = useRef<Set<string>>(new Set());

  // Reset state when generator or initial grid changes (e.g. seed change)
  useEffect(() => {
    console.log('[SimpleTerrainManager] Resetting state due to generator/grid change');
    setChunks(new Map());
    loadedChunksRef.current = new Set();
    setGridWorldOffset({ x: 0, y: 0 });
  }, [chunkGenerator, initialGrid]);

  // Calculate the expanded grid by merging all chunks
  const expandedGrid = useMemo<{ grid: (GridTile | null)[][]; offset: { x: number; y: number } }>(() => {
    console.log(`[SimpleTerrainManager] Recalculating expanded grid, chunks.size: ${chunks.size}`);

    if (chunks.size === 0) {
      console.log('[SimpleTerrainManager] No chunks, using initial grid');
      // Convert initialGrid (GridTile[][]) to (GridTile | null)[][]
      return { grid: initialGrid as (GridTile | null)[][], offset: { x: 0, y: 0 } };
    }

    // Find bounds across ALL chunks (including initial grid at 0,0)
    let minX = 0;
    let maxX = initialGrid[0]?.length || 0;
    let minY = 0;
    let maxY = initialGrid.length || 0;

    // Expand bounds to include all chunks
    for (const key of chunks.keys()) {
      const parts = key.split(',');
      const cx = parseInt(parts[0] || '0', 10);
      const cy = parseInt(parts[1] || '0', 10);

      const chunkMinX = cx * chunkSize;
      const chunkMaxX = (cx + 1) * chunkSize;
      const chunkMinY = cy * chunkSize;
      const chunkMaxY = (cy + 1) * chunkSize;

      minX = Math.min(minX, chunkMinX);
      maxX = Math.max(maxX, chunkMaxX);
      minY = Math.min(minY, chunkMinY);
      maxY = Math.max(maxY, chunkMaxY);
    }

    console.log(`[SimpleTerrainManager] Grid bounds: X[${minX}, ${maxX}], Y[${minY}, ${maxY}]`);

    // Create empty grid
    const width = maxX - minX;
    const height = maxY - minY;
    const grid: (GridTile | null)[][] = Array(height)
      .fill(null)
      .map(() => Array(width).fill(null));

    console.log(`[SimpleTerrainManager] Created grid: ${width}x${height}`);

    // Helper to set tile at world coordinates
    const setTile = (worldX: number, worldY: number, val: GridTile) => {
      const localX = worldX - minX;
      const localY = worldY - minY;
      if (localX >= 0 && localX < width && localY >= 0 && localY < height && grid[localY]) {
        grid[localY][localX] = val;
      }
    };

    // 1. Place initial grid (ALWAYS at world position 0,0)
    for (let y = 0; y < initialGrid.length; y++) {
      const row = initialGrid[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x++) {
        const tile = row[x];
        if (tile) {
          // Initial grid is at world coords (0,0), not affected by offset
          setTile(x, y, tile);
        }
      }
    }

    // 2. Place all chunks
    let chunksPlaced = 0;
    for (const [key, chunkData] of chunks.entries()) {
      const parts = key.split(',');
      const cx = parseInt(parts[0] || '0', 10);
      const cy = parseInt(parts[1] || '0', 10);
      const startX = cx * chunkSize;
      const startY = cy * chunkSize;

      for (let y = 0; y < chunkSize && y < chunkData.length; y++) {
        const row = chunkData[y];
        if (!row) continue;
        for (let x = 0; x < chunkSize && x < row.length; x++) {
          const tile = row[x];
          if (tile) {
            setTile(startX + x, startY + y, tile);
          }
        }
      }
      chunksPlaced++;
    }

    console.log(`[SimpleTerrainManager] Placed ${chunksPlaced} chunks into grid`);

    // Verify some tiles in the expanded area
    if (width > 128) {
      const sampleX = Math.min(150, width - 1);
      const sampleY = Math.min(64, height - 1);
      console.log(
        `[SimpleTerrainManager] Sample tile at (${sampleX}, ${sampleY}): "${grid[sampleY]?.[sampleX]?.biome || 'UNDEFINED'}"`
      );
    }

    return { grid, offset: { x: minX, y: minY } };
  }, [chunks, initialGrid, chunkSize]);

  // Update state offset if calculated offset is different
  // Note: This is a side effect in render, but safe-ish if we are careful.
  // Better to just return the offset from the memo.

  const checkChunkLoading = useCallback(
    (playerX: number, playerY: number) => {
      if (!chunkGenerator) {
        console.log('[SimpleTerrainManager] No chunk generator');
        return;
      }

      console.log(`[SimpleTerrainManager] checkChunkLoading called at player pos (${playerX}, ${playerY})`);

      const playerChunkX = Math.floor(playerX / chunkSize);
      const playerChunkY = Math.floor(playerY / chunkSize);
      const chunkRadius = Math.ceil(loadRadius / chunkSize) + 1; // +1 for buffer

      console.log(
        `[SimpleTerrainManager] Player chunk: (${playerChunkX}, ${playerChunkY}), radius: ${chunkRadius} chunks`
      );

      const newChunks = new Map<string, GridTile[][]>();
      let hasNew = false;

      // Check chunks around player
      for (let dy = -chunkRadius; dy <= chunkRadius; dy++) {
        for (let dx = -chunkRadius; dx <= chunkRadius; dx++) {
          const cx = playerChunkX + dx;
          const cy = playerChunkY + dy;
          const key = `${cx},${cy}`;

          // Skip if already loaded
          if (loadedChunksRef.current.has(key)) continue;

          // Calculate world position for this chunk
          const chunkStartX = cx * chunkSize;
          const chunkStartY = cy * chunkSize;
          const chunkEndX = chunkStartX + chunkSize;
          const chunkEndY = chunkStartY + chunkSize;

          // CRITICAL: Skip chunks that overlap with initial grid area (0-128, 0-128)
          // The initial grid contains structures and must not be overwritten
          const initialWidth = initialGrid[0]?.length || 0;
          const initialHeight = initialGrid.length || 0;

          const overlapsInitial = !(
            chunkEndX <= 0 || // Chunk entirely to the left
            chunkStartX >= initialWidth || // Chunk entirely to the right
            chunkEndY <= 0 || // Chunk entirely above
            chunkStartY >= initialHeight // Chunk entirely below
          );

          if (overlapsInitial) {
            console.log(
              `[SimpleTerrainManager] Skipping chunk (${cx}, ${cy}) at (${chunkStartX}, ${chunkStartY}) - overlaps initial grid area`
            );
            loadedChunksRef.current.add(key); // Mark as checked
            continue;
          }

          console.log(
            `[SimpleTerrainManager] Loading chunk (${cx}, ${cy}) at world pos (${chunkStartX}, ${chunkStartY})`
          );

          // Generate!
          const chunk = chunkGenerator.generateChunk(chunkStartX, chunkStartY, chunkSize, chunkSize);

          // Log first few tiles to verify content
          // Chunk generated successfully
          newChunks.set(key, chunk);
          loadedChunksRef.current.add(key);
          hasNew = true;
        }
      }

      if (hasNew) {
        console.log(`[SimpleTerrainManager] Loaded ${newChunks.size} new chunks`);
        setChunks((prev) => {
          const next = new Map(prev);
          for (const [key, val] of newChunks.entries()) {
            next.set(key, val);
          }
          console.log(`[SimpleTerrainManager] Total chunks now: ${next.size}`);
          return next;
        });
      } else {
        console.log('[SimpleTerrainManager] No new chunks needed');
      }
    },
    [chunkGenerator, chunkSize, loadRadius, initialGrid]
  );

  return {
    expandedGrid: expandedGrid.grid,
    gridWorldOffset: expandedGrid.offset,
    isLoading: false, // Client-side generation is synchronous/instant
    checkChunkLoading,
  };
}
