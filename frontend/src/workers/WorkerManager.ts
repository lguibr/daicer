/**
 * Worker Manager
 * Factory for creating and managing OffscreenCanvas renderer workers
 */

import { supportsOffscreenCanvas } from '../utils/featureDetection';

export type WorkerType = 'dice' | 'map' | 'voxel';

export interface WorkerMessage {
  type: string;
 
  [key: string]: any;
}

export interface WorkerConfig {
  canvas: HTMLCanvasElement;
 
  onMessage?: (data: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Base class for managing renderer workers
 */
export class WorkerManager {
  private worker: Worker | null = null;

  private canvas: HTMLCanvasElement | null = null;

  private offscreenCanvas: OffscreenCanvas | null = null;

 
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  private supportsOffscreen: boolean;

  constructor(
    private workerPath: string,
    private workerType: WorkerType
  ) {
    this.supportsOffscreen = supportsOffscreenCanvas();

    if (!this.supportsOffscreen) {
      console.warn(`[WorkerManager] OffscreenCanvas not supported, ${workerType} will render on main thread`);
    }
  }

  /**
   * Initialize the worker with a canvas
   */
  initialize(config: WorkerConfig): boolean {
    if (!this.supportsOffscreen) {
      return false;
    }

    try {
      this.canvas = config.canvas;

      // Transfer canvas control to worker
      this.offscreenCanvas = this.canvas.transferControlToOffscreen();

      // Create worker
      this.worker = new Worker(new URL(this.workerPath, import.meta.url), {
        type: 'module',
      });

      // Setup message handler
      this.worker.onmessage = (e: MessageEvent) => {
        const { type, data } = e.data;

        if (config.onMessage) {
          config.onMessage(e.data);
        }

        // Call registered handler for this message type
        const handler = this.messageHandlers.get(type);
        if (handler) {
          handler(data);
        }
      };

      // Setup error handler
      this.worker.onerror = (error) => {
        console.error(`[WorkerManager] ${this.workerType} worker error:`, error);
        if (config.onError) {
 
          config.onError(error as any);
        }
      };

      // Send canvas to worker
      this.worker.postMessage(
        {
          type: 'init',
          canvas: this.offscreenCanvas,
        },
 
        [this.offscreenCanvas as any]
      );

      console.log(`[WorkerManager] ${this.workerType} worker initialized successfully`);
      return true;
    } catch (error) {
      console.error(`[WorkerManager] Failed to initialize ${this.workerType} worker:`, error);
      return false;
    }
  }

  /**
   * Register a message handler for a specific message type
   */
 
  on(messageType: string, handler: (data: any) => void): void {
    this.messageHandlers.set(messageType, handler);
  }

  /**
   * Send a message to the worker
   */
  postMessage(message: WorkerMessage, transfer?: Transferable[]): void {
    if (!this.worker) {
      console.warn(`[WorkerManager] Worker not initialized`);
      return;
    }

    if (transfer) {
      this.worker.postMessage(message, transfer);
    } else {
      this.worker.postMessage(message);
    }
  }

  /**
   * Cleanup worker resources
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    this.offscreenCanvas = null;
    this.canvas = null;
    this.messageHandlers.clear();

    console.log(`[WorkerManager] ${this.workerType} worker terminated`);
  }

  /**
   * Check if worker is running
   */
  isActive(): boolean {
    return this.worker !== null;
  }

  /**
   * Check if OffscreenCanvas is supported
   */
  isOffscreenSupported(): boolean {
    return this.supportsOffscreen;
  }
}

/**
 * Factory functions for specific worker types
 */
export const createDiceWorker = () => new WorkerManager('../workers/diceRenderer.worker.ts', 'dice');

export const createMapWorker = () => new WorkerManager('../workers/worldRenderer.worker.ts', 'map');

export const createVoxelWorker = () => new WorkerManager('../workers/voxelRenderer.worker.ts', 'voxel');
