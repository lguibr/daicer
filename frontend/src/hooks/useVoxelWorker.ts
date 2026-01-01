/**
 * Hook for managing voxel model renderer worker
 * Offloads 3D voxel rendering to prevent UI blocking
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { createVoxelWorker } from '../workers/WorkerManager';
import type { WorkerManager } from '../workers/WorkerManager';

interface Voxel {
  x: number;
  y: number;
  z: number;
  color: string;
}

interface UseVoxelWorkerOptions {
  autoAnimate?: boolean;
}

export function useVoxelWorker(options: UseVoxelWorkerOptions = {}) {
  const workerRef = useRef<WorkerManager | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
      const worker = createVoxelWorker();

      // Try to initialize with OffscreenCanvas
      const success = worker.initialize({
        canvas,
        onError: (error) => {
          console.error('[useVoxelWorker] Worker error:', error);
        },
      });

      if (success) {
        workerRef.current = worker;
        isWorkerActiveRef.current = true;
        setIsWorkerActive(true);

        // Start animation if auto-animate is enabled
        if (options.autoAnimate) {
          worker.postMessage({ type: 'start-animation' });
        }

        console.info('[useVoxelWorker] Worker initialized successfully');
        return true;
      }

      console.warn('[useVoxelWorker] Worker initialization failed, using main thread');
      return false;
    },
    [options.autoAnimate]
  );

  /**
   * Load a voxel model
   */
  const loadModel = useCallback((voxels: Voxel[]) => {
    if (!workerRef.current || !isWorkerActiveRef.current) {
      return false;
    }

    workerRef.current.postMessage({
      type: 'load-model',
      voxels,
    });

    return true;
  }, []);

  /**
   * Update camera position (OrbitControls proxy)
   */
  const updateCamera = useCallback((delta: { theta?: number; phi?: number; distance?: number }) => {
    if (!workerRef.current || !isWorkerActiveRef.current) {
      return false;
    }

    workerRef.current.postMessage({
      type: 'update-camera',
      ...delta,
    });

    return true;
  }, []);

  /**
   * Start idle animation
   */
  const startAnimation = useCallback(() => {
    if (!workerRef.current || !isWorkerActiveRef.current) {
      return false;
    }

    workerRef.current.postMessage({ type: 'start-animation' });
    return true;
  }, []);

  /**
   * Stop animation
   */
  const stopAnimation = useCallback(() => {
    if (!workerRef.current || !isWorkerActiveRef.current) {
      return false;
    }

    workerRef.current.postMessage({ type: 'stop-animation' });
    return true;
  }, []);

  /**
   * Resize canvas
   */
  const resize = useCallback((width: number, height: number) => {
    if (!workerRef.current || !isWorkerActiveRef.current) {
      return false;
    }

    workerRef.current.postMessage({
      type: 'resize',
      width,
      height,
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
        console.info('[useVoxelWorker] Worker terminated');
      }
    },
    []
  );

  return {
    initializeWorker,
    loadModel,
    updateCamera,
    startAnimation,
    stopAnimation,
    resize,
    isWorkerActive,
  };
}
