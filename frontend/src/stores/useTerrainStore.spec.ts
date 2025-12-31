import { describe, it, expect, beforeEach } from 'vitest';
import { useTerrainStore } from './useTerrainStore';
import type { ChunkDTO } from '@daicer/engine';

describe('useTerrainStore', () => {
  beforeEach(() => {
    useTerrainStore.setState({
      chunks: new Map(),
      pendingDeltas: {},
    });
  });

  it('should initialize with empty state', () => {
    const state = useTerrainStore.getState();
    expect(state.chunks.size).toBe(0);
    expect(Object.keys(state.pendingDeltas)).toHaveLength(0);
  });

  it('should set and get a chunk', () => {
    const mockChunk: ChunkDTO = {
      grid: [],
      worldOffsetX: 0,
      worldOffsetY: 0,
      size: 16,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const store = useTerrainStore.getState();
    store.setChunk(0, 0, mockChunk);

    expect(useTerrainStore.getState().chunks.has('0,0')).toBe(true);
    expect(useTerrainStore.getState().getChunk(0, 0)).toBe(mockChunk);
  });

  it('should optimistically update a tile', () => {
    // Setup chunk
    const mockGrid = Array(7)
      .fill(null)
      .map(() =>
        Array(16)
          .fill(null)
          .map(() => Array(16).fill({ b: 'plains', t: 'grass' }))
      );
    const mockChunk: ChunkDTO = {
      grid: mockGrid,
      worldOffsetX: 0,
      worldOffsetY: 0,
      size: 16,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const store = useTerrainStore.getState();
    store.setChunk(0, 0, mockChunk);

    // Apply update at 8,8 on floor 3 (z=0)
    store.setTile(8, 8, 0, { t: 'stone' });

    // Verify update
    const updatedChunk = store.getChunk(0, 0);
    expect(updatedChunk?.grid[3][8][8].t).toBe('stone');
  });
});
