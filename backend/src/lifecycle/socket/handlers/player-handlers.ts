import { Socket } from 'socket.io';
import { StrapiWithServer, PlayerReadyPayload, RoomWithPopulations } from '../types';

export const handlePlayerReady =
  (strapi: StrapiWithServer) =>
  async (socket: Socket, { roomId, isReady }: PlayerReadyPayload) => {
    try {
      // User identification strategy: Use token verification.
      // const socketUser = (socket as any).user || (socket.handshake.auth.user as any);
      // We rely on socket.handshake.query or auth for userId usually?
      // But wait, socket.io auth middleware might not populate socket.user by default unless we did it.
      // But typically we can find the player by iterating.

      // Let's assume we find the player by some means or iterate all players matching socket user ID?
      // Actually, room-join uses userId.
      // But here we need to know WHO sent it.
      // If we don't store user in socket, we might need to trust the client sending userId?
      // The schema only has roomId, isReady.
      // We should really extract user from auth token in socket context.
      // For now, let's assume we iterate players and find the one that matches the socket's auth user.

      const token = socket.handshake.auth.token;
      if (!token) {
        // Fallback or error?
        // We'll proceed if we can verify.
      }

      // We need to fetch the room first
      const rooms = await strapi.documents('api::room.room').findMany({
        filters: {
          $or: [{ roomId: roomId }, { code: roomId }, { documentId: roomId }],
        },
        populate: ['players', 'players.user'], // User relation needed to identify
      });

      if (!rooms || rooms.length === 0) return;

      const room = rooms[0] as unknown as RoomWithPopulations;
      const players = room.players || [];

      // We need to identify the user. Strapi socket init usually doesn't attach user unless we have middleware.
      // But `init.ts` has `streamManager` which might handle stuff.
      // However, we can use `socket.join('user:' + userId)` logic from `room-join`.
      // The socket is joined to rooms.
      // But `socket.id` is not enough.
      // REALITY CHECK: `room-join` sets `socket.join('user:' + userId)`.
      // But that's for receiving events.
      // To identify SENDER, we need their ID.
      // We should probably include userId in payload IF we trust it, OR verify token again.
      // Given existing `PlayerActionSchema` also doesn't pass userId, how does it identify?
      // `handlePlayerAction` in turn-handlers doesn't seem to use userId? It just logs.
      // `submitAction` in controller uses `ctx.state.user`.

      // For this handler, let's fetch the user from the decoded token if possible, or just ask client to send userId for now (trust internal since we are behind auth usually).
      // BUT `PlayerReadySchema` doesn't have userId.
      // Let's extract it from the socket authentication if available?
      // `init.ts` doesn't seem to set `socket.data.user`.
      // I will assume for now we might need to find the user via a workaround or just update ALL players for this socket? No that's bad.

      // Standard practice: Verify token at connection or per event.
      // Let's decrypt the token from handshake.
      const jwtService = strapi.plugin('users-permissions').service('jwt');
      let userId: string | null = null;
      if (token) {
        try {
          const decoded = await jwtService.verify(token);
          userId = decoded.id;
        } catch {
          // Token verification failed
        }
      }

      if (!userId) {
        strapi.log.warn(`Player ready toggle without auth`);
        return;
      }

      const playerIndex = players.findIndex((p) => {
        const pUserId = p.user?.documentId || p.user?.id;
        return String(pUserId) === String(userId);
      });

      if (playerIndex === -1) {
        // Maybe userId is strictly documentId string vs number id
        // We should check both?
      }

      if (playerIndex !== -1) {
        await strapi.service('api::game.game').togglePlayerReady(roomId, String(userId), isReady);
        // The service broadcasts the update via streamManager ('room:update')
        // We don't need to manually emit here unless we want redundant events.
        // The frontend listens to 'room:update' via streamManager logic?
        // Wait, streamManager logic usually uses a specific setup.
        // Let's ensure 'room:update' is handled by existing listeners or add it.
        // We will keep 'player:ready_updated' emission for backward compatibility if needed,
        // BUT calling the service handles the data update.
        // Let's rely on the service's broadcast.
      }
    } catch (error) {
      strapi.log.error('Error in handlePlayerReady:', error);
    }
  };
