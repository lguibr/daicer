/**
 * Infinite Chunks Provider
 * Main context provider using reducer pattern for state management
 */

import React, { createContext, useReducer, useEffect, useCallback, useRef } from 'react';
import type { InfiniteChunksContextValue, InfiniteChunksOptions } from './types';
import { infiniteChunksReducer, createInitialState } from './reducer';
import { loadChunk, getChunksToLoad, getMaxConcurrentLoads } from './services/chunkLoader';

export const InfiniteChunksContext = createContext<InfiniteChunksContextValue | null>(null);

interface InfiniteChunksProviderProps {
  children: React.ReactNode;
  options: InfiniteChunksOptions;
}

export function InfiniteChunksProvider({ children, options }: InfiniteChunksProviderProps) {
  const {
    roomId,
    initialGrid,
    chunkSize = 4,
    loadRadius = 5,
    enabled = true,
    chunkGenerator,
    placementMap,
    layer = 0,
    token,
  } = options;

  const [state, dispatch] = useReducer(infiniteChunksReducer, createInitialState());

  // Track chunks being loaded to prevent duplicate requests
  const loadingRequestsRef = useRef(new Set<string>());

  // Initialize on mount or when roomId changes
  useEffect(() => {
    if (!roomId) return;

    // Debug: Log which dependency changed
    console.log('[InfiniteChunks] Initializing/Updating provider. Changed deps:', {
      roomId,
      initialGridLen: initialGrid.length,
      chunkSize,
      loadRadius,
      enabled,
      chunkGeneratorChanged: !!chunkGenerator,
      placementMapChanged: !!placementMap,
      layer,
    });

    dispatch({
      type: 'INITIALIZE',
      payload: {
        initialGrid,
        config: {
          roomId,
          chunkSize,
          loadRadius,
          enabled,
          mode: chunkGenerator ? 'generator' : 'backend',
          layer,
          token,
        },
        chunkGenerator,
        placementMap,
      },
    });

    console.log(
      `[InfiniteChunks] Initialized for room ${roomId} (mode: ${chunkGenerator ? 'generator' : 'backend'}, layer: ${layer})`
    );
  }, [roomId, initialGrid, chunkSize, loadRadius, enabled, chunkGenerator, placementMap, layer]);

  // Internal chunk loading logic
  const checkChunkLoadingInternal = useCallback(
    async (playerX: number, playerY: number) => {
      if (!enabled || !state.initialized) {
        console.log('[InfiniteChunks] Skipping checkChunkLoading: not enabled or initialized', {
          enabled,
          initialized: state.initialized,
        });
        return;
      }

      const chunksToLoad = getChunksToLoad(
        playerX,
        playerY,
        state.config.chunkSize,
        state.config.loadRadius,
        new Set(state.chunks.keys()),
        state.loading
      );

      console.log(
        `[InfiniteChunks] checkChunkLoading(${playerX}, ${playerY}) found ${chunksToLoad.length} chunks to load`
      );

      if (chunksToLoad.length === 0) return;

      // Load up to max concurrent chunks
      const maxConcurrent = getMaxConcurrentLoads();
      const chunksToLoadNow = chunksToLoad.slice(0, maxConcurrent);

      for (const { chunkX, chunkY } of chunksToLoadNow) {
        const chunkKey = `${chunkX},${chunkY}`;

        // Skip if already being requested
        if (loadingRequestsRef.current.has(chunkKey)) continue;

        loadingRequestsRef.current.add(chunkKey);

        dispatch({
          type: 'CHUNK_LOAD_START',
          payload: { chunkKey },
        });

        // Load chunk asynchronously
        loadChunk(chunkX, chunkY, state.config)
          .then((chunk) => {
            loadingRequestsRef.current.delete(chunkKey);
            dispatch({
              type: 'CHUNK_LOAD_SUCCESS',
              payload: { chunk },
            });
          })
          .catch((error) => {
            loadingRequestsRef.current.delete(chunkKey);
            dispatch({
              type: 'CHUNK_LOAD_ERROR',
              payload: { chunkKey, error },
            });
          });
      }
    },
    [enabled, state.initialized, state.config, state.chunks, state.loading, state.chunkGenerator, state.placementMap]
  );

  // Force initial chunk loading for empty grids
  useEffect(() => {
    if (state.initialized && initialGrid.length === 0) {
      console.log('[InfiniteChunks] Initialized with empty grid. Triggering initial load in 100ms...');
      setTimeout(() => {
        console.log('[InfiniteChunks] Executing initial load timeout...');
        checkChunkLoadingInternal(0, 0);
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.initialized]);

  // Expose checkChunkLoading to children via ref to avoid re-renders
  const checkChunkLoadingRef = useRef(checkChunkLoadingInternal);
  checkChunkLoadingRef.current = checkChunkLoadingInternal;

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = React.useMemo<InfiniteChunksContextValue>(
    () => ({
      state,
      dispatch,
    }),
    [state]
  );

  return <InfiniteChunksContext.Provider value={contextValue}>{children}</InfiniteChunksContext.Provider>;
}

// Hook to check chunk loading (used by actions)
export function useCheckChunkLoading() {
  const context = React.useContext(InfiniteChunksContext);
  if (!context) {
    throw new Error('useCheckChunkLoading must be used within InfiniteChunksProvider');
  }

  const checkChunkLoadingRef = useRef<((playerX: number, playerY: number) => void) | null>(null);

  // This is a workaround to expose checkChunkLoading - will be refined in actions.ts
  return useCallback((playerX: number, playerY: number) => {
    if (checkChunkLoadingRef.current) {
      checkChunkLoadingRef.current(playerX, playerY);
    }
  }, []);
}
