/** Authenticated, allowlisted room projections. No raw relation is returned. */
import { GraphQLError } from 'graphql';
import { projectRoomTerrain } from './room-terrain';
import { normalizeWorldConfig } from '@/api/world/utils/world-config';

export const ROOM_UID = 'api::room.room';
export const OPERATION_UID = 'api::game-operation.game-operation';
export const PLAYER_BLUEPRINT_TYPES = ['Player', 'player', 'Character', 'character'];
export const WORLD_FIELDS = [
  'seed', 'chunkSize', 'detail', 'fogRadius', 'globalScale', 'seaLevel', 'elevationScale',
  'roughness', 'moistureScale', 'temperatureOffset', 'roadDensity', 'structureChance',
  'structureSpacing', 'structureSizeAvg', 'worldSize', 'worldType',
] as const;

export function gameError(code: string, message: string): never {
  throw new GraphQLError(message, { extensions: { code } });
}

export function requireId(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 200) {
    gameError('INVALID_INPUT', `Invalid ${field}.`);
  }
  return value;
}

export function documentId(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'documentId' in value && typeof value.documentId === 'string') {
    return value.documentId;
  }
  return null;
}

export function requireUser(user: unknown): string {
  const id = documentId(user);
  if (!id) gameError('UNAUTHENTICATED', 'Authentication required.');
  return id;
}

export const ROOM_POPULATE = {
  owner: true,
  world: true,
  dmSettings: true,
  players: { populate: { user: true, character: true, characterSheet: { populate: ['owner', 'room', 'entity', 'position', 'stats'] } } },
  entity_sheets: { populate: ['owner', 'room', 'entity', 'position', 'stats'] },
};

export async function requireRoom(strapi, roomId: string, user: unknown, ownerOnly = false) {
  const userId = requireUser(user);
  requireId(roomId, 'roomId');
  const room = await strapi.documents(ROOM_UID).findOne({ documentId: roomId, populate: ROOM_POPULATE });
  const player = room?.players?.find((entry) => documentId(entry.user) === userId);
  if (!room || !player) gameError('ROOM_UNAVAILABLE', 'Room unavailable.');
  if (ownerOnly && documentId(room.owner) !== userId) gameError('FORBIDDEN', 'Room owner required.');
  return { room, player, userId };
}

export function requireLobby(room) {
  if (room.phase !== 'lobby') gameError('INVALID_PHASE', 'This operation requires the lobby.');
}

/** Use the world-owned normalizer rather than a parallel set of terrain defaults. */
export function worldConfiguration(world) {
  return { ...normalizeWorldConfig(world), worldSize: world.worldSize ?? 'small', worldType: world.worldType ?? 'terra' };
}

function position(value) {
  return value && [value.x, value.y, value.z].every(Number.isFinite) && Number.isInteger(value.z)
    ? { x: value.x, y: value.y, z: value.z } : null;
}

function entityView(sheet, own = false) {
  return {
    characterSheetId: sheet.documentId,
    blueprintId: documentId(sheet.entity),
    name: sheet.name || 'Entity',
    type: sheet.type || 'npc',
    currentHp: sheet.currentHp ?? 0,
    maxHp: sheet.maxHp ?? 0,
    ac: sheet.ac ?? 10,
    position: position(sheet.position),
    stats: own && sheet.stats ? Object.fromEntries(
      ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']
        .map((key) => [key, sheet.stats[key] ?? 10])
    ) : null,
  };
}

