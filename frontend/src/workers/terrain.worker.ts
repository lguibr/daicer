import { createUnifiedTerrainGenerator, DEFAULT_GENERATION_PARAMS } from '@daicer/engine';

// Cache generators
const generators = new Map<string, ReturnType<typeof createUnifiedTerrainGenerator>>();

self.onmessage = (e: MessageEvent) => {
  const { type, jobId, payload } = e.data;

  if (type === 'GENERATE_CHUNK') {
    const { seed, params, x, y, size } = payload;
    const cacheKey = `${seed}-${JSON.stringify(params)}`;

    let generator = generators.get(cacheKey);
    if (!generator) {
      generator = createUnifiedTerrainGenerator(seed, params || DEFAULT_GENERATION_PARAMS);
      generators.set(cacheKey, generator);
    }

    try {
      const chunk = generator(x, y, size || 16);
      self.postMessage({
        type: 'CHUNK_READY',
        jobId,
        payload: { chunk, x, y },
      });
    } catch (err) {
      self.postMessage({ type: 'ERROR', jobId, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }
};
