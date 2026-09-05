import { describe, it, expect, vi } from 'vitest';
import { getGameResolvers } from '@/lifecycle/graphql/game-resolvers';
import { getMutationResolvers } from '@/lifecycle/graphql/mutation-resolvers';

function fixture() {
  const user = { documentId: 'u1' }, call = vi.fn(), getChunk = vi.fn(), getPreviewChunk = vi.fn();
  const room = { documentId: 'r1', players: [{ user }], world: { documentId: 'w1', seed: 's', chunkSize: 32, seaLevel: 0 } };
  const strapi = { documents: () => ({ findOne: async () => room }), service: (uid) => uid.includes('voxel-engine') ? { getChunk, getPreviewChunk } : { createRoom: call, gameView: async () => ({terrain:{worldId:'w1',chunkSize:32,revision:'view',tiles:[{x:-1,y:0,z:0,block:'grass'}]}}) } };
  return { user, context: { state: { user } }, call, getChunk, getPreviewChunk, room, strapi, resolvers: getGameResolvers(strapi) };
}

describe('game wire adapters', () => {
  it('requires a session and binds it rather than client actor fields', async () => {
    const f = fixture(), input = { requestId: 'r', userId: 'spoof' };
    await expect(f.resolvers.Mutation.createRoom(null, { input }, {})).rejects.toMatchObject({ extensions: { code: 'UNAUTHENTICATED' } });
    await f.resolvers.Mutation.createRoom(null, { input }, f.context);
    expect(f.call).toHaveBeenCalledWith(input, f.user);
  });
  it('fails explicitly when safe turn integration is unavailable', async () => {
    const f = fixture();
    await expect(f.resolvers.Mutation.resolveTurn(null, { input: {} }, f.context)).rejects.toMatchObject({ extensions: { code: 'OPERATION_UNAVAILABLE' } });
    expect(f.call).not.toHaveBeenCalled();
  });
  it('uses canonical room and world IDs and authoritative configuration', async () => {
    const f = fixture();
    const chunk = await f.resolvers.Mutation.generateTerrainChunk(null, { roomId: 'r1', chunkX: -1, chunkY: 0 }, f.context);
    expect(chunk).toMatchObject({worldId:'w1',size:32});
    expect(chunk.tiles[3][0][31]).toMatchObject({x:-1,y:0,z:0});
    expect(chunk.tiles[3][0][30]).toBeNull();
    expect(f.getChunk).not.toHaveBeenCalled();
    await expect(f.resolvers.Mutation.generateTerrainChunk(null, { roomId: 'r1', chunkX: 0, chunkY: 0, chunkSize: 16 }, f.context)).rejects.toMatchObject({ extensions: { code: 'INVALID_INPUT' } });
    await expect(f.resolvers.Mutation.generateTerrainChunk(null, { roomId: 'r1', chunkX: 0, chunkY: 0 }, { state: { user: { documentId: 'outsider' } } })).rejects.toMatchObject({ extensions: { code: 'ROOM_UNAVAILABLE' } });
  });
  it('keeps preview detached from persistent world chunks', async () => {
    const f = fixture();
    await f.resolvers.Query.voxelPreview(null, { chunks: [{ x: 0, y: 0 }], config: { seed: 's' } }, f.context);
    expect(f.getPreviewChunk).toHaveBeenCalledTimes(1); expect(f.getChunk).not.toHaveBeenCalled();
    await expect(f.resolvers.Query.voxelPreview(null, { chunks: Array(17).fill({ x: 0, y: 0 }), config: {} }, f.context)).rejects.toThrow();
  });
  it('blocks legacy executors and raw history before touching services', () => {
    const f = fixture(), old = getMutationResolvers(f.strapi);
    for (const name of ['processTurn', 'executeTool', 'spawnCreature', 'generateWorld', 'addCharacter']) expect(() => old[name]()).toThrow('Use the room lifecycle');
    expect(() => f.resolvers.Query.getTimeFrame()).toThrow('Raw game history');
    expect(() => f.resolvers.Query.getAgentLogs()).toThrow('Raw game history');
    expect(f.call).not.toHaveBeenCalled();
  });
});
