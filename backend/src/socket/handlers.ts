/**
 * Socket.io event handlers for real-time gameplay
 */

import type { Server, Socket } from 'socket.io';
import { getFirebaseAuth } from '@/config/firebase';
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
} from '@/services/firestore';
import { processTurn, generateCharacterOpenings } from '@/services/game';
import { logger } from '@/utils/logger';
import { GamePhase, type Message, type Language } from '@/types/index';

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
 * Handle room:join event
 */
async function handleJoinRoom(socket: Socket, userId: string, data: { roomId: string }, socketData: SocketData) {
  try {
    const { roomId } = data;
    const room = await getRoom(roomId);

    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Join socket room
    await socket.join(roomId);
    // eslint-disable-next-line no-param-reassign
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
}

/**
 * Handle room:leave event
 */
async function handleLeaveRoom(socket: Socket, userId: string, socketData: SocketData) {
  if (!socketData.roomId) {
    return;
  }

  const { roomId } = socketData;
  await socket.leave(roomId);

  logger.info(`User ${userId} left room ${roomId}`);
  socket.to(roomId).emit('player:left', { userId });

  // eslint-disable-next-line no-param-reassign
  socketData.roomId = undefined;
}

/**
 * Handle player:ready event
 */
async function handlePlayerReady(
  io: Server,
  socket: Socket,
  userId: string,
  data: { roomId: string; isReady: boolean }
) {
  try {
    const { roomId, isReady } = data;

    await setPlayerReady(roomId, userId, isReady);

    // Notify room
    io.to(roomId).emit('player:ready_updated', { userId, isReady });

    // Check if all players ready
    const allReady = await areAllPlayersReady(roomId);
    if (allReady) {
      io.to(roomId).emit('room:all_ready');

      // Generate opening messages
      const room = await getRoom(roomId);
      if (!room) return;
      const players = await getPlayers(roomId);
      const { openings, mainMessage } = await generateCharacterOpenings(
        room.worldDescription,
        players,
        room.settings?.language || 'en'
      );

      // Add main message to firestore and emit
      const mainMsg: Message = {
        id: `msg-${Date.now()}-dm`,
        sender: 'DM',
        text: mainMessage,
        timestamp: Date.now(),
      };
      await addMessage(roomId, mainMsg);
      io.to(roomId).emit('message:new', mainMsg);

      // Add and emit personalized messages
      // eslint-disable-next-line no-restricted-syntax
      for (const opening of openings) {
        const personalMsg: Message = {
          id: `msg-${Date.now()}-dm-${opening.playerId}`,
          sender: 'DM',
          text: opening.message,
          recipientId: opening.playerId,
          timestamp: Date.now(),
        };
        await addMessage(roomId, personalMsg);
        // Assuming each player is in a socket room identified by their player ID
        io.to(opening.playerId).emit('message:new', personalMsg);
      }

      // Auto-transition to gameplay
      await updateRoomWorld(roomId, room.worldDescription, GamePhase.GAMEPLAY);
      io.to(roomId).emit('room:phase_changed', { phase: GamePhase.GAMEPLAY });
    }

    logger.info(`Player ${userId} ready: ${isReady} in room ${roomId}`);
  } catch (error) {
    logger.error('Error updating ready status:', error);
    socket.emit('error', { message: 'Failed to update ready status' });
  }
}

/**
 * Handle player:action event
 */
async function handlePlayerAction(
  io: Server,
  socket: Socket,
  userId: string,
  data: { roomId: string; action: string }
) {
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
}

/**
 * Handle turn:process event
 */
async function handleProcessTurn(
  io: Server,
  socket: Socket,
  userId: string,
  data: { roomId: string; language?: Language }
) {
  try {
    const { roomId, language = 'en' as Language } = data;
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
    // eslint-disable-next-line no-restricted-syntax
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

    // Add overall summary message
    const summaryMessage: Message = {
      id: `msg-${Date.now()}-dm-summary`,
      sender: 'DM',
      text: dmResponse.overall_summary,
      timestamp: Date.now(),
    };
    await addMessage(roomId, summaryMessage);

    // Add personalized perspective messages
    const perspectiveMessages: Message[] = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const p of dmResponse.player_perspectives) {
      const player = players.find((pl) => pl.character.name === p.playerName);
      if (player) {
        const perspectiveMessage: Message = {
          id: `msg-${Date.now()}-dm-perspective-${player.id}`,
          sender: 'DM',
          text: p.perspective,
          recipientId: player.id,
          timestamp: Date.now(),
        };
        await addMessage(roomId, perspectiveMessage);
        perspectiveMessages.push(perspectiveMessage);
      }
    }

    // Clear player actions
    // eslint-disable-next-line no-restricted-syntax
    for (const player of players) {
      await updatePlayerAction(roomId, player.id, '');
    }

    // Notify room of new messages
    io.to(roomId).emit('turn:complete');
    io.to(roomId).emit('message:new', summaryMessage);
    // eslint-disable-next-line no-restricted-syntax
    for (const msg of perspectiveMessages) {
      io.to(msg.recipientId!).emit('message:new', msg);
    }

    logger.info(`Turn processed in room ${roomId}`);
  } catch (error) {
    logger.error('Error processing turn:', error);
    io.to(data.roomId).emit('error', { message: 'Failed to process turn' });
  }
}

/**
 * Handle disconnect event
 */
function handleDisconnect(socket: Socket, userId: string, socketData: SocketData) {
  logger.info(`Socket disconnected: ${socket.id}`);

  if (socketData.roomId) {
    socket.to(socketData.roomId).emit('player:disconnected', { userId });
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

    socket.on('room:join', (data) => handleJoinRoom(socket, userId, data, socketData));
    socket.on('room:leave', () => handleLeaveRoom(socket, userId, socketData));
    socket.on('player:ready', (data) => handlePlayerReady(io, socket, userId, data));
    socket.on('player:action', (data) => handlePlayerAction(io, socket, userId, data));
    socket.on('turn:process', (data) => handleProcessTurn(io, socket, userId, data));
    socket.on('disconnect', () => handleDisconnect(socket, userId, socketData));
  });
}
