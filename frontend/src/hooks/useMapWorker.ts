/**
 * Hook for managing world map renderer worker
 * Offloads canvas rendering to prevent UI freezing
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { createMapWorker } from '../workers/WorkerManager';
import type { WorkerManager } from '../workers/WorkerManager';

interface ChunkData {
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

interface UseMapWorkerOptions {
  width: number;
  height: number;
  onRenderComplete?: () => void;
}

export function useMapWorker(options: UseMapWorkerOptions) {
  const { width, height, onRenderComplete } = options;
  const workerRef = useRef<WorkerManager | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewportRef = useRef({ x: 0, y: 0, zoom: 1.0 });
  const isWorkerActiveRef = useRef(false);

  const [isWorkerActive, setIsWorkerActive] = useState(false);

  /**
   * Initialize worker with canvas
   */
  const initializeWorker = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (!canvas) return false;

      canvasRef.current = canvas;

      // Create worker
      const worker = createMapWorker();

      // Try to initialize with OffscreenCanvas
      const success = worker.initialize({
        canvas,
        onMessage: (data) => {
          if (data.type === 'render-complete' && onRenderComplete) {
            onRenderComplete();
          }
        },
        onError: (error) => {
          console.error('[useMapWorker] Worker error:', error);
        },
      });

      if (success) {
        workerRef.current = worker;
        isWorkerActiveRef.current = true;
        setIsWorkerActive(true);

        // Send initial size
        worker.postMessage({
          type: 'resize',
          width,
          height,
          offset: viewportRef.current,
          zoom: viewportRef.current.zoom,
        });

        console.info('[useMapWorker] Worker initialized successfully');
        return true;
      }

      console.warn('[useMapWorker] Worker initialization failed, using main thread');
      return false;
    },

    [width, height, onRenderComplete]
  );

  /**
   * Add a chunk to the worker for rendering
   */
  const addChunk = useCallback((chunk: ChunkData, offset: { x: number; y: number }, zoom: number) => {
    if (!workerRef.current || !isWorkerActiveRef.current) {
      return false;
    }

    workerRef.current.postMessage({
      type: 'add-chunk',
      chunk,
      offset,
      zoom,
    });

    return true;
  }, []);

  /**
   * Update viewport (pan/zoom) and trigger re-render
   */
  const updateViewport = useCallback((offset: { x: number; y: number }, zoom: number) => {
    viewportRef.current = { ...offset, zoom };

    if (!workerRef.current || !isWorkerActiveRef.current) {
      return false;
    }

    workerRef.current.postMessage({
      type: 'viewport-change',
      offset,
      zoom,
    });

    return true;
  }, []);

  /**
   * Clear all chunks from cache
   */
  const clearChunks = useCallback(() => {
    if (!workerRef.current || !isWorkerActiveRef.current) {
      return false;
    }

    workerRef.current.postMessage({
      type: 'clear',
    });

    return true;
  }, []);

  /**
   * Resize canvas
   */
  const resize = useCallback((w: number, h: number) => {
    if (!workerRef.current || !isWorkerActiveRef.current) {
      return false;
    }

    workerRef.current.postMessage({
      type: 'resize',
      width: w,
      height: h,
      offset: viewportRef.current,
      zoom: viewportRef.current.zoom,
    });

    return true;
  }, []);

  /**
   * Cleanup worker on unmount
   */
  useEffect(
    () => () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
        isWorkerActiveRef.current = false;
        setIsWorkerActive(false);
        console.info('[useMapWorker] Worker terminated');
      }
    },
    []
  );

  return {
    initializeWorker,
    addChunk,
    updateViewport,
    clearChunks,
    resize,
    isWorkerActive,
  };
}
