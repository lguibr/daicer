import { describe, expect, it, vi } from 'vitest';
import { registerGraphQLExtension } from '@/lifecycle/graphql/resolvers';

function registeredPreview() {
  let configuration;
  const getPreviewChunk = vi.fn(async (_x, _y, config) => ({ seed: config.seed, size: config.chunkSize }));
  const documents = vi.fn();
  registerGraphQLExtension({ contentTypes: {}, components: {}, documents,
    plugin: () => ({ service: () => ({ use: (value) => { configuration = value; }, shadowCRUD: () => ({ disable: vi.fn() }) }) }),
    service: () => ({ getPreviewChunk }),
  });
  return { query: configuration.resolvers.Query.voxelPreview, mutation: configuration.resolvers.Mutation,
    context: { state: { user: { documentId: 'viewer' } } }, getPreviewChunk, documents };
}

describe('registered detached world preview with mocked generation', () => {
  it('uses each updated configuration without changing persisted room worlds', async () => {
    const f = registeredPreview(), initial = { seed: 'seed-1', chunkSize: 16, seaLevel: 0 };
    const args = { chunks: [{ x: -1, y: 0 }], config: initial };
    expect(await f.query(null, args, f.context)).toEqual([{ seed: 'seed-1', size: 16 }]);
    expect(await f.query(null, { ...args, config: { ...initial, seed: 'seed-2', chunkSize: 32 } }, f.context)).toEqual([{ seed: 'seed-2', size: 32 }]);
    expect(initial).toEqual({ seed: 'seed-1', chunkSize: 16, seaLevel: 0 });
    expect(f.getPreviewChunk).toHaveBeenNthCalledWith(2, -1, 0, expect.objectContaining({ seed: 'seed-2', chunkSize: 32, seaLevel: 0 }));
    expect(f.documents).not.toHaveBeenCalled();
  });
  it('requires authentication and refuses legacy world mutation before side effects', async () => {
    const f = registeredPreview();
    await expect(f.query(null, { chunks: [{ x: 0, y: 0 }], config: { seed: 'seed' } }, {})).rejects.toMatchObject({ extensions: { code: 'UNAUTHENTICATED' } });
    expect(() => f.mutation.generateWorld()).toThrow('Use the room lifecycle');
    expect(f.getPreviewChunk).not.toHaveBeenCalled();
    expect(f.documents).not.toHaveBeenCalled();
  });
});
