import type { Server, Socket } from 'socket.io';
import { getRoom, getPlayers, getMessages, getCreatures, updatePlayerAction, addMessage } from '@/services/firestore';
import { invokeGameplayGraph } from '@/graph/gameplay-graph';
import { logger } from '@/utils/logger';
import { toolLogger } from '@/utils/tool-logger';
import { processingRooms, resolveWorldSettings } from './utils';

export async function handlePlayerAction(
  io: Server,
  socket: Socket,
  userId: string,
  data: { roomId: string; action: string }
) {
  try {
    const { roomId, action } = data;

    await updatePlayerAction(roomId, userId, action);

    io.to(roomId).emit('room:updated', {
      type: 'player_action',
      userId,
      action,
    });

    logger.info(`Player ${userId} submitted action in room ${roomId}`);

    const players = await getPlayers(roomId);
    const allPlayersHaveActions =
      players.length > 0 && players.every((p) => typeof p.action === 'string' && p.action.trim().length > 0);

    if (allPlayersHaveActions) {
      if (processingRooms.has(roomId)) {
        logger.warn(`Turn processing already in progress for room ${roomId}, skipping auto-run`);
        return;
      }

      processingRooms.add(roomId);

      try {
        const room = await getRoom(roomId);
        if (!room) {
          return;
        }

        io.to(roomId).emit('turn:processing');

        const [messages, creatures] = await Promise.all([getMessages(roomId), getCreatures(roomId)]);
        const normalizedSettings = resolveWorldSettings(room.settings);

        const currentState = {
          roomId: room.id,
          ownerId: room.ownerId,
          code: room.code,
          settings: normalizedSettings,
          worldDescription: room.worldDescription,
          players,
          messages,
          creatures,
          combatState: null,
          waitingForAction: false,
          createdAt: room.createdAt,
          updatedAt: Date.now(),
        };

        const result = await invokeGameplayGraph(currentState);

        const resultMessagesRaw = result.messages as
          | Array<{
              id: string;
              sender: string;
              text: string;
              timestamp: number;
              recipientId?: string;
            }>
          | undefined;
        const resultMessages = Array.isArray(resultMessagesRaw) ? resultMessagesRaw : [];
        const newMessagesCount = Math.max(resultMessages.length - messages.length, 0);
        const newMessages = newMessagesCount > 0 ? resultMessages.slice(-newMessagesCount) : [];

        for (const msg of newMessages) {
          if (msg.recipientId) {
            io.to(msg.recipientId).emit('message:new', msg);
          } else {
            io.to(roomId).emit('message:new', msg);
          }

          await addMessage(roomId, msg);
        }

        for (const player of players) {
          await updatePlayerAction(roomId, player.id, null);
          io.to(roomId).emit('room:updated', {
            type: 'player_action',
            userId: player.userId,
            action: null,
          });
        }

        const toolCalls = toolLogger.getAndClearToolCalls(roomId);
        if (toolCalls.length > 0) {
          io.to(roomId).emit('tool:calls', toolCalls);
        }

        io.to(roomId).emit('turn:complete');

        logger.info(`Turn auto-processed in room ${roomId} after all players submitted actions`);
      } finally {
        processingRooms.delete(roomId);
      }
    }
  } catch (error) {
    logger.error('Error updating player action:', error);
    socket.emit('error', { message: 'Failed to submit action' });
  }
}
