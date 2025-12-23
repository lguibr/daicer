import { useEffect } from 'react';
import { useTerrainStore } from '../stores/useTerrainStore';

// Singleton worker instance to prevent multiple spawns
// Singleton worker instance (lazy loaded)
let workerInstance: Worker | null = null;

const getWorker = () => {
  if (typeof Worker === 'undefined') return null;
  if (!workerInstance) {
    workerInstance = new Worker(new URL('../workers/terrain.worker.ts', import.meta.url), {
      type: 'module',
    });
  }
  return workerInstance;
};

export const useTerrainWorker = () => {
  const setChunk = useTerrainStore((state) => state.setChunk);

  useEffect(() => {
    const worker = getWorker();
    if (!worker) return;

    const handleMessage = (e: MessageEvent) => {
      const { type, payload } = e.data;

      if (type === 'CHUNK_READY') {
        const { chunk, x, y } = payload;
        if (chunk && typeof x === 'number' && typeof y === 'number') {
          setChunk(x, y, chunk);
        }
      }
    };

    worker.addEventListener('message', handleMessage);

    return () => {
      worker.removeEventListener('message', handleMessage);
    };
  }, [setChunk]);

  const requestChunk = (_roomId: string, seed: string, x: number, y: number) => {
    const worker = getWorker();
    if (!worker) return;

    // Generate unique job ID
    const jobId = `${x},${y}-${Date.now()}`;

    // TODO: Check if already requesting to avoid duplicates

    worker.postMessage({
      type: 'GENERATE_CHUNK',
      jobId,
      payload: {
        seed,
        params: {}, // TODO: pass actual params from room settings
        x,
        y,
        size: 16,
      },
    });
  };

  return { requestChunk };
};
