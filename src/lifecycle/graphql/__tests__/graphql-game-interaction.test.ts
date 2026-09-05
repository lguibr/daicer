import { describe, it, expect, vi } from 'vitest';
import { getGameResolvers } from '../game-resolvers';
import { getMutationResolvers } from '../mutation-resolvers';

describe('authoritative turn routing', () => {
  it.each(['startGame', 'submitAction', 'resolveTurn'])('%s never delegates to legacy execution', async (method) => {
    const action = vi.fn(), legacy = vi.fn();
    const strapi = { service: vi.fn((uid) => uid === 'api::game.turn-pipeline' ? { [method]: action } : { [method]: legacy }) };
    const resolver = getGameResolvers(strapi).Mutation[method], input = { requestId: 'r', roomId: 'room', turnNumber: 1 };
    const user = { documentId: 'user' };
    await expect(resolver(null, { input }, {})).rejects.toThrow('Authentication required');
    await resolver(null, { input }, { state: { user } });
    expect(action).toHaveBeenCalledWith(input, user); expect(legacy).not.toHaveBeenCalled();
  });
  it.each(['processTurn', 'addCharacter', 'spawnCreature', 'generateWorld', 'executeTool'])('refuses legacy %s', (method) => {
    const service = vi.fn();
    expect(() => getMutationResolvers({ service })[method]()).toThrow('Use the room lifecycle contract');
    expect(service).not.toHaveBeenCalled();
  });
});
