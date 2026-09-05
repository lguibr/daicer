import { describe, expect, it, vi } from 'vitest';
import roomAccess, { requireRoom } from '@/api/game/services/room-access';
const terrain = vi.hoisted(() => vi.fn(async () => ({worldId:'w1', revision:'visible', chunkSize:16, minZ:-3, maxZ:3, tiles:[{x:0,y:0,z:0}]})));
vi.mock('../room-terrain', () => ({ projectRoomTerrain: terrain }));

function fixture() {
  const user = { documentId: 'u1' };
  const sheet = { documentId: 's1', entity: { documentId: 'blueprint' }, owner: user,
    room: { documentId: 'r1' }, name: 'Hero', type: 'player', currentHp: 0, maxHp: 10,
    position: { x: 0, y: 0, z: 0 }, stats: { strength: 12 } };
  const room = { documentId: 'r1', code: 'existing-code', phase: 'lobby', owner: user,
    world: { documentId: 'w1', seed: 'world', chunkSize: 16, seaLevel: 0 },
    players: [{ user, characterSheet: sheet, isReady: false }], entity_sheets: [sheet,
      { ...sheet, documentId: 'hidden', position: { x: 100, y: 100, z: 0 }, backstory: 'secret' }],
    turnData: { private: 'must not escape' } };
  const rows = [
    { documentId: 'private-other', content: 'not yours', timestamp: 3, recipient: { documentId: 'u2' } },
    { documentId: 'private-self', content: 'yours', timestamp: 2, recipient: user },
    { documentId: 'public', content: 'public', timestamp: 1, recipient: null },
  ];
  const messages = vi.fn(async () => rows);
  const strapi = { documents: (uid) => ({
    findOne: vi.fn(async () => uid === 'api::room.room' ? room : sheet),
    findMany: messages,
  }), service: () => ({ cullEntities: () => [] }) };
  return { user, sheet, room, rows, messages, strapi, service: roomAccess({ strapi }) };
}

describe('protected room projection', () => {
  it('rejects unauthenticated and nonmember access', async () => {
    const f = fixture();
    await expect(requireRoom(f.strapi, 'r1', null)).rejects.toMatchObject({ extensions: { code: 'UNAUTHENTICATED' } });
    await expect(f.service.gameView('r1', { documentId: 'outsider' })).rejects.toMatchObject({ extensions: { code: 'ROOM_UNAVAILABLE' } });
    expect(f.messages).not.toHaveBeenCalled();
  });

  it('uses sheet identity, preserves zero HP/config and strips raw relations', async () => {
    const f = fixture();
    const view = await f.service.gameView('r1', f.user);
    expect(view.myself.characterSheetId).toBe('s1');
    expect(view.myself.currentHp).toBe(0);
    expect(view.world.config).toMatchObject({ chunkSize: 16, seaLevel: 0 });
    expect(view.visibleEntities.map((entry) => entry.characterSheetId)).toEqual(['s1']);
    expect(view).not.toHaveProperty('room');
    expect(view).not.toHaveProperty('entity_sheets');
    expect(view).not.toHaveProperty('turnData');
    expect(view.messages.nodes.map((entry) => entry.content)).toEqual(['public', 'yours']);
    expect(f.messages.mock.calls[0][0].filters.$and).toContainEqual({
      $or: [{ recipient: { $null: true } }, { recipient: { documentId: 'u1' } }],
    });
  });

  it('fails closed on missing viewer position and visibility failure', async () => {
    const f = fixture();
    f.sheet.position = null;
    expect((await f.service.gameView('r1', f.user)).visibleEntities).toHaveLength(1);
    f.sheet.position = { x: 0, y: 0, z: 0 };
    f.strapi.service = () => ({ cullEntities: () => { throw new Error('offline'); } });
    expect((await f.service.gameView('r1', f.user)).visibleEntities).toHaveLength(1);
  });

  it('uses one captured canonical state for visible mechanics, and fails closed on terrain errors', async () => {
    const f = fixture(); f.room.phase = 'gameplay';
    f.room.turnData = {version:1, state:{entities:[{id:'s1',position:{x:0,y:0,z:0},hp:3,maxHp:10,armorClass:12}]},submissions:[]} as any;
    f.sheet.currentHp = 9; f.sheet.position = {x:100,y:100,z:1};
    const projected = await f.service.gameView('r1',f.user);
    expect(projected.myself).toMatchObject({currentHp:3,ac:12,position:{x:0,y:0,z:0}});
    expect(projected.visibleEntities.map(e=>e.characterSheetId)).toEqual(['s1']);
    terrain.mockRejectedValueOnce(new Error('overlay unavailable'));
    const unavailable = await f.service.gameView('r1',f.user);
    expect(unavailable.terrain).toBeNull(); expect(unavailable.capabilities.canSubmit).toBe(false);
  });

  it('rejects a selected sheet owned by another member', async () => {
    const f = fixture(); f.sheet.owner = { documentId: 'u2' };
    await expect(f.service.gameView('r1', f.user)).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } });
  });

  it('validates cursor room scope and page bounds', async () => {
    const f = fixture();
    const cursor = Buffer.from(JSON.stringify({ roomId: 'other', timestamp: '3', id: 'm1' })).toString('base64url');
    await expect(f.service.messages('r1', f.user, cursor)).rejects.toMatchObject({ extensions: { code: 'INVALID_INPUT' } });
    await expect(f.service.messages('r1', f.user, undefined, 101)).rejects.toMatchObject({ extensions: { code: 'INVALID_INPUT' } });
  });
  it('projects interrupted proposals privately without rewriting persisted status', async () => {
    const f = fixture();
    f.strapi.service = (() => ({ cullEntities: () => [], submitAction: () => {}, resolveTurn: () => {} })) as any;
    f.room.phase = 'gameplay';
    const pending = { userId: 'u1', submissionId: 'pending', kind: 'intent', text: 'my intent', status: 'proposing', proposalExpiresAt: Date.now() + 120000 };
    (f.room as any).turnData = { version: 1, state: {entities:[{id:'s1',position:{x:0,y:0,z:0},hp:0,maxHp:10,armorClass:10}]}, turnNumber: 1, lastResolvedNumber: 0, status: 'collecting', requiredUserIds: ['u1', 'u2'], submissions: [pending,
      { userId: 'u2', submissionId: 'other', kind: 'intent', text: 'secret-other', feedback: 'private-other', status: 'needs_revision' }] };
    const inFlight = await f.service.gameView('r1', f.user);
    expect(inFlight.mySubmission.status).toBe('proposing');
    expect(inFlight.capabilities.canSubmit).toBe(false);
    expect(JSON.stringify(inFlight)).not.toContain('secret-other');
    expect(JSON.stringify(inFlight)).not.toContain('private-other');
    pending.proposalExpiresAt = Date.now() - 1;
    const expired = await f.service.gameView('r1', f.user);
    expect(expired.mySubmission).toMatchObject({ status: 'needs_revision', text: 'my intent' });
    expect(expired.capabilities.canSubmit).toBe(true);
    expect(pending.status).toBe('proposing');
    expect(expired.capabilities.canResolve).toBe(false);
  });

});
