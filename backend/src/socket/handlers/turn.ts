import type { Server, Socket } from 'socket.io';
import type { Language } from '@/types/index';
import { getRoom, getPlayers, getMessages, getCreatures, updatePlayerAction, addMessage } from '@/services/firestore';
import { invokeGameplayGraph } from '@/graph/gameplay-graph';
import { logger } from '@/utils/logger';
import { toolLogger } from '@/utils/tool-logger';
import { processingRooms, resolveWorldSettings } from './utils';

export async function handleProcessTurn(
  io: Server,
  socket: Socket,
  userId: string,
  data: { roomId: string; language?: Language }
) {
  try {
    const { roomId } = data;

    if (processingRooms.has(roomId)) {
      logger.warn(`Turn already processing for room ${roomId}, ignoring duplicate request`);
      return;
    }

    const room = await getRoom(roomId);

    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    if (room.ownerId !== userId) {
      socket.emit('error', { message: 'Only room owner can process turns' });
      return;
    }

    processingRooms.add(roomId);

    io.to(roomId).emit('turn:processing');

    const [players, messages, creatures] = await Promise.all([
      getPlayers(roomId),
      getMessages(roomId),
      getCreatures(roomId),
    ]);
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

    const resultMessages = result.messages as Array<{
      id: string;
      sender: string;
      text: string;
      timestamp: number;
      recipientId?: string;
    }>;
    const currentMessages = currentState.messages as Array<{
      id: string;
      sender: string;
      text: string;
      timestamp: number;
      recipientId?: string;
    }>;
    const newMessagesCount = resultMessages.length - currentMessages.length;
    const newMessages = resultMessages.slice(-newMessagesCount);

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

    logger.info(`Turn processed via graph in room ${roomId}`);

    processingRooms.delete(roomId);
  } catch (error) {
    logger.error('Error processing turn:', error);
    io.to(data.roomId).emit('error', { message: 'Failed to process turn' });

    processingRooms.delete(data.roomId);
  }
}
