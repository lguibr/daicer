/**
 * Socket.io event handlers for real-time gameplay
 */

import type { Server, Socket } from 'socket.io';
import { getFirebaseAuth } from '@/config/firebase.js';
import {
  getRoom,
  getPlayers,
  getMessages,
  getCreatures,
  updatePlayerAction,
  addMessage,
  setPlayerReady,
  areAllPlayersReady,
  updateRoomWorld,
} from '@/services/firestore.js';
import { processTurn } from '@/services/game.js';
import { logger } from '@/utils/logger.js';
import type { Message } from '@/types/index.js';

/**
 * Socket authentication data
 */
interface SocketData {
  userId: string;
  roomId?: string;
}

/**
 * Verify Firebase token from socket handshake
 * @param socket - Socket connection
 * @returns User ID or null
 */
async function verifySocketAuth(socket: Socket): Promise<string | null> {
  try {
    const token = socket.handshake.auth.token as string;

    if (!token) {
      return null;
    }

    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    logger.error('Socket authentication failed:', error);
    return null;
  }
}

/**
 * Initialize Socket.io handlers
 * @param io - Socket.io server instance
 */
export function initializeSocketHandlers(io: Server): void {
  io.on('connection', async (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Authenticate socket
    const userId = await verifySocketAuth(socket);

    if (!userId) {
      logger.warn(`Unauthenticated socket: ${socket.id}`);
      socket.emit('error', { message: 'Authentication required' });
      socket.disconnect();
      return;
    }

    const socketData: SocketData = { userId };

    /**
     * Join a game room
     */
    socket.on('room:join', async (data: { roomId: string }) => {
      try {
        const { roomId } = data;
        const room = await getRoom(roomId);

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Join socket room
        await socket.join(roomId);
        socketData.roomId = roomId;

        logger.info(`User ${userId} joined room ${roomId}`);

        // Send full state to new joiner
        const [players, messages, creatures] = await Promise.all([
          getPlayers(roomId),
          getMessages(roomId),
          getCreatures(roomId),
        ]);

        socket.emit('game:state', {
          room,
          players,
          messages,
          creatures,
        });

        // Notify others
        socket.to(roomId).emit('player:joined', { userId });
      } catch (error) {
        logger.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    /**
     * Leave game room
     */
    socket.on('room:leave', async () => {
      if (!socketData.roomId) {
        return;
      }

      const { roomId } = socketData;
      await socket.leave(roomId);

      logger.info(`User ${userId} left room ${roomId}`);
      socket.to(roomId).emit('player:left', { userId });

      socketData.roomId = undefined;
    });

    /**
     * Set player ready status
     */
    socket.on('player:ready', async (data: { roomId: string; isReady: boolean }) => {
      try {
        const { roomId, isReady } = data;

        await setPlayerReady(roomId, userId, isReady);

        // Notify room
        io.to(roomId).emit('player:ready_updated', { userId, isReady });

        // Check if all players ready
        const allReady = await areAllPlayersReady(roomId);
        if (allReady) {
          io.to(roomId).emit('room:all_ready');
          
          // Auto-transition to gameplay
          await updateRoomWorld(roomId, (await getRoom(roomId))!.worldDescription, 'GAMEPLAY');
          io.to(roomId).emit('room:phase_changed', { phase: 'GAMEPLAY' });
        }

        logger.info(`Player ${userId} ready: ${isReady} in room ${roomId}`);
      } catch (error) {
        logger.error('Error updating ready status:', error);
        socket.emit('error', { message: 'Failed to update ready status' });
      }
    });

    /**
     * Submit player action
     */
    socket.on('player:action', async (data: { roomId: string; action: string }) => {
      try {
        const { roomId, action } = data;

        await updatePlayerAction(roomId, userId, action);

        // Notify room
        io.to(roomId).emit('room:updated', {
          type: 'player_action',
          userId,
          action,
        });

        logger.info(`Player ${userId} submitted action in room ${roomId}`);
      } catch (error) {
        logger.error('Error updating player action:', error);
        socket.emit('error', { message: 'Failed to submit action' });
      }
    });

    /**
     * Request turn processing
     */
    socket.on('turn:process', async (data: { roomId: string; language?: string }) => {
      try {
        const { roomId, language = 'en' } = data;
        const room = await getRoom(roomId);

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Only room owner can process turns
        if (room.ownerId !== userId) {
          socket.emit('error', { message: 'Only room owner can process turns' });
          return;
        }

        // Notify that turn is processing
        io.to(roomId).emit('turn:processing');

        const [players, messages, creatures] = await Promise.all([
          getPlayers(roomId),
          getMessages(roomId),
          getCreatures(roomId),
        ]);

        // Add player action messages
        for (const player of players) {
          if (player.action) {
            const msg: Message = {
              id: `msg-${Date.now()}-${player.id}`,
              sender: player.character.name,
              text: player.action,
              timestamp: Date.now(),
            };
            await addMessage(roomId, msg);
          }
        }

        // Generate DM response
        const dmResponse = await processTurn(room.worldDescription, messages, players, creatures, language);

        const dmMessage: Message = {
          id: `msg-${Date.now()}-dm`,
          sender: 'DM',
          text: dmResponse,
          timestamp: Date.now(),
        };

        await addMessage(roomId, dmMessage);

        // Clear player actions
        for (const player of players) {
          await updatePlayerAction(roomId, player.id, '');
        }

        // Notify room of new messages
        io.to(roomId).emit('turn:complete', {
          messages: [dmMessage],
        });

        logger.info(`Turn processed in room ${roomId}`);
      } catch (error) {
        logger.error('Error processing turn:', error);
        io.to(data.roomId).emit('error', { message: 'Failed to process turn' });
      }
    });

    /**
     * Handle disconnect
     */
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);

      if (socketData.roomId) {
        socket.to(socketData.roomId).emit('player:disconnected', { userId });
      }
    });
  });
}

