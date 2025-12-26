import { parentPort } from 'worker_threads';
import { ChunkBuilder } from './chunk-builder';
import { WorldConfig } from '@daicer/engine';

interface GenerationTask {
  id: string;
  chunkX: number;
  chunkY: number;
  config: WorldConfig;
}

if (parentPort) {
  parentPort.on('message', (task: GenerationTask) => {
    try {
      const builder = new ChunkBuilder(task.config);
      const chunk = builder.generateChunk(task.chunkX, task.chunkY);
      // We send back the result. Note: Structured Clone algorithm handles the copying.
      parentPort!.postMessage({ id: task.id, success: true, result: chunk });
    } catch (error: any) {
      parentPort!.postMessage({ id: task.id, success: false, error: error.message || 'Unknown worker error' });
    }
  });
}
