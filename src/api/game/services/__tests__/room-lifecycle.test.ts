import { describe, expect, it, vi } from 'vitest';
import roomLifecycle, { claimRoomRevision, requestIdentity } from '../room-lifecycle';
import { OPERATION_UID, ROOM_UID } from '../room-access';

function fixture() {
  const user = { documentId: 'u1', username: 'Player' };
  const room = { documentId: 'r1', code: 'old-code', revision: 0, phase: 'lobby', owner: user,
    players: [{ user, name: 'Player', isReady: false, character: { documentId: 'b1' }, characterSheet: {
      documentId: 's1', owner: user, room: { documentId: 'r1' },
    } }] };
  let records = [];
  const update = vi.fn(async ({ data }) => Object.assign(room, data));
  const gameView = vi.fn(async (roomId, viewer) => {
    if (!room.players.some((player) => (typeof player.user === 'string' ? player.user : player.user.documentId) === viewer.documentId)) {
      throw new Error('membership revoked');
    }
    return { roomId, viewer: viewer.documentId };
  });
  const onboardPlayer = vi.fn();
  const creates = [];
  const create = vi.fn(async ({ data }) => { creates.push(data); return { documentId: 'r1', ...data }; });
  const cas = vi.fn(async () => ({ count: 1 }));
  const strapi = {
    documents: (uid) => uid === OPERATION_UID ? {
      findFirst: async ({ filters }) => records.find((row) => row.key === filters.key),
      create: async ({ data }) => { const row = { documentId: `op-${records.length}`, ...data }; records.push(row); return row; },
      update: async ({ documentId, data }) => Object.assign(records.find((row) => row.documentId === documentId), data),
    } : { findOne: async () => room, findFirst: async () => room, update, create },
    service: (uid) => uid === 'api::game.room-access' ? { gameView } : { onboardPlayer },
    db: {
      query: () => ({ updateMany: cas }),
      transaction: async (callback) => {
        const oldRoom = structuredClone(room), oldRecords = structuredClone(records);
        try { return await callback(); } catch (error) {
          Object.keys(room).forEach((key) => delete room[key]); Object.assign(room, oldRoom); records = oldRecords; throw error;
        }
      },
    },
  };
  return { user, room, creates, create, records: () => records, strapi, update, gameView, onboardPlayer, cas, service: roomLifecycle({ strapi }) };
}

