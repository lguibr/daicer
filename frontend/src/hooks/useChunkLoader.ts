import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import type { Chunk, WorldConfig, Coordinates } from '../features/debug/utils/types';

interface UseChunkLoaderProps {
  config: WorldConfig;
  endpoint?: string;
}

export function useChunkLoader({ config, endpoint = 'http://localhost:1337/graphql' }: UseChunkLoaderProps) {
  const [chunkCache, setChunkCache] = useState<Record<string, Chunk>>({});
  const [loadingChunks, setLoadingChunks] = useState<Set<string>>(new Set());
  const [isRegenerating, setIsRegenerating] = useState(false);

  const batchQueue = useRef<Set<string>>(new Set());
  const batchTimeout = useRef<NodeJS.Timeout | null>(null);

  const getChunkId = useCallback((cx: number, cy: number) => `${cx},${cy}`, []);

  // Clear cache when critical config changes
  useEffect(() => {
    setChunkCache({});
    setLoadingChunks(new Set());
    batchQueue.current.clear();
    setIsRegenerating(true);

    // Allow a small tick for the reset to propagate before considered "done" if nothing is fetched
    const t = setTimeout(() => setIsRegenerating(false), 100);
    return () => clearTimeout(t);
  }, [config.seed, config.seaLevel, config.globalScale, config.moistureScale, config.temperatureOffset]);

  const processBatch = async () => {
    if (batchQueue.current.size === 0) return;

    const queuedIds = Array.from(batchQueue.current);
    batchQueue.current.clear();
    batchTimeout.current = null;

    const chunksToFetch = queuedIds
      .map((id) => {
        const [x, y] = id.split(',').map(Number);
        if (x === undefined || y === undefined || isNaN(x) || isNaN(y)) return null;
        return { x, y };
      })
      .filter((c): c is { x: number; y: number } => c !== null);

    if (chunksToFetch.length === 0) {
      setLoadingChunks((prev) => {
        const next = new Set(prev);
        queuedIds.forEach((id) => next.delete(id));
        return next;
      });
      return;
    }

    try {
      // Use logic similar to existing components but standardized
      const query = `
        query VoxelPreview($chunks: [ChunkRequestInput]!, $config: WorldConfigInput!) {
          voxelPreview(chunks: $chunks, config: $config)
        }
      `;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt') || ''}`,
        },
        body: JSON.stringify({
          query,
          variables: {
            chunks: chunksToFetch,
            config,
          },
        }),
      });

      const json = await response.json();

      if (json.errors) {
        throw new Error(json.errors[0].message);
      }

      const results = json.data?.voxelPreview;

      if (Array.isArray(results)) {
        setChunkCache((prev) => {
          const next = { ...prev };
          results.forEach((chunk: Chunk, index: number) => {
            const req = chunksToFetch[index];
            if (req) {
              next[getChunkId(req.x, req.y)] = chunk;
            }
          });
          return next;
        });
      }
    } catch (e) {
      console.error('Batch Chunk Fetch Failed:', e);
    } finally {
      setLoadingChunks((prev) => {
        const next = new Set(prev);
        queuedIds.forEach((id) => next.delete(id));
        return next;
      });
      // Simple heuristic: if queue empty, regeneration is settled for now
      if (batchQueue.current.size === 0) {
        setIsRegenerating(false);
      }
    }
  };

  const fetchChunk = useCallback(
    (cx: number, cy: number) => {
      const id = getChunkId(cx, cy);
      // Warning: Check current state in ref or functional update to avoid closures?
      // Actually standard check is fine IF dependencies are correct.
      // We can't easily check chunkCache here without adding it to dependency (causing re-creation).
      // Instead, we rely on the component using this hook to check cache BEFORE calling fetchChunk,
      // OR we check loadingChunks/batchQueue here which are refs/state.

      // Ideally, getChunk should check cache.
      // fetchChunk is the *action* to fetch.

      batchQueue.current.add(id);
      setLoadingChunks((prev) => new Set(prev).add(id));
      setIsRegenerating(true);

      if (batchTimeout.current) {
        clearTimeout(batchTimeout.current);
      }
      batchTimeout.current = setTimeout(processBatch, 50);
    },
    [getChunkId, endpoint, config]
  ); // config is dependency because processBatch uses it, and processBatch is recreated or closure...
  // Wait, processBatch is defined inside render, so it closes over config.
  // We need to use ref for processBatch or useCallback with config dependency.
  // Actually processBatch uses `config` from props. capture it.

  const getChunk = useCallback(
    (x: number, y: number) => {
      const id = getChunkId(x, y);
      if (chunkCache[id]) return chunkCache[id];

      // Note: We don't verify if it's already loading here to keep 'get' pure-ish,
      // but the consumer usually calls fetch if null.
      // To make this easier:
      if (!loadingChunks.has(id) && !batchQueue.current.has(id)) {
        fetchChunk(x, y);
      }
      return null;
    },
    [chunkCache, fetchChunk, getChunkId, loadingChunks]
  );

  return {
    chunkCache,
    isLoading: loadingChunks.size > 0 || isRegenerating,
    getChunk,
    resetCache: () => setChunkCache({}),
  };
}
