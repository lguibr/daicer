import { describe, expect, it, vi } from 'vitest';
import { graphql, buildSchema } from 'graphql';
import { registerGraphQLExtension } from '@/lifecycle/graphql/resolvers';
import { standaloneGameSchema } from '@/lifecycle/graphql/game-contract';

function registered() {
  let configuration;
  const calls = new Map<string, ReturnType<typeof vi.fn>>();
  const methods = ['createRoom', 'joinRoom', 'selectCharacter', 'setReady', 'startGame', 'submitAction', 'resolveTurn'];
  for (const method of methods) calls.set(method, vi.fn(async () => ({ roomId: 'room', status: 'submitted' })));
  const strapi = {
    contentTypes: {}, components: {},
    plugin: () => ({ service: () => ({
      use: (value) => { configuration = value; },
      shadowCRUD: () => ({ disable: vi.fn() }),
    }) }),
    service: (uid) => {
      const names = uid === 'api::game.room-lifecycle' ? methods.slice(0, 4) : uid === 'api::game.turn-pipeline' ? methods.slice(4) : [];
      return Object.fromEntries(names.map((name) => [name, calls.get(name)]));
    },
  };
  registerGraphQLExtension(strapi);
  const schema = buildSchema(standaloneGameSchema);
  const rootValue = Object.fromEntries(methods.map((name) => [name, (args, context) => configuration.resolvers.Mutation[name](null, args, context)]));
  return { schema, rootValue, calls, configuration };
}

describe('registered player contract with mocked application services', () => {
  it.each([
    ['createRoom', 'CreateRoomInput', { requestId: 'create', language: 'en', worldConfig: { seed: 'seed' } }, 'roomId'],
    ['joinRoom', 'JoinRoomInput', { requestId: 'join', code: 'code' }, 'roomId'],
    ['selectCharacter', 'SelectCharacterInput', { requestId: 'select', roomId: 'room', blueprintId: 'blueprint' }, 'roomId'],
    ['setReady', 'SetReadyInput', { requestId: 'ready', roomId: 'room', ready: true }, 'roomId'],
    ['startGame', 'RoomOperationInput', { requestId: 'start', roomId: 'room' }, 'roomId'],
    ['submitAction', 'SubmitActionInput', { requestId: 'submit', roomId: 'room', turnNumber: 1, kind: 'pass' }, 'status'],
    ['resolveTurn', 'ResolveTurnInput', { requestId: 'resolve', roomId: 'room', turnNumber: 1 }, 'roomId'],
  ])('registers %s with typed input and authenticated caller identity', async (name: string, type: string, input, fields: string) => {
    const f = registered(), user = { documentId: 'viewer' };
    const source = `mutation($input:${type}!){${name}(input:$input){${fields}}}`;
    const anonymous = await graphql({ ...f, source, variableValues: { input }, contextValue: {} });
    expect(anonymous.errors?.[0].extensions.code).toBe('UNAUTHENTICATED');
    const result = await graphql({ ...f, source, variableValues: { input }, contextValue: { state: { user } } });
    expect(result.errors).toBeUndefined();
    expect(f.calls.get(name)).toHaveBeenCalledExactlyOnceWith(input, user);
  });

  it('rejects actor spoofing at input validation and keeps legacy execution closed after registration', async () => {
    const f = registered();
    const result = await graphql({ ...f, source: 'mutation($input:SubmitActionInput!){submitAction(input:$input){status}}',
      variableValues: { input: { requestId: 'r', roomId: 'room', turnNumber: 1, kind: 'pass', actorId: 'foreign' } },
      contextValue: { state: { user: { documentId: 'viewer' } } } });
    expect(result.errors?.[0].message).toContain('actorId');
    expect(f.calls.get('submitAction')).not.toHaveBeenCalled();
    expect(() => f.configuration.resolvers.Mutation.processTurn()).toThrow('Use the room lifecycle');
  });
});
