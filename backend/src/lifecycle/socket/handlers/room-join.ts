import { Socket } from 'socket.io'; // Import Socket type
import { StrapiWithServer, RoomJoinPayload } from '../types';

export const handleRoomJoin =
  (strapi: StrapiWithServer) =>
  async (socket: Socket, { roomId, userId }: RoomJoinPayload) => {
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
          'messages.recipient',
          'world', // Populate World Relation
          'character_sheets', // Populate Entities/Character Sheets
        ],
      });

      if (!rooms || rooms.length === 0) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const room = rooms[0];
      const rawMessages = room.messages || [];
      rawMessages.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

      const mappedMessages = rawMessages
        .filter((msg) => {
          // If no recipient, it's public.
          // If recipient matches userId, it's for me.
          // Note: userId passed to room-join is likely documentId based on previous context, or ID string.
          // Need to handle both potentially if types are loose.
          const msgRec = (msg as unknown as Record<string, any>).recipient;
          const recipientId = msgRec?.documentId || msgRec?.id;
          if (!recipientId) return true; // Public
          return String(recipientId) === String(userId);
        })
        .map((msg) => ({
          id: msg.documentId,
          content: msg.content,
          text: msg.content,
          sender: msg.senderName,
          senderName: msg.senderName,
          senderType: msg.senderType,
          timestamp: Number(msg.timestamp),
          type: msg.senderType === 'dm' ? 'narration' : 'chat',
          isPrivate: !!(msg as unknown as Record<string, any>).recipient,
        }));

      // Safe access for dynamic properties
      const world = room.world as Record<string, unknown> | null;

      // Map character_sheets to creatures (entities) for frontend
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawSheets = (room as any).character_sheets || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const creatures = rawSheets.map((cs: any) => ({
        id: cs.documentId,
        name: cs.name,
        type: cs.type,
        position: cs.position,
        stats: cs.stats,
        currentHp: cs.currentHp,
        maxHp: cs.maxHp,
      }));

      const gameState = {
        room: {
          id: room.documentId,
          roomId: room.roomId,
          name: world?.name || 'Adventure',
          phase: room.phase,
          worldDescription: world?.description || '',
        },
        players: room.players,
        messages: mappedMessages,
        creatures,
        isProcessing: false,
      };

      socket.emit('gameState', gameState);
    } catch (error) {
      strapi.log.error('Error in room:join socket handler:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  };
