import { beforeEach, describe, expect, it, vi } from 'vitest';
import lifecycle from '@/api/world/content-types/world/lifecycles';
const getChunk = vi.fn();
const error = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  getChunk.mockResolvedValue({});
  vi.stubGlobal('strapi', { service: vi.fn(() => ({ getChunk })), log: { info: vi.fn(), error } });
});
describe('World lifecycle cache warming', () => {
  it('uses the document id and authoritative config for the complete starting area', async () => {
    await lifecycle.afterCreate({ result: { documentId: 'world-a', seed: 'a', chunkSize: 16, startingRadius: 1 } });
    expect(getChunk).toHaveBeenCalledTimes(9);
    expect(getChunk).toHaveBeenCalledWith(-1, -1, expect.objectContaining({ seed: 'a', chunkSize: 16 }), 'world-a');
    expect(getChunk).toHaveBeenCalledWith(1, 1, expect.anything(), 'world-a');
  });
  it('preserves zero settings and a zero starting radius', async () => {
    await lifecycle.afterCreate({
      result: { documentId: 'world-a', startingRadius: 0, roadDensity: 0, structureChance: 0, fogRadius: 0 },
    });
    expect(getChunk).toHaveBeenCalledTimes(1);
    expect(getChunk).toHaveBeenCalledWith(
      0,
      0,
      expect.objectContaining({ chunkSize: 32, roadDensity: 0, structureChance: 0, fogRadius: 0 }),
      'world-a'
    );
  });
  it('never substitutes a numeric id when document identity is absent', async () => {
    await lifecycle.afterCreate({ result: { id: 1 } });
    expect(getChunk).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalled();
  });
  it('reports failed warming without claiming completion or retrying unscoped', async () => {
    getChunk.mockRejectedValue(new Error('unavailable'));
    await lifecycle.afterCreate({ result: { documentId: 'world-a', startingRadius: 1 } });
    expect(getChunk).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalled();
  });
});
