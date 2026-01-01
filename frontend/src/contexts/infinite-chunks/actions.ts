/**
 * Infinite Chunks Actions
 * Memoized action creators for modifying chunk state
 */

import { useContext, useCallback, useRef } from 'react';
import { InfiniteChunksContext } from './InfiniteChunksProvider';
import type { InfiniteChunksActions } from './types';
import { loadChunk, getChunksToLoad, getMaxConcurrentLoads } from './services/chunkLoader';

export function useInfiniteChunksActions(): InfiniteChunksActions {
  const context = useContext(InfiniteChunksContext);

  if (!context) {
    throw new Error('useInfiniteChunksActions must be used within InfiniteChunksProvider');
  }

  const { state, dispatch } = context;

  // Track loading requests to prevent duplicates
  const loadingRequestsRef = useRef(new Set<string>());

  // Memoized checkChunkLoading function
  const checkChunkLoading = useCallback(
    async (playerX: number, playerY: number) => {
      if (!state.config.enabled || !state.initialized) return;

      const chunksToLoad = getChunksToLoad(
        playerX,
        playerY,
        state.config.chunkSize,
        state.config.loadRadius,
        new Set(state.chunks.keys()),
        state.loading
      );

      console.info(
        `[InfiniteChunks Action] checkChunkLoading(${playerX}, ${playerY}) found ${chunksToLoad.length} chunks to load. Config:`,
        {
          enabled: state.config.enabled,
          initialized: state.initialized,
          mode: state.config.mode,
          chunkSize: state.config.chunkSize,
          loadRadius: state.config.loadRadius,
        }
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
    [
      state.config,
      state.config.chunkSize,
      state.config.loadRadius,
      state.initialized,
      state.chunks,
      state.loading,
      state.chunkGenerator,
      // state.placementMap,
      dispatch,
    ]
  );

  // Memoized setLoadRadius function
  const setLoadRadius = useCallback(
    (radius: number) => {
      dispatch({
        type: 'SET_LOAD_RADIUS',
        payload: { radius },
      });
    },
    [dispatch]
  );

  // Memoized setLayer function
  const setLayer = useCallback(
    (layer: number) => {
      dispatch({
        type: 'SET_LAYER',
        payload: { layer },
      });
    },
    [dispatch]
  );

  // Memoized reset function
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  // Return memoized actions object
  return {
    checkChunkLoading,
    setLoadRadius,
    setLayer,
    reset,
  };
}
