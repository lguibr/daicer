import type { Server, Socket } from 'socket.io';
import { getRoom, getPlayers, setPlayerReady, areAllPlayersReady, updateRoomWorld } from '@/services/firestore';
import { logger } from '@/utils/logger';
import { GamePhase } from '@/types/index';

export async function handlePlayerReady(
  io: Server,
  socket: Socket,
  userId: string,
  data: { roomId: string; isReady: boolean }
) {
  try {
    const { roomId, isReady } = data;

    logger.info(`🎯 handlePlayerReady called: userId=${userId}, roomId=${roomId}, isReady=${isReady}`);

    await setPlayerReady(roomId, userId, isReady);

    logger.info(`✅ Player ready status updated in DB`);

    io.to(roomId).emit('player:ready_updated', { userId, isReady });

    logger.info(`📡 Emitted player:ready_updated to room ${roomId}`);

    const allReady = await areAllPlayersReady(roomId);
    if (allReady) {
      io.to(roomId).emit('room:all_ready');

      const room = await getRoom(roomId);
      if (!room) return;

      const players = await getPlayers(roomId);

      // Verify all players have characters
      const allHaveCharacters = players.every((p) => p.character != null);
      if (!allHaveCharacters) {
        logger.warn(`Not all players have characters in room ${roomId}`);
        return;
      }

      // Transition room to GAMEPLAY phase (don't update worldDescription, just phase)
      await updateRoomWorld(
        roomId,
        {
          worldDescription: room.worldDescription || 'Adventure begins...',
          worldHistory: room.worldHistory,
          structures: room.structures,
          roads: room.roads,
          worldConditions: room.worldConditions,
        },
        GamePhase.GAMEPLAY
      );
      io.to(roomId).emit('room:phase_changed', { phase: GamePhase.GAMEPLAY });

      logger.info(`Room ${roomId} transitioning to GAMEPLAY - all ${players.length} players ready`);
    }

    logger.info(`Player ${userId} ready: ${isReady} in room ${roomId}`);
  } catch (error) {
    logger.error('Error updating ready status:', error);
    socket.emit('error', { message: 'Failed to update ready status' });
  }
}
