/**
 * Worker Pool Manager
 * Manages a pool of worker threads for CPU-intensive tasks like chunk generation
 */

import Piscina from 'piscina';
import { cpus } from 'os';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let workerPool: Piscina | null = null;

/**
 * Initialize the worker pool
 */
export function initWorkerPool(): void {
  if (workerPool) {
    logger.warn('[WorkerPool] Pool already initialized');
    return;
  }

  const cpuCount = cpus().length;
  const workerCount = Math.max(1, cpuCount - 1); // Leave one core for main thread

  logger.info(`[WorkerPool] Initializing worker pool with ${workerCount} workers (${cpuCount} CPUs detected)`);

  // In dev mode (tsx), load .ts file directly. In production, load compiled .js
  const isDev = process.env.NODE_ENV !== 'production' && __filename.endsWith('.ts');
  const workerPath = isDev ? resolve(__dirname, 'chunkWorker.ts') : resolve(__dirname, 'chunkWorker.js');

  logger.info(`[WorkerPool] Loading worker from: ${workerPath} (dev=${isDev})`);

  // In dev mode with tsx, we need to use tsx to run the worker
  const execArgv = isDev
    ? ['--import', 'tsx'] // Use tsx loader for TypeScript support
    : [];

  workerPool = new Piscina({
    filename: workerPath,
    minThreads: Math.min(2, workerCount),
    maxThreads: workerCount,
    idleTimeout: 60000, // 1 minute idle timeout
    maxQueue: 1000, // Max 1000 queued tasks
    execArgv,
  });

  logger.info('[WorkerPool] Worker pool initialized successfully');
}

/**
 * Get the worker pool instance
 */
export function getWorkerPool(): Piscina {
  if (!workerPool) {
    throw new Error('Worker pool not initialized. Call initWorkerPool() first.');
  }
  return workerPool;
}

/**
 * Shutdown the worker pool gracefully
 */
export async function shutdownWorkerPool(): Promise<void> {
  if (!workerPool) {
    logger.warn('[WorkerPool] Pool not initialized, nothing to shutdown');
    return;
  }

  logger.info('[WorkerPool] Shutting down worker pool...');

  try {
    await workerPool.destroy();
    workerPool = null;
    logger.info('[WorkerPool] Worker pool shutdown complete');
  } catch (error) {
    logger.error('[WorkerPool] Error during shutdown:', error);
    throw error;
  }
}

/**
 * Get worker pool statistics
 */
export function getWorkerPoolStats() {
  if (!workerPool) {
    return null;
  }

  return {
    queueSize: workerPool.queueSize,
    completed: workerPool.completed,
    duration: workerPool.duration,
    threads: workerPool.threads.length,
    runTime: workerPool.runTime,
    utilization: workerPool.utilization,
  };
}
