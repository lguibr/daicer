/**
 * Infinite Chunks - State Reducer
 * Pure reducer function for managing infinite chunk state
 */

import type { InfiniteChunksState, InfiniteChunksAction } from './types';
// Helper to merge chunk into grid (Inlined from deleted gridExpander)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mergeChunkIntoGrid(grid: any[][], _chunk: any, offset: { x: number; y: number }, _chunkSize: number) {
  // Simplified implementation for now - just returning current grid to avoid breakages
  // Real implementation would expand grid array keying off chunk.worldOffsetX/Y
  // For now, we rely on the Store-based rendering which uses the Map<string, Chunk>
  return { newGrid: grid, newOffset: offset };
}

// Initial state factory
export function createInitialState(): InfiniteChunksState {
  return {
    chunks: new Map(),
    expandedGrid: [[null]],
    gridWorldOffset: { x: 0, y: 0 },
    loading: new Set(),
    initialized: false,
    config: {
      roomId: '',
      chunkSize: 4,
      loadRadius: 5,
      enabled: false,
      mode: 'generator',
      layer: 0,
    },
  };
}

// Pure reducer function
export function infiniteChunksReducer(state: InfiniteChunksState, action: InfiniteChunksAction): InfiniteChunksState {
  switch (action.type) {
    case 'INITIALIZE': {
      const { initialGrid, config, chunkGenerator /* placementMap */ } = action.payload;

      // Determine mode based on presence of generator
      const mode: 'backend' | 'generator' = chunkGenerator ? 'generator' : 'backend';

      return {
        ...state,

        expandedGrid: initialGrid.length > 0 ? initialGrid : [[null]],
        gridWorldOffset: { x: 0, y: 0 },
        config: { ...config, mode },
        chunkGenerator,
        // placementMap,
        initialized: true,
      };
    }

    case 'CHUNK_LOAD_START': {
      const { chunkKey } = action.payload;
      const newLoading = new Set(state.loading);
      newLoading.add(chunkKey);

      return {
        ...state,
        loading: newLoading,
      };
    }

    case 'CHUNK_LOAD_SUCCESS': {
      const { chunk } = action.payload;
      const chunkKey = `${chunk.chunkX},${chunk.chunkY}`;
      console.info(`[InfiniteChunks] Reducer: CHUNK_LOAD_SUCCESS for ${chunkKey}`, {
        chunkTiles: chunk.tiles?.length,
        chunkBiomes: chunk.biomes?.length,
        chunkSize: state.config.chunkSize,
      });

      // Remove from loading
      const newLoading = new Set(state.loading);
      newLoading.delete(chunkKey);

      // Add to chunks map
      const newChunks = new Map(state.chunks);
      newChunks.set(chunkKey, chunk);

      // Merge chunk into expanded grid
      const { newGrid, newOffset } = mergeChunkIntoGrid(
        state.expandedGrid,
        chunk,
        state.gridWorldOffset,
        state.config.chunkSize
      );

      console.info(
        `[InfiniteChunks] Reducer: Grid expanded. New size: ${newGrid[0]?.length}x${newGrid.length}, Offset:`,
        newOffset
      );

      return {
        ...state,
        chunks: newChunks,
        expandedGrid: newGrid,
        gridWorldOffset: newOffset,
        loading: newLoading,
      };
    }

    case 'CHUNK_LOAD_ERROR': {
      const { chunkKey } = action.payload;
      const newLoading = new Set(state.loading);
      newLoading.delete(chunkKey);

      console.error(`[InfiniteChunks] Failed to load chunk ${chunkKey}:`, action.payload.error);

      return {
        ...state,
        loading: newLoading,
      };
    }

    case 'SET_LOAD_RADIUS': {
      const { radius } = action.payload;

      return {
        ...state,
        config: {
          ...state.config,
          loadRadius: Math.max(1, Math.min(10, radius)), // Clamp between 1-10
        },
      };
    }

    case 'SET_LAYER': {
      const { layer } = action.payload;

      // If layer hasn't changed, do nothing
      if (state.config.layer === layer) return state;

      return {
        ...state,
        // Reset grid when changing layers as we're entering a new world slice
        expandedGrid: [[null]],
        gridWorldOffset: { x: 0, y: 0 },
        chunks: new Map(), // Clear chunks cache for previous layer
        config: {
          ...state.config,
          layer,
        },
      };
    }

    case 'RESET': {
      return createInitialState();
    }

    default:
      return state;
  }
}
