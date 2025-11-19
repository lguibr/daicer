/**
 * @file frontend/src/hooks/useTactical3D.ts
 * @description Hook for managing 3D tactical rendering worker
 */

import { useEffect, useRef, useState } from 'react';
import type { GridCell, TacticalUnit } from '../types/tactical';

export interface Tactical3DController {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isReady: boolean;
  error: string | null;
  renderArena: (cells: GridCell[], units: TacticalUnit[]) => void;
  updateCamera: (position: { x: number; y: number; z: number }, target?: { x: number; y: number; z: number }) => void;
  highlightCells: (positions: Array<{ x: number; y: number; color?: string }>) => void;
  clearHighlights: () => void;
}

export function useTactical3D(enabled: boolean = true): Tactical3DController {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const offscreenCanvasRef = useRef<OffscreenCanvas | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize worker and offscreen canvas
  useEffect(() => {
    if (!enabled || !canvasRef.current) return undefined;

    const canvas = canvasRef.current;

    // Check for OffscreenCanvas support
    if (typeof OffscreenCanvas === 'undefined') {
      setError('OffscreenCanvas not supported in this browser');
      return undefined;
    }

    try {
      // Transfer canvas control to offscreen
      const offscreen = canvas.transferControlToOffscreen();
      offscreenCanvasRef.current = offscreen;

      // Create worker
      const worker = new Worker(new URL('../workers/tacticalRenderer.worker.ts', import.meta.url), { type: 'module' });

      // Set up message handler
      worker.onmessage = (e: MessageEvent) => {
        const { type, error: workerError } = e.data;

        if (type === 'ready') {
          setIsReady(true);
        } else if (type === 'error') {
          setError(workerError || 'Unknown worker error');
        }
      };

      worker.onerror = (e: ErrorEvent) => {
        setError(`Worker error: ${e.message}`);
      };

      // Initialize scene in worker
      const { width, height } = canvas.getBoundingClientRect();
      worker.postMessage(
        {
          type: 'init',
          data: {
            canvas: offscreen,
            width: Math.floor(width),
            height: Math.floor(height),
          },
        },
        [offscreen]
      );

      workerRef.current = worker;

      return () => {
        worker.postMessage({ type: 'dispose' });
        worker.terminate();
        workerRef.current = null;
        offscreenCanvasRef.current = null;
        setIsReady(false);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize 3D renderer');
      return undefined;
    }
  }, [enabled]);

  // Handle window resize
  useEffect(() => {
    if (!enabled || !canvasRef.current || !workerRef.current) return undefined;

    const handleResize = () => {
      if (!canvasRef.current) return;

      const { width, height } = canvasRef.current.getBoundingClientRect();
      canvasRef.current.width = Math.floor(width);
      canvasRef.current.height = Math.floor(height);

      // Camera aspect ratio will be updated automatically by worker
      // since we control the canvas dimensions
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial sizing

    return () => window.removeEventListener('resize', handleResize);
  }, [enabled]);

  // Worker command functions
  const renderArena = (cells: GridCell[], units: TacticalUnit[]): void => {
    if (!workerRef.current || !isReady) {
      console.warn('Tactical 3D worker not ready');
      return;
    }

    workerRef.current.postMessage({
      type: 'render-arena',
      data: { cells, units },
    });
  };

  const updateCamera = (
    position: { x: number; y: number; z: number },
    target?: { x: number; y: number; z: number }
  ): void => {
    if (!workerRef.current || !isReady) return;

    workerRef.current.postMessage({
      type: 'update-camera',
      data: { position, target },
    });
  };

  const highlightCells = (positions: Array<{ x: number; y: number; color?: string }>): void => {
    if (!workerRef.current || !isReady) return;

    workerRef.current.postMessage({
      type: 'highlight-cells',
      data: { positions },
    });
  };

  const clearHighlights = (): void => {
    if (!workerRef.current || !isReady) return;

    workerRef.current.postMessage({
      type: 'clear-highlights',
    });
  };

  return {
    canvasRef,
    isReady,
    error,
    renderArena,
    updateCamera,
    highlightCells,
    clearHighlights,
  };
}
