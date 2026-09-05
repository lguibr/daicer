import { describe, expect, it } from 'vitest';
import { ChunkManager, type VoxelChangeRecord } from '@/api/voxel-engine/services/chunk-manager';
import { ChunkBuilder } from '@/api/voxel-engine/services/chunk-builder';
import { normalizeWorldConfig } from '@/api/world/utils/world-config';
const change = (overrides: Partial<VoxelChangeRecord> = {}): VoxelChangeRecord => ({
  id: 1,
  timestamp: '1',
  chunkX: 0,
  chunkY: 0,
  voxelX: 1,
  voxelY: 1,
  voxelZ: 0,
  newType: 'wall_stone',
  ...overrides,
});
const apply = (chunk: any, records: VoxelChangeRecord[]) =>
  ChunkManager.prototype.applyVoxelChanges.call(Object.create(ChunkManager.prototype), chunk, records);
describe('Persisted overlay semantics over real generated terrain', () => {
  it('uses numeric timestamp/id replay order even when records arrive shuffled', () => {
    const chunk = new ChunkBuilder(normalizeWorldConfig({})).generateChunk(0, 0);
    apply(chunk, [
      change({ id: 3, timestamp: '10', newType: 'door' }),
      change({ id: 1, timestamp: '2' }),
      change({ id: 2, timestamp: '10', newType: 'stone' }),
    ]);
    expect(chunk.tiles[3][1][1]).toMatchObject({ block: 'door', isWalkable: true, isTransparent: true });
  });
  it('preserves metadata while updating collision and opacity at coordinate 31', () => {
    const chunk = new ChunkBuilder(normalizeWorldConfig({ chunkSize: 32 })).generateChunk(0, 0);
    apply(chunk, [
      change({ voxelX: 31, metadata: { one: 1 } }),
      change({ id: 2, timestamp: '2', voxelX: 31, newType: 'air', metadata: { two: 2 } }),
    ]);
    expect(chunk.tiles[3][1][31]).toMatchObject({
      block: 'air',
      isWalkable: false,
      isTransparent: true,
      metadata: { one: 1, two: 2 },
    });
  });
  it.each([{ voxelX: -1 }, { voxelX: 32 }, { voxelZ: 4 }, { chunkX: 1 }, { timestamp: 'bad' }])(
    'rejects malformed stored edits %j',
    (override) => {
      const chunk = new ChunkBuilder(normalizeWorldConfig({})).generateChunk(0, 0);
      expect(() => apply(chunk, [change(override)])).toThrow();
    }
  );
});