describe('transactional lobby service (mocked persistence)', () => {
  it('persists readiness separately from actions and replays without another write', async () => {
    const f = fixture(); const input = { requestId: 'ready-1', roomId: 'r1', ready: true };
    await f.service.setReady(input, f.user);
    await f.service.setReady(input, f.user);
    expect(f.update).toHaveBeenCalledTimes(1);
    expect(f.update.mock.calls[0][0].data.players[0]).toMatchObject({ user: 'u1', characterSheet: 's1', isReady: true, action: null });
    expect(f.records()[0].result).toEqual({ roomId: 'r1' });
    expect(f.cas).toHaveBeenCalledTimes(1);
  });

  it('preserves both players blueprint and sheet relations on readiness changes', async () => {
    const f = fixture();
    f.room.players.push({ user: { documentId: 'u2', username: 'Second' }, name: 'Second', isReady: false, character: { documentId: 'b2' }, characterSheet: { documentId: 's2', owner: { documentId: 'u2', username: 'Second' }, room: { documentId: 'r1' } } });
    await f.service.setReady({ requestId: 'r', roomId: 'r1', ready: true }, f.user);
    expect(f.update.mock.calls[0][0].data.players.map((p) => [p.character, p.characterSheet])).toEqual([['b1', 's1'], ['b2', 's2']]);
  });

  it('creates a lobby, world and settings under one request receipt', async () => {
    const f = fixture();
    const input = { requestId: 'create', language: 'en', worldConfig: { seed: 'seed', chunkSize: 32, seaLevel: 0 } };
    await f.service.createRoom(input, f.user);
    await f.service.createRoom(input, f.user);
    expect(f.creates).toHaveLength(3);
    expect(f.creates[0]).toMatchObject({ phase: 'lobby', owner: 'u1', revision: 0 });
    expect(f.creates[0].code).toBe(f.creates[0].roomId);
    expect(f.creates[1]).toMatchObject({ room: 'r1', seed: 'seed', chunkSize: 32, seaLevel: 0 });
    expect(f.creates[2]).toEqual({ room: 'r1' });
  });

  it('rolls back a create receipt if world creation fails', async () => {
    const f = fixture(); f.create.mockResolvedValueOnce({ documentId: 'r1' }).mockRejectedValueOnce(new Error('world failure'));
    await expect(f.service.createRoom({ requestId: 'create', language: 'en', worldConfig: { seed: 'seed' } }, f.user)).rejects.toThrow('world failure');
    expect(f.records()).toEqual([]);
  });

  it('joins by code without replacing existing membership and reconnects after start', async () => {
    const f = fixture(); const second = { documentId: 'u2', username: 'Second' };
    await f.service.joinRoom({ requestId: 'join', code: 'old-code' }, second);
    expect(f.update.mock.calls[0][0].data.players).toHaveLength(2);
    f.room.phase = 'gameplay';
    await f.service.joinRoom({ requestId: 'rejoin', code: 'old-code' }, second);
    expect(f.update).toHaveBeenCalledTimes(1);
    await expect(f.service.joinRoom({ requestId: 'late', code: 'old-code' }, { documentId: 'u3' })).rejects.toMatchObject({ extensions: { code: 'INVALID_PHASE' } });
  });

  it('rejects request-key reuse with changed input', async () => {
    const f = fixture(); const input = { requestId: 'r', roomId: 'r1', ready: true };
    await f.service.setReady(input, f.user);
    await expect(f.service.setReady({ ...input, ready: false }, f.user)).rejects.toMatchObject({ extensions: { code: 'IDEMPOTENCY_CONFLICT' } });
  });

  it('reauthorizes receipts after membership is revoked', async () => {
    const f = fixture(); const input = { requestId: 'r', roomId: 'r1', ready: true };
    await f.service.setReady(input, f.user); f.room.players = [];
    await expect(f.service.setReady(input, f.user)).rejects.toThrow('membership revoked');
  });

  it('claims before component replacement and rejects stale revisions', async () => {
    const f = fixture(); f.cas.mockResolvedValue({ count: 0 });
    await expect(f.service.setReady({ requestId: 'r', roomId: 'r1', ready: true }, f.user)).rejects.toMatchObject({ extensions: { code: 'STATE_CONFLICT' } });
    expect(f.update).not.toHaveBeenCalled(); expect(f.records()).toEqual([]);
  });

  it('supports legacy-null revision claims', async () => {
    const f = fixture(); f.room.revision = null;
    await claimRoomRevision(f.strapi, f.room);
    expect(f.cas).toHaveBeenCalledWith({ where: { documentId: 'r1', revision: { $null: true } }, data: { revision: 1 } });
  });

  it('rolls back the request claim when downstream sheet creation fails', async () => {
    const f = fixture(); f.onboardPlayer.mockRejectedValue(new Error('sheet lifecycle failed'));
    await expect(f.service.selectCharacter({ requestId: 's', roomId: 'r1', blueprintId: 'b1' }, f.user)).rejects.toThrow('sheet lifecycle failed');
    expect(f.records()).toEqual([]); expect(f.room.players[0].characterSheet.documentId).toBe('s1');
  });

  it('uses the actual onboarding implementation with distinct blueprint and sheet identities', async () => {
    const f = fixture();
    await f.service.selectCharacter({ requestId: 's', roomId: 'r1', blueprintId: 'blueprint' }, f.user);
    expect(f.onboardPlayer).toHaveBeenCalledWith('r1', { documentId: 'blueprint' }, f.user);
  });

  it('scopes request keys by user and operation and hashes objects deterministically', () => {
    expect(requestIdentity('ready', { requestId: 'r', ready: true }, 'u1')).toEqual(requestIdentity('ready', { ready: true, requestId: 'r' }, 'u1'));
    expect(requestIdentity('ready', { requestId: 'r' }, 'u1').key).not.toBe(requestIdentity('ready', { requestId: 'r' }, 'u2').key);
  });
});
