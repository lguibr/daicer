/**
 * Infinite Chunks Selectors
 * Memoized view selectors for reading chunk state
 * Prevents unnecessary re-renders by only updating when data changes
 */

import { useContext, useMemo } from 'react';
import type { Tile } from '@daicer/engine';
import { InfiniteChunksContext } from './InfiniteChunksProvider';
import type { InfiniteChunksView } from './types';

export function useInfiniteChunksView(): InfiniteChunksView {
  const context = useContext(InfiniteChunksContext);

  if (!context) {
    throw new Error('useInfiniteChunksView must be used within InfiniteChunksProvider');
  }

  const { state } = context;

  // Memoize view data to prevent unnecessary re-renders
  return useMemo<InfiniteChunksView>(
    () => ({
      expandedGrid: state.expandedGrid,
      isLoading: state.loading.size > 0,
      gridWorldOffset: state.gridWorldOffset,
      loadRadius: state.config.loadRadius,
      chunks: state.chunks,
    }),
    [state.expandedGrid, state.loading, state.gridWorldOffset, state.config.loadRadius, state.chunks]
  );
}

/**
 * Hook to access just the expanded grid (most common use case)
 * Optimized to only re-render when grid changes
 */
export function useExpandedGrid(): (Tile | null)[][] {
  const context = useContext(InfiniteChunksContext);

  if (!context) {
    throw new Error('useExpandedGrid must be used within InfiniteChunksProvider');
  }

  return context.state.expandedGrid;
}

/**
 * Hook to access loading state only
 * Useful for showing loading indicators
 */
export function useIsLoading(): boolean {
  const context = useContext(InfiniteChunksContext);

  if (!context) {
    throw new Error('useIsLoading must be used within InfiniteChunksProvider');
  }

  return useMemo(() => context.state.loading.size > 0, [context.state.loading]);
}

/**
 * Hook to access grid world offset
 * Used for coordinate transformations
 */
export function useGridWorldOffset(): { x: number; y: number } {
  const context = useContext(InfiniteChunksContext);

  if (!context) {
    throw new Error('useGridWorldOffset must be used within InfiniteChunksProvider');
  }

  return context.state.gridWorldOffset;
}

/**
 * Hook to access load radius
 * Useful for UI controls
 */
export function useLoadRadius(): number {
  const context = useContext(InfiniteChunksContext);

  if (!context) {
    throw new Error('useLoadRadius must be used within InfiniteChunksProvider');
  }

  return context.state.config.loadRadius;
}
