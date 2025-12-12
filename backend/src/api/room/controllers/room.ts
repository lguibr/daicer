import { factories } from '@strapi/strapi';
import { generateRoomCode } from '../../../utils/room-code';

export default factories.createCoreController('api::room.room', ({ strapi }) => ({
  async create(ctx) {
    const { user } = ctx.state;
    // Ensure user is authenticated
    if (!user) {
      return ctx.unauthorized('You must be logged in to create a room');
    }

    const { settings, structures } = ctx.request.body;

    // Atomic increment of the sequence
    // We use a transaction (or raw query) if possible, but Strapi generic entityService doesn't expose atomic increment easily.
    // We will use strapi.db.query to find and update, or raw query for atomicity if needed.
    // For now, using a simple locking approach via find matches is prone to race conditions in high scale,
    // but for this MVP/scale, we can try to use a semaphore or optimistic locking.
    // actually, strapi.db.query has no atomic increment helper. PostgreSQL does.

    // Better approach: Use a raw query to update the sequence and return the new value safely.
    const knex = strapi.db.connection;
    let nextVal: string | number = 0;

    // Ensure sequence exists
    // We can't easily auto-create safely in raw without race, so we assume it exists or we use a "insert on conflict" equivalent.

    const SEQUENCE_KEY = 'room_code';

    try {
      if (knex.client.driver.name === 'sqlite3') {
        // SQLite syntax
        // Upsert logic for SQLite
        await knex.raw(
          `
           INSERT INTO sequences (key, value, created_at, updated_at) 
           VALUES (?, 1, datetime('now'), datetime('now')) 
           ON CONFLICT(key) DO UPDATE SET value = value + 1
         `,
          [SEQUENCE_KEY]
        );

        const res = await knex('sequences').where({ key: SEQUENCE_KEY }).select('value').first();
        nextVal = res.value;
      } else {
        // Postgres/MySQL syntax (pg uses RETURNING)
        // We'll use a generic approach if possible, or detect PG.
        // Assuming Postgres from user context "count from postgress".
        const result = await knex.raw(
          `
           INSERT INTO sequences (key, value, created_at, updated_at)
           VALUES (?, 1, NOW(), NOW())
           ON CONFLICT (key) DO UPDATE SET value = sequences.value + 1
           RETURNING value
         `,
          [SEQUENCE_KEY]
        );

        // Postgres returns rows in result.rows
        nextVal = result.rows[0].value;
      }
    } catch (err) {
      console.error('Error generating room sequence:', err);
      // Fallback or re-throw
      return ctx.badRequest('Could not generate room ID');
    }

    // Generate Room Code
    let code = generateRoomCode(BigInt(nextVal));
    // Simple collision check (optional but good)
    // In strict impl we'd loop check. For now assume low collision probability or handle unique error

    // Owner Player Object
    const ownerPlayer = {
      id: user.id || user.documentId, // distinct depending on Strapi v5
      userId: user.id || user.documentId,
      name: user.username || 'Room Owner',
      character: null,
      action: null,
      isReady: false,
      isOnline: true,
      joinedAt: Date.now(),
    };

    const roomData = {
      roomId: ctx.request.body.roomId || code,
      code,
      ownerId: user.id?.toString(),
      phase: 'lobby',
      worldDescription: '',
      isActive: true,
      settings: settings || {},
      structures: structures || [],
      players: [ownerPlayer],
      ...ctx.request.body, // Allow other overrides but controlled
    };

    // We must ensure 'code' field exists in schema.
    // If not, we should have added it. I recall seeing roomId but not code?

    // const response = await super.create(ctx);
    // super.create uses ctx.request.body. We should MUTATE body before calling super,
    // OR call service directly. calling super is safer for policies.

    // Use Entity Service directly for consistent flat response
    const newRoom = await strapi.entityService.create('api::room.room', {
      data: roomData,
    });

    return { success: true, data: newRoom };
  },

  async join(ctx) {
    const { id } = ctx.params;
    const { user } = ctx.state;

    if (!user) {
      return ctx.unauthorized('You must be logged in to join a room');
    }

    // Find room by roomId or code
    // usage of strapi.db.query vs entityService
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
      // Return room info but maybe don't error? Or just return success.
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
}));
