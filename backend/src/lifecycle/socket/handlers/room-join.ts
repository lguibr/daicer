import { StrapiWithServer, RoomJoinPayload } from '../types';

export const handleRoomJoin =
  (strapi: StrapiWithServer) =>
  async (socket: any, { roomId, userId }: RoomJoinPayload) => {
    try {
      strapi.log.info(`Socket ${socket.id} joining room ${roomId} as user ${userId}`);
      socket.join(roomId);
      if (userId) {
        socket.join(`user:${userId}`);
      }

      const rooms = await strapi.documents('api::room.room').findMany({
        filters: {
          $or: [{ roomId: roomId }, { code: roomId }, { documentId: roomId }],
        },
        populate: [
          'players',
          'players.character',
          'players.character.baseStats',
          'players.character.race',
          'players.character.class',
          'messages',
        ],
      });

      if (!rooms || rooms.length === 0) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const room = rooms[0];
      const rawMessages = room.messages || [];
      rawMessages.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

      const mappedMessages = rawMessages.map((msg) => ({
        id: msg.documentId,
        content: msg.content,
        text: msg.content,
        sender: msg.senderName,
        senderName: msg.senderName,
        senderType: msg.senderType,
        timestamp: Number(msg.timestamp),
        type: msg.senderType === 'dm' ? 'narration' : 'chat',
      }));

      const gameState = {
        room: {
          id: room.documentId,
          roomId: room.roomId,
          name: (room.settings as any)?.name || 'Adventure',
          phase: room.phase,
          worldDescription: room.worldDescription,
        },
        players: room.players,
        messages: mappedMessages,
        creatures: (room as any).creatures || [],
        isProcessing: false,
      };

      socket.emit('gameState', gameState);
    } catch (error) {
      strapi.log.error('Error in room:join socket handler:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  };
