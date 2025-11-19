/**
 * Hook for managing dice renderer worker
 * Offloads dice rendering to prevent UI blocking
 */

import { useEffect, useRef, useCallback } from 'react';
import { createDiceWorker } from '../workers/WorkerManager';
import type { WorkerManager } from '../workers/WorkerManager';

interface UseDiceWorkerOptions {
  onRollComplete?: (results: number[]) => void;
  autoAnimate?: boolean;
}

export function useDiceWorker(options: UseDiceWorkerOptions = {}) {
  const workerRef = useRef<WorkerManager | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isWorkerActiveRef = useRef(false);

  /**
   * Initialize worker with canvas
   */
  const initializeWorker = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (!canvas) return false;

      canvasRef.current = canvas;

      // Create worker
      const worker = createDiceWorker();

      // Setup message handlers
      worker.on('roll-complete', (results: number[]) => {
        if (options.onRollComplete) {
          options.onRollComplete(results);
        }
      });

      // Try to initialize with OffscreenCanvas
      const success = worker.initialize({
        canvas,
        onError: (error) => {
          console.error('[useDiceWorker] Worker error:', error);
        },
      });

      if (success) {
        workerRef.current = worker;
        isWorkerActiveRef.current = true;

        // Start animation if auto-animate is enabled
        if (options.autoAnimate) {
          worker.postMessage({ type: 'start-animation' });
        }

        console.log('[useDiceWorker] Worker initialized successfully');
        return true;
      }

      console.warn('[useDiceWorker] Worker initialization failed, using main thread');
      return false;
    },
    [options.onRollComplete, options.autoAnimate]
  );

  /**
   * Add dice to the scene
   */
  const addDice = useCallback((count: number, type: 'd6' | 'd20' = 'd20') => {
    if (!workerRef.current || !isWorkerActiveRef.current) {
      return false;
    }

    workerRef.current.postMessage({
      type: 'add-dice',
      count,
      diceType: type,
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
   * Roll the dice with animation
   */
  const rollDice = useCallback((results: number[]) => {
    if (!workerRef.current || !isWorkerActiveRef.current) {
      return false;
    }

    workerRef.current.postMessage({
      type: 'roll',
      results,
    });

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
        console.log('[useDiceWorker] Worker terminated');
      }
    },
    []
  );

  return {
    initializeWorker,
    addDice,
    startAnimation,
    stopAnimation,
    rollDice,
    resize,
    isWorkerActive: isWorkerActiveRef.current,
  };
}
