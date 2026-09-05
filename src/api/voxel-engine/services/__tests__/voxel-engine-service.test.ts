import { beforeEach, describe, expect, it, vi } from 'vitest';
import factory from '@/api/voxel-engine/services/voxel-engine';
const manager = vi.hoisted(() => ({
  getChunk: vi.fn(),
  getPreviewChunk: vi.fn(),
  getTileAt: vi.fn(),
  editVoxel: vi.fn(),
}));
vi.mock('@/api/voxel-engine/services/chunk-manager', () => ({ ChunkManager: { getInstance: () => manager } }));
beforeEach(() => vi.clearAllMocks());
describe('World terrain service contract', () => {
  it('keeps persisted and preview reads separate', async () => {
    const service = factory();
    const config = { seed: 'test' } as any;
    await service.getChunk(1, 2, config, 'world-a');
    expect(manager.getChunk).toHaveBeenCalledWith(1, 2, config, 'world-a');
    await service.getPreviewChunk(1, 2, config);
    expect(manager.getPreviewChunk).toHaveBeenCalledWith(1, 2, config);
    await service.getTileAt(-1, 2, 0, config, 'world-a');
    expect(manager.getTileAt).toHaveBeenCalledWith(-1, 2, 0, config, 'world-a');
  });
  it('delegates an unambiguous object edit without swapping reason and world', async () => {
    const request = {
      worldId: 'world-a',
      config: {} as any,
      chunkX: 1,
      chunkY: 2,
      voxelX: 0,
      voxelY: 0,
      voxelZ: 0,
      reason: 'marker',
      metadata: { marker: true },
    };
    await factory().editVoxel(request);
    expect(manager.editVoxel).toHaveBeenCalledWith(request);
  });
});
