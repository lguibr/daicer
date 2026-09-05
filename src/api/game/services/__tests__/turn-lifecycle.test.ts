import { describe, it, expect, vi } from 'vitest';
const propose = vi.hoisted(() => vi.fn());
vi.mock('../intent-proposal', () => ({ proposeIntent: propose }));
import turnLifecycle from '../turn-lifecycle';
import { resolveCommandBatch } from '../../src/engine/core/command-kernel';

function fixture() {
  const roomUid = 'api::room.room', sheetUid = 'api::entity-sheet.entity-sheet', operationUid = 'api::game-operation.game-operation';
  const users = [{ documentId: 'u1' }, { documentId: 'u2' }];
  let storage: Record<string, any[]> = {};
  storage[sheetUid] = users.map((user, index) => ({ documentId: `s${index + 1}`, name: `Player ${index + 1}`, owner: user, room: { documentId: 'room' },
    currentHp: 10, maxHp: 10, ac: 10, race: { speed: 30 }, position: { x: 0, y: 0, z: 0 },
    actions: [{ documentId: 'sword', type: 'melee', toHit: 4, range_config: { type: 'Touch' }, damage_instances: [{ effect_type: 'Damage', dice_count: 1, dice_value: 6, flat_bonus: 2 }] }] }));
  storage[roomUid] = [{ documentId: 'room', revision: 0, phase: 'lobby', owner: users[0], world: { documentId: 'world', seed: 'seed', chunkSize: 16 },
    players: users.map((user, index) => ({ user, characterSheet: { documentId: `s${index + 1}` }, isReady: true })) }];
  const fail = { snapshot: false, cas: false };
  const rows = (uid) => storage[uid] ??= [];
  const documents = (uid) => ({
    findOne: async ({ documentId }) => rows(uid).find((row) => row.documentId === documentId),
    findFirst: async ({ filters }) => rows(uid).find((row) => row.key === filters.key),
    create: async ({ data }) => {
      if (uid === 'api::time-frame.time-frame' && fail.snapshot) throw new Error('snapshot failure');
      if (data.key && rows(uid).some((row) => row.key === data.key)) throw new Error('duplicate key');
      const row = { documentId: `${uid}-${rows(uid).length}`, ...structuredClone(data) }; rows(uid).push(row); return row;
    },
    update: async ({ documentId, data }) => Object.assign(rows(uid).find((row) => row.documentId === documentId), structuredClone(data)),
  });
  const strapi = { documents, db: {
    transaction: async (work) => { const before = structuredClone(storage); try { return await work(); } catch (error) { storage = before; throw error; } },
    query: () => ({ updateMany: async ({ where, data }) => {
      const room = rows(roomUid)[0];
      if (fail.cas || room.revision !== where.revision) return { count: 0 };
      Object.assign(room, data); return { count: 1 };
    } }),
  }, service: (uid) => uid.includes('voxel-engine') ? { getChunk: async (x, y, config, worldId) => ({
    x, y, worldId, minZ: 0, revision: 'terrain-v1', tiles: [Array.from({ length: config.chunkSize }, () => Array.from({ length: config.chunkSize }, () => ({ isWalkable: true })))] }) } : {
    gameView: async (_roomId, user) => ({ myself: { characterSheetId: user.documentId === 'u1' ? 's1' : 's2' }, visibleEntities: rows(sheetUid).map((sheet) => ({ characterSheetId: sheet.documentId })) }),
  } };
  const service = turnLifecycle({ strapi });
  const start = () => service.startGame({ requestId: 'start', roomId: 'room' }, users[0]);
  const pass = (index) => service.submitAction({ requestId: `pass-${index}`, roomId: 'room', turnNumber: 1, kind: 'pass' }, users[index]);
  return { service, users, rows, fail, start, pass, get room() { return rows(roomUid)[0]; }, operationUid };
}