export default ({ strapi }) => ({
  async messages(roomId: string, user: unknown, before?: string, last = 50) {
    const { userId } = await requireRoom(strapi, roomId, user);
    if (!Number.isInteger(last) || last < 1 || last > 100) gameError('INVALID_INPUT', 'Message page size must be 1–100.');
    const clauses: Record<string, unknown>[] = [
      { room: { documentId: roomId } },
      { $or: [{ recipient: { $null: true } }, { recipient: { documentId: userId } }] },
    ];
    if (before) {
      let cursor;
      try { cursor = JSON.parse(Buffer.from(before, 'base64url').toString()); } catch { gameError('INVALID_INPUT', 'Invalid message cursor.'); }
      if (!cursor || !/^\d+$/.test(cursor.timestamp) || typeof cursor.id !== 'string' || cursor.roomId !== roomId) {
        gameError('INVALID_INPUT', 'Invalid message cursor.');
      }
      clauses.push({ $or: [
        { timestamp: { $lt: cursor.timestamp } },
        { timestamp: cursor.timestamp, documentId: { $lt: cursor.id } },
      ] });
    }
    const rows = await strapi.documents('api::message.message').findMany({
      filters: { $and: clauses }, sort: ['timestamp:desc', 'documentId:desc'], limit: last + 1,
      populate: ['recipient', 'turn'],
    });
    // Defense in depth for custom persistence adapters and accidentally overpopulated data.
    const allowed = rows.filter((row) => !documentId(row.recipient) || documentId(row.recipient) === userId);
    const page = allowed.slice(0, last).reverse();
    const oldest = page[0];
    return {
      nodes: page.map((row) => ({
        messageId: row.documentId, turnNumber: row.turn?.turnNumber ?? null,
        audience: documentId(row.recipient) ? 'self' : 'room', content: row.content,
        senderName: row.senderName || 'System', senderType: row.senderType || 'system',
        timestamp: new Date(Number(row.timestamp ?? 0)).toISOString(),
      })),
      pageInfo: {
        hasPreviousPage: allowed.length > last,
        startCursor: oldest ? Buffer.from(JSON.stringify({ roomId, timestamp: String(oldest.timestamp ?? 0), id: oldest.documentId })).toString('base64url') : null,
      },
    };
  },

  async gameView(roomId: string, user: unknown) {
    const { room, player, userId } = await requireRoom(strapi, roomId, user);
    if (!room.world?.documentId) gameError('LEGACY_STATE_UNSUPPORTED', 'Room world configuration is missing.');
    const sheetId = documentId(player.characterSheet);
    const sheet = sheetId ? await strapi.documents('api::entity-sheet.entity-sheet').findOne({
      documentId: sheetId, populate: ['owner', 'room', 'entity', 'position', 'stats'],
    }) : null;
    if (sheet && (documentId(sheet.room) !== roomId || documentId(sheet.owner) !== userId)) {
      gameError('FORBIDDEN', 'Character ownership is inconsistent.');
    }
    const runtime = room.turnData?.version === 1 ? room.turnData : null;
    const active = ['gameplay', 'combat'].includes(room.phase) && runtime;
    const mechanics = active ? runtime.state?.entities : null;
    if (active && !Array.isArray(mechanics)) gameError('LEGACY_STATE_UNSUPPORTED', 'Canonical room state is unavailable.');
    const projectedSheet = (entry) => {
      if (!active) return entry;
      const state = mechanics.find((entity) => entity.id === entry.documentId);
      return state ? { ...entry, position: state.position, currentHp: state.hp, maxHp: state.maxHp, ac: state.armorClass } : null;
    };
    const ownSheet = sheet ? projectedSheet(sheet) : null;
    const myself = ownSheet ? entityView(ownSheet, true) : null;
    let terrain: Awaited<ReturnType<typeof projectRoomTerrain>> = null;
    if (active && myself?.position) {
      try { terrain = await projectRoomTerrain(strapi, room.world, myself.position); } catch { terrain = null; }
    }
    const visibleTiles = new Set(terrain?.tiles.map((tile) => `${tile.x},${tile.y},${tile.z}`) ?? []);
    const visible = (room.entity_sheets || []).flatMap((entry) => {
      if (entry.documentId === sheetId) return [];
      const candidate = projectedSheet(entry), pos = position(candidate?.position);
      return candidate && pos && visibleTiles.has(`${pos.x},${pos.y},${pos.z}`) ? [entityView(candidate)] : [];
    });
    if (myself) visible.unshift(myself);
    const submissions = active ? runtime.submissions || [] : [];
    const ownSubmission = submissions.find((entry) => entry.userId === userId);
    const proposalExpired = ownSubmission?.status === 'proposing' && ownSubmission.proposalExpiresAt <= Date.now();
    const ownStatus = proposalExpired ? 'needs_revision' : ownSubmission?.status;
    const players = room.players || [];
    const submittedCount = submissions.filter((entry) => entry.status === 'submitted').length;
    const pipeline = strapi.service('api::game.turn-pipeline');
    const allReady = players.length >= 2 && players.every((entry) => entry.isReady && documentId(entry.characterSheet) &&
      documentId(entry.characterSheet.owner) === documentId(entry.user) && documentId(entry.characterSheet.room) === room.documentId);
    return {
      roomId: room.documentId, code: room.code || room.roomId, phase: room.phase,
      revision: room.revision ?? 0, ownerUserId: documentId(room.owner),
      world: {
        worldId: room.world.documentId, language: room.world.language || 'en',
        description: room.world.description || '', config: worldConfiguration(room.world),
      },
      players: players.map((entry) => ({
        userId: documentId(entry.user), name: entry.name || 'Player',
        characterSheetId: documentId(entry.characterSheet), characterName: entry.characterSheet?.name || null,
        ready: !!entry.isReady,
        submitted: submissions.some((action) => action.userId === documentId(entry.user) && action.status === 'submitted'),
      })),
      myself,
      turn: active ? {
        number: runtime.turnNumber, status: runtime.status, lastResolvedNumber: runtime.lastResolvedNumber,
        submittedCount, requiredCount: runtime.requiredUserIds?.length ?? players.length,
      } : null,
      mySubmission: ownSubmission ? {
        submissionId: ownSubmission.submissionId, turnNumber: runtime.turnNumber,
        kind: ownSubmission.kind, text: ownSubmission.text ?? null, status: ownStatus,
        feedback: proposalExpired ? 'Proposal interrupted or expired. Your intent is saved; submit again.' : ownSubmission.feedback ?? null,
      } : null,
      visibleEntities: visible, terrain,
      messages: await this.messages(roomId, user),
      capabilities: {
        canStart: typeof pipeline?.startGame === 'function' && room.phase === 'lobby' && documentId(room.owner) === userId && allReady,
        canSubmit: typeof pipeline?.submitAction === 'function' && !!terrain && !!active && runtime.status === 'collecting' && !!sheet && (!ownSubmission || ownStatus === 'needs_revision'),
        canResolve: typeof pipeline?.resolveTurn === 'function' && !!terrain && !!active && runtime.status === 'collecting' && documentId(room.owner) === userId &&
          runtime.requiredUserIds?.length > 0 && runtime.requiredUserIds.every((id) => submissions.some((entry) => entry.userId === id && entry.status === 'submitted')),
      },
    };
  },

  async myRooms(user: unknown) {
    const userId = requireUser(user);
    const rooms = await strapi.documents(ROOM_UID).findMany({
      filters: { players: { user: { documentId: userId } } }, populate: ['owner', 'players.user'],
      sort: 'updatedAt:desc', limit: 100,
    });
    return rooms.filter((room) => room.players?.some((entry) => documentId(entry.user) === userId)).map((room) => ({
      roomId: room.documentId, code: room.code || room.roomId, phase: room.phase, ownerUserId: documentId(room.owner),
    }));
  },

  async characterBlueprints(user: unknown) {
    requireUser(user);
    const rows = await strapi.documents('api::entity.entity').findMany({
      filters: { type: { $in: PLAYER_BLUEPRINT_TYPES } }, sort: ['name:asc', 'documentId:asc'], limit: 100,
    });
    return rows.filter((row) => PLAYER_BLUEPRINT_TYPES.includes(row.type)).map((row) => ({
      blueprintId: row.documentId, name: row.name, description: row.description || '',
    }));
  },
});
