/** Lobby transitions are atomic; request receipts never store private viewer snapshots. */
import { createHash, randomUUID } from 'node:crypto';
import {
  ROOM_UID, OPERATION_UID, WORLD_FIELDS, documentId, gameError, requireId, requireLobby,
  requireRoom, requireUser,
} from './room-access';
import { normalizeWorldConfig } from '@/api/world/utils/world-config';

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

export function requestIdentity(operation: string, input, userId: string) {
  requireId(input.requestId, 'requestId');
  return {
    key: createHash('sha256').update(canonical([userId, operation, input.requestId])).digest('hex'),
    hash: createHash('sha256').update(canonical(input)).digest('hex'),
  };
}

/** Claim the room row before replacing its repeatable player components. */
export async function claimRoomRevision(strapi, room) {
  const where = room.revision == null
    ? { documentId: room.documentId, revision: { $null: true } }
    : { documentId: room.documentId, revision: room.revision };
  const result = await strapi.db.query(ROOM_UID).updateMany({
    where, data: { revision: (room.revision ?? 0) + 1 },
  });
  if (result.count !== 1) gameError('STATE_CONFLICT', 'Room changed; retry the same request.');
}

export function playerData(player) {
  return {
    ...(player.id ? { id: player.id } : {}), user: documentId(player.user),
    character: documentId(player.character), characterSheet: documentId(player.characterSheet),
    name: player.name, isReady: !!player.isReady, isOnline: !!player.isOnline,
    joinedAt: player.joinedAt, action: player.action ?? null,
  };
}

export default ({ strapi }) => ({
  async lobbyMutation(operation: string, input, user, mutate) {
    const userId = requireUser(user);
    const { key, hash } = requestIdentity(operation, input, userId);
    const records = strapi.documents(OPERATION_UID);
    const replay = async () => {
      const prior = await records.findFirst({ filters: { key } });
      if (!prior) return null;
      if (prior.requestHash !== hash) gameError('IDEMPOTENCY_CONFLICT', 'Request ID was already used with different input.');
      if (prior.status !== 'complete' || !prior.result?.roomId) gameError('STATE_CONFLICT', 'Request is already running.');
      // Fresh projection reauthorizes access, including when membership was revoked.
      return strapi.service('api::game.room-access').gameView(prior.result.roomId, user);
    };
    const prior = await replay();
    if (prior) return prior;
    let roomId: string;
    try {
      roomId = await strapi.db.transaction(async () => {
        const receipt = await records.create({ data: { key, requestHash: hash, status: 'running' } });
        const id = await mutate(userId);
        await records.update({ documentId: receipt.documentId, data: { status: 'complete', room: id, result: { roomId: id } } });
        return id;
      });
    } catch (error) {
      const completed = await replay();
      if (completed) return completed;
      throw error;
    }
    return strapi.service('api::game.room-access').gameView(roomId, user);
  },

  async createRoom(input, user) {
    requireUser(user);
    if (!input || !['en', 'en-US', 'pt-BR', 'es'].includes(input.language)) gameError('INVALID_INPUT', 'Unsupported language.');
    const config = input.worldConfig;
    if (!config || typeof config !== 'object') gameError('INVALID_INPUT', 'World configuration required.');
    requireId(config.seed, 'world seed');
    for (const [key, value] of Object.entries(config)) {
      if (!WORLD_FIELDS.includes(key as typeof WORLD_FIELDS[number])) gameError('INVALID_INPUT', 'Unknown world field.');
      if (!['seed', 'worldSize', 'worldType'].includes(key) && (typeof value !== 'number' || !Number.isFinite(value))) {
        gameError('INVALID_INPUT', `Invalid ${key}.`);
      }
    }
    if (config.chunkSize != null && (!Number.isInteger(config.chunkSize) || config.chunkSize < 1 || config.chunkSize > 64)) {
      gameError('INVALID_INPUT', 'Invalid chunk size.');
    }
    try { normalizeWorldConfig(config); } catch (error) { gameError('INVALID_INPUT', error.message); }
    return this.lobbyMutation('createRoom', input, user, async (userId) => {
      const code = randomUUID();
      const room = await strapi.documents(ROOM_UID).create({ data: {
        roomId: code, code, owner: userId, phase: 'lobby', revision: 0, isActive: true,
        players: [{ user: userId, name: user.username || 'Player', isReady: false, isOnline: true, joinedAt: new Date().toISOString() }],
      } });
      await strapi.documents('api::world.world').create({ data: { ...config, language: input.language, room: room.documentId } });
      await strapi.documents('api::dm-setting.dm-setting').create({ data: { room: room.documentId } });
      return room.documentId;
    });
  },

  async joinRoom(input, user) {
    const userId = requireUser(user);
    const code = requireId(input.code, 'code').trim();
    return this.lobbyMutation('joinRoom', { ...input, code }, user, async () => {
      const room = await strapi.documents(ROOM_UID).findFirst({
        filters: { code }, populate: ['players.user', 'players.character', 'players.characterSheet'],
      });
      if (!room) gameError('ROOM_UNAVAILABLE', 'Room unavailable.');
      if (room.players?.some((entry) => documentId(entry.user) === userId)) return room.documentId;
      requireLobby(room);
      await claimRoomRevision(strapi, room);
      await strapi.documents(ROOM_UID).update({ documentId: room.documentId, data: { players: [
        ...(room.players || []).map(playerData),
        { user: userId, name: user.username || 'Player', isReady: false, isOnline: true, joinedAt: new Date().toISOString() },
      ] } });
      return room.documentId;
    });
  },

  async selectCharacter(input, user) {
    requireId(input.blueprintId, 'blueprintId');
    return this.lobbyMutation('selectCharacter', input, user, async () => {
      const { room } = await requireRoom(strapi, input.roomId, user);
      requireLobby(room);
      await claimRoomRevision(strapi, room);
      await strapi.service('api::game.entity-lifecycle').onboardPlayer(input.roomId, { documentId: input.blueprintId }, user);
      return room.documentId;
    });
  },

  async setReady(input, user) {
    if (typeof input.ready !== 'boolean') gameError('INVALID_INPUT', 'Ready must be boolean.');
    return this.lobbyMutation('setReady', input, user, async () => {
      const { room, player, userId } = await requireRoom(strapi, input.roomId, user);
      requireLobby(room);
      if (input.ready) {
        const sheet = player.characterSheet;
        if (!documentId(sheet)) gameError('CHARACTER_REQUIRED', 'Select a character first.');
        if (documentId(sheet.owner) !== userId || documentId(sheet.room) !== room.documentId) {
          gameError('FORBIDDEN', 'Character ownership is inconsistent.');
        }
      }
      await claimRoomRevision(strapi, room);
      await strapi.documents(ROOM_UID).update({ documentId: room.documentId, data: {
        players: room.players.map((entry) => ({ ...playerData(entry),
          isReady: documentId(entry.user) === userId ? input.ready : !!entry.isReady,
        })),
      } });
      return room.documentId;
    });
  },
});
