import { factories } from '@strapi/strapi';
import { generateRoomCode } from '../../../utils/room-code';
import { v4 as uuidv4 } from 'uuid';

export default factories.createCoreController('api::room.room', ({ strapi }) => ({
  async create(ctx) {
    const { user } = ctx.state;
    // Ensure user is authenticated
    if (!user) {
      return ctx.unauthorized('You must be logged in to create a room');
    }
    // const user = { id: 1, documentId: 'mock-doc-id', username: 'MockUser' };

    const { settings, structures } = ctx.request.body;

    // OLD SEQUENCE LOGIC REMOVED
    // We now use the Room ID itself to seed the generator.
    // Flow:
    // 1. Create Room with temporary unique code (UUID)
    // 2. Derive real code from room.id
    // 3. Update room with real code

    // Owner Player Object
    const ownerPlayer = {
      id: user.id || user.documentId,
      userId: user.id || user.documentId,
      name: user.username || 'Room Owner',
      character: null,
      action: null,
      isReady: false,
      isOnline: true,
      joinedAt: Date.now(),
    };

    const tempCode = uuidv4();

    const roomData = {
      roomId: ctx.request.body.roomId || tempCode, // temporary
      code: tempCode, // temporary
      owner: user.documentId,
      phase: 'lobby',
      worldDescription: '',
      isActive: true,
      settings: settings || {},
      structures: structures || [],
      players: [ownerPlayer],
      ...ctx.request.body,
    };

    // 1. Create with temp code
    const newRoom = await strapi.entityService.create('api::room.room', {
      data: roomData,
    });

    try {
      // 2. Derive real code from ID
      // strapi v5 might use documentId, but we likely want the numeric ID for the seed if available,
      // or we can just hash the documentId.
      // Based on user request "postgress room itself", assuming numeric incremental ID is available or appropriate.
      // Strapi v4/v5 usually exposes .id as number for SQL.

      const seed = newRoom.id;

      // If seed is a string (uuid), we might need to hash it to a bigint or use it differently.
      // generateRoomCode expects BigInt.
      let codeStr: string;

      if (typeof seed === 'number') {
        codeStr = generateRoomCode(BigInt(seed));
      } else {
        // If ID is not a number (e.g. string UUID in v5 default), we fallback or need a hash.
        // For now assuming number as per typical Postgres ID context.
        // If it is a string ID, we can parse it if it's numeric, or we need another strategy.
        // Let's assume it works as number for now.
        codeStr = generateRoomCode(BigInt(seed));
      }

      // 3. Update with real code
      const updatedRoom = await strapi.entityService.update('api::room.room', newRoom.documentId || newRoom.id, {
        data: {
          code: codeStr,
          roomId: codeStr, // We often use code as roomId
        },
      });

      return { success: true, data: updatedRoom };
    } catch (error) {
      console.error('Failed to generate permanent room code', error);
      // Fallback or cleanup. For now, return what we have (with UUID) or error.
      // It's better to fail since the code format specific is expected.
      return ctx.badRequest('Failed to generate room code');
    }
  },

  async join(ctx) {
    const { id } = ctx.params;
    const { user } = ctx.state;

    if (!user) {
      return ctx.unauthorized('You must be logged in to join a room');
    }

    // Find room by roomId or code
    const room = await strapi.db.query('api::room.room').findOne({
      where: {
        $or: [{ roomId: id }, { code: id }],
      },
    });

    if (!room) {
      return ctx.notFound('Room not found');
    }

    const players = room.players || [];
    const isAlreadyJoined = players.some((p) => p.userId === user.id || p.userId === user.documentId);

    if (isAlreadyJoined) {
      return { success: true, data: room, message: 'Already joined' };
    }

    const newPlayer = {
      id: user.id || user.documentId,
      userId: user.id || user.documentId,
      name: user.username || 'Player',
      character: null,
      action: null,
      isReady: false,
      isOnline: true,
      joinedAt: Date.now(),
    };

    const updatedPlayers = [...players, newPlayer];

    const updatedRoom = await strapi.entityService.update('api::room.room', room.documentId || room.id, {
      data: {
        players: updatedPlayers,
      },
    });

    return { success: true, data: updatedRoom };
  },

  /**
   * Submit an Action to the pending turn
   */
  async submitAction(ctx) {
    const { id } = ctx.params;
    const { user } = ctx.state;
    const { action } = ctx.request.body;

    if (!user) return ctx.unauthorized('Must be logged in');

    try {
      const turnService = strapi.service('api::room.turn-service');
      const updatedTurnData = await turnService.addAction(id, user.id || user.documentId, action);
      return { success: true, data: updatedTurnData };
    } catch (err) {
      return ctx.badRequest(err.message);
    }
  },

  /**
   * Trigger the turn resolution
   */
  async triggerTurn(ctx) {
    const { id } = ctx.params;
    const { user } = ctx.state;

    // TODO: Verify user is owner or authorized to trigger
    if (!user) return ctx.unauthorized('Must be logged in');

    try {
      const turnService = strapi.service('api::room.turn-service');
      const result = await turnService.processTurn(id);
      return { success: true, data: result };
    } catch (err) {
      return ctx.badRequest(err.message);
    }
  },
}));
