import { describe, it, expect, vi } from 'vitest';
import { getGameResolvers } from '../game-resolvers';

describe('typed room mutation routing', () => {
  it.each(['createRoom', 'joinRoom', 'selectCharacter', 'setReady'])('%s uses authenticated lifecycle service', async (method) => {
    const action = vi.fn(), service = vi.fn(() => ({ [method]: action }));
    const resolver = getGameResolvers({ service }).Mutation[method];
    const input = { requestId: 'request', roomId: 'room', userId: 'untrusted' };
    const user = { documentId: 'session-user' };
    await expect(resolver(null, { input }, {})).rejects.toMatchObject({ extensions: { code: 'UNAUTHENTICATED' } });
    expect(service).not.toHaveBeenCalled();
    await resolver(null, { input }, { state: { user } });
    expect(service).toHaveBeenCalledWith('api::game.room-lifecycle');
    expect(action).toHaveBeenCalledWith(input, user);
  });
});