describe('simultaneous turn preparation with mocked persistence and offline kernel', () => {
  it('starts once, submits both passes and resolves exactly once on request replay', async () => {
    const f = fixture(); await f.start(); await f.start();
    expect(f.rows('api::turn.turn')).toHaveLength(1); expect(f.room.turnData.turnNumber).toBe(1);
    await f.pass(0); await f.pass(1);
    const input = { requestId: 'resolve', roomId: 'room', turnNumber: 1 };
    const response = await f.service.resolveTurn(input, f.users[0]);
    expect(await f.service.resolveTurn(input, f.users[0])).toEqual(response);
    expect(f.rows('api::turn.turn').map((turn) => turn.turnNumber)).toEqual([0, 1]);
    expect(f.rows('api::time-frame.time-frame').map((frame) => frame.turnNumber)).toEqual([0, 1]);
    expect(f.room.turnData).toMatchObject({ turnNumber: 2, lastResolvedNumber: 1, submissions: [] });
    expect(f.room.players.every((player) => player.isReady)).toBe(true);
    expect(f.rows('api::turn.turn')[1]).not.toHaveProperty('summary');
  });
  it('requires owner, all submissions, correct turn and membership', async () => {
    const f = fixture();
    await expect(f.service.startGame({ requestId: 'x', roomId: 'room' }, f.users[1])).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } });
    await f.start();
    await expect(f.service.resolveTurn({ requestId: 'early', roomId: 'room', turnNumber: 1 }, f.users[0])).rejects.toMatchObject({ extensions: { code: 'NOT_ALL_SUBMITTED' } });
    await expect(f.service.submitAction({ requestId: 'stale', roomId: 'room', turnNumber: 2, kind: 'pass' }, f.users[0])).rejects.toMatchObject({ extensions: { code: 'STALE_TURN' } });
    await expect(f.service.submitAction({ requestId: 'foreign', roomId: 'room', turnNumber: 1, kind: 'pass' }, { documentId: 'u3' })).rejects.toMatchObject({ extensions: { code: 'ROOM_UNAVAILABLE' } });
  });
  it('retains unknown intent for private revision and accepts a later correction', async () => {
    const f = fixture(); await f.start(); propose.mockResolvedValue({ success: false });
    const input = { requestId: 'intent', roomId: 'room', turnNumber: 1, kind: 'intent', text: 'teleport' };
    expect((await f.service.submitAction(input, f.users[0])).status).toBe('needs_revision');
    expect(f.room.turnData.submissions[0]).toMatchObject({ text: 'teleport', command: null });
    await f.pass(0); expect(f.room.turnData.submissions[0].status).toBe('submitted');
  });
  it('binds attack to the submitting character and archives replayable mechanics', async () => {
    const f = fixture(); await f.start();
    propose.mockResolvedValue({ success: true, data: { type: 'ATTACK', payload: { targetId: 's2', actionId: 'sword' } } });
    await f.service.submitAction({ requestId: 'attack', roomId: 'room', turnNumber: 1, kind: 'intent', text: 'attack' }, f.users[0]);
    await f.pass(1); await f.service.resolveTurn({ requestId: 'resolve', roomId: 'room', turnNumber: 1 }, f.users[0]);
    const turn = f.rows('api::turn.turn')[1], m = turn.metadata;
    expect(turn.actions[0].actorId).toBe('s1');
    const rerun = resolveCommandBatch({ state: m.before, commands: turn.actions, rules: m.rules, terrain: m.terrain, rngState: m.rngBefore });
    expect(rerun.nextState).toEqual(m.after); expect(rerun.nextRngState).toEqual(m.rngAfter);
    expect(m.nextCollectingState).toEqual(f.room.turnData.state);
    expect(f.rows('api::message.message').filter((message) => message.recipient).map((message) => message.recipient)).toEqual(['u1', 'u2']);
  });
  it('rolls back mechanics, consumption and turn record when snapshot persistence fails', async () => {
    const f = fixture(); await f.start(); await f.pass(0); await f.pass(1);
    const before = structuredClone(f.room.turnData); f.fail.snapshot = true;
    await expect(f.service.resolveTurn({ requestId: 'broken', roomId: 'room', turnNumber: 1 }, f.users[0])).rejects.toThrow('snapshot failure');
    expect(f.room.turnData).toEqual(before); expect(f.rows('api::turn.turn')).toHaveLength(1);
    expect(f.rows(f.operationUid).find((row) => row.status === 'failed')).toBeDefined();
    f.fail.snapshot = false;
    await f.service.resolveTurn({ requestId: 'retry-new', roomId: 'room', turnNumber: 1 }, f.users[0]);
    expect(f.room.turnData.turnNumber).toBe(2);
  });
  it('does not repeat a failed model call under the same request ID', async () => {
    const f = fixture(); await f.start(); propose.mockReset().mockRejectedValue(new Error('model offline'));
    const input = { requestId: 'intent', roomId: 'room', turnNumber: 1, kind: 'intent', text: 'move' };
    const response = await f.service.submitAction(input, f.users[0]);
    expect(response.status).toBe('needs_revision');
    expect(f.room.turnData.submissions[0]).toMatchObject({ text: 'move', status: 'needs_revision' });
    expect(await f.service.submitAction(input, f.users[0])).toEqual(response);
    expect(propose).toHaveBeenCalledTimes(1);
    await f.pass(0); expect(f.room.turnData.submissions[0].status).toBe('submitted');
  });
  it('persists proposing text before LLM work and rejects late superseded responses', async () => {
    const f = fixture(); await f.start();
    let now = Date.now(); const clock = vi.spyOn(Date, 'now').mockImplementation(() => now);
    let release, invoked;
    const called = new Promise<void>((resolve) => { invoked = resolve; });
    propose.mockImplementation(() => { invoked(); return new Promise((resolve) => { release = resolve; }); });
    const pending = f.service.submitAction({ requestId: 'slow', roomId: 'room', turnNumber: 1, kind: 'intent', text: 'move east' }, f.users[0]).catch((error) => error);
    await called;
    expect(f.room.turnData.submissions[0]).toMatchObject({ status: 'proposing', text: 'move east' });
    await expect(f.pass(0)).rejects.toMatchObject({ extensions: { code: 'ALREADY_SUBMITTED' } });
    now += 120001;
    await f.service.submitAction({ requestId: 'recovery', roomId: 'room', turnNumber: 1, kind: 'pass' }, f.users[0]);
    const replacement = structuredClone(f.room.turnData.submissions[0]);
    release({ success: true, data: { type: 'PASS', payload: {} } });
    expect(await pending).toMatchObject({ extensions: { code: 'STATE_CONFLICT' } });
    expect(f.room.turnData.submissions[0]).toEqual(replacement);
    clock.mockRestore();
  });

});
