import { Worker } from 'worker_threads';
import path from 'path';
import { Chunk, WorldConfig } from '@daicer/engine';

export class ChunkManager {
  private static instance: ChunkManager;
  private worker: Worker;
  private pending: Map<string, { resolve: (c: Chunk) => void; reject: (e: unknown) => void }>;
  private cache: Map<string, Chunk>;

  private constructor() {
    this.pending = new Map();
    this.cache = new Map();

    const workerPath = path.resolve(process.cwd(), 'src/api/voxel-engine/services/chunk-worker-loader.js');
    this.worker = new Worker(workerPath);

    this.worker.on('message', (msg: { id: string; success: boolean; result: Chunk; error?: string; seed?: string }) => {
      const { id, success, result, error } = msg;
      if (this.pending.has(id)) {
        const { resolve, reject } = this.pending.get(id)!;
        this.pending.delete(id);
        if (success) {
          this.addToCache(result.x, result.y, msg.seed, result); // Ideally we pass seed back or track it
          resolve(result);
        } else {
          reject(new Error(error));
        }
      }
    });

    this.worker.on('error', (err) => {
      console.error('Chunk Worker Error:', err);
      // Fail all pending
      for (const { reject } of this.pending.values()) {
        reject(err);
      }
      this.pending.clear();
    });
  }

  public static getInstance(): ChunkManager {
    if (!ChunkManager.instance) {
      ChunkManager.instance = new ChunkManager();
    }
    return ChunkManager.instance;
  }

  private addToCache(x: number, y: number, seed: string, chunk: Chunk) {
    const key = `${seed}_${x}_${y}`;
    if (this.cache.size > 200) {
      const first = this.cache.keys().next().value;
      if (first) this.cache.delete(first);
    }
    this.cache.set(key, chunk);
  }

  public async getChunk(x: number, y: number, config: WorldConfig): Promise<Chunk> {
    const key = `${config.seed}_${x}_${y}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substring(7);

      // We wrap resolve to cache the result when it arrives
      // But wait, the worker message handler calls resolve.
      // I can't easily pass the 'key' to the worker and back without modifying the protocol.
      // Modifying protocol slightly in postMessage below.

      this.pending.set(id, {
        resolve: (chunk) => {
          this.cache.set(key, chunk);
          resolve(chunk);
        },
        reject,
      });

      this.worker.postMessage({ id, chunkX: x, chunkY: y, config });
    });
  }
}
