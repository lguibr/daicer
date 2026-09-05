import { gameError, requireRoom, requireUser } from '@/api/game/services/room-access';
import { normalizeWorldConfig } from '@/api/world/utils/world-config';
import { maskedTerrainChunk } from '@/api/game/services/room-terrain';

function coordinate(value: unknown) {
  if (!Number.isSafeInteger(value) || Math.abs(value as number) > 100000) gameError('INVALID_INPUT', 'Invalid chunk coordinate.');
}

/** Authenticated wire adapters; actor identity always comes from the session. */
export function getGameResolvers(strapi) {
  const call = (service: string, method: string) => async (_parent, { input }, context) => {
    const user = context?.state?.user;
    requireUser(user);
    const target = strapi.service(`api::game.${service}`);
    if (typeof target?.[method] !== 'function') gameError('OPERATION_UNAVAILABLE', 'This lifecycle operation is not installed.');
    return target[method](input, user);
  };
  const unavailable = () => gameError('OPERATION_UNAVAILABLE', 'Raw game history is private. Use gameMessages.');
  return {
    Query: {
      gameView: (_parent, { roomId }, context) => strapi.service('api::game.room-access').gameView(roomId, context?.state?.user),
      myRooms: (_parent, _args, context) => strapi.service('api::game.room-access').myRooms(context?.state?.user),
      characterBlueprints: (_parent, _args, context) => strapi.service('api::game.room-access').characterBlueprints(context?.state?.user),
      gameMessages: (_parent, args, context) => strapi.service('api::game.room-access').messages(args.roomId, context?.state?.user, args.before, args.last ?? 50),
      getTimeFrame: unavailable,
      getAgentLogs: unavailable,
      getWorldTime: async (_parent, { roomId }, context) => {
        const { room } = await requireRoom(strapi, roomId, context?.state?.user);
        const ticks = room.turnData?.version === 1 ? room.turnData.lastResolvedNumber : 0;
        const minutes = ticks * 10, minute = minutes % 1440, hour = Math.floor(minute / 60);
        const isDay = minute >= 360 && minute < 1080;
        return { ticks, day: Math.floor(minutes / 1440) + 1, year: 1,
          timeOfDay: isDay ? 'Day' : 'Night', formatted: `${hour % 12 || 12}:${(minute % 60).toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`,
          isDay, lightLevel: isDay ? 0.2 + 0.8 * Math.cos(Math.abs(minute - 720) / 360 * Math.PI / 2) : 0.2 };
      },
      voxelPreview: async (_parent, { chunks, config }, context) => {
        requireUser(context?.state?.user);
        if (!Array.isArray(chunks) || chunks.length < 1 || chunks.length > 16) gameError('INVALID_INPUT', 'Preview requires 1–16 chunks.');
        for (const chunk of chunks) { coordinate(chunk?.x); coordinate(chunk?.y); }
        const normalized = normalizeWorldConfig(config);
        return Promise.all(chunks.map((chunk) => strapi.service('api::voxel-engine.voxel-engine').getPreviewChunk(chunk.x, chunk.y, normalized)));
      },
    },
    Mutation: {
      createRoom: call('room-lifecycle', 'createRoom'), joinRoom: call('room-lifecycle', 'joinRoom'),
      selectCharacter: call('room-lifecycle', 'selectCharacter'), setReady: call('room-lifecycle', 'setReady'),
      startGame: call('turn-pipeline', 'startGame'), submitAction: call('turn-pipeline', 'submitAction'),
      resolveTurn: call('turn-pipeline', 'resolveTurn'),
      generateTerrainChunk: async (_parent, args, context) => {
        const { room } = await requireRoom(strapi, args.roomId, context?.state?.user);
        coordinate(args.chunkX); coordinate(args.chunkY);
        if (!room.world?.documentId) gameError('LEGACY_STATE_UNSUPPORTED', 'Room world is missing.');
        const config = normalizeWorldConfig(room.world);
        if (args.chunkSize != null && args.chunkSize !== config.chunkSize) gameError('INVALID_INPUT', 'Chunk size belongs to the world.');
        const view = await strapi.service('api::game.room-access').gameView(args.roomId, context?.state?.user);
        return maskedTerrainChunk(view.terrain, args.chunkX, args.chunkY, room.world.documentId, config.chunkSize);
      },
    },
  };
}
