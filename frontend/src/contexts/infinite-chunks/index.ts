/**
 * Infinite Chunks - Public API
 * Barrel export for clean imports
 */

// Provider
export { InfiniteChunksProvider, InfiniteChunksContext } from './InfiniteChunksProvider';

// Hooks
export { useInfiniteChunksActions } from './actions';
export { useInfiniteChunksView, useExpandedGrid, useIsLoading, useGridWorldOffset, useLoadRadius } from './selectors';

// Types
export type {
  TerrainChunk,
  ChunkGenerator,
  InfiniteChunksConfig,
  InfiniteChunksOptions,
  InfiniteChunksState,
  InfiniteChunksAction,
  InfiniteChunksView,
  InfiniteChunksActions,
} from './types';

// Services (for advanced usage)
export { loadChunk, getChunksToLoad } from './services/chunkLoader';
