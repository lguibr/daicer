/**
 * Socket.io event handlers for real-time gameplay
 * Refactored to use LangGraph game graph
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
import { invokeGameGraph, getGameState } from '@/graph/game-graph';
import { getActiveCombatSession } from '@/combat/tools';
import { logger } from '@/utils/logger';
import { GamePhase, type Language } from '@/types/index';

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

    // Get game state from graph if it exists
    const gameState = await getGameState(roomId);
    
    // If no graph state, send traditional state
    if (!gameState) {
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
    } else {
      // Send graph state
      socket.emit('game:state', {
        room,
        players: gameState.players,
        messages: gameState.messages,
        creatures: gameState.creatures,
        combatState: gameState.combatState,
      });
    }

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

      // Trigger character openings via game graph
      const room = await getRoom(roomId);
      if (!room) return;
      
      const players = await getPlayers(roomId);

      // Invoke graph to generate character openings
      const result = await invokeGameGraph(roomId, {
        roomId: room.id,
        ownerId: room.ownerId,
        code: room.code,
        phase: 'CHARACTER_CREATION',
        settings: room.settings,
        worldDescription: room.worldDescription,
        players,
        messages: [],
        creatures: [],
        combatState: null,
        createdAt: room.createdAt,
        updatedAt: Date.now(),
      });

      // Emit messages from graph result
      const messages = result.messages as Array<{ id: string; sender: string; text: string; timestamp: number; recipientId?: string }>;
      const newMessages = messages.slice(-players.length - 1); // Last N+1 messages
      for (const msg of newMessages) {
        if (msg.recipientId) {
          io.to(msg.recipientId).emit('message:new', msg);
        } else {
          io.to(roomId).emit('message:new', msg);
        }
        
        await addMessage(roomId, msg);
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
 * Now uses game graph instead of direct service calls
 */
async function handleProcessTurn(
  io: Server,
  socket: Socket,
  userId: string,
  data: { roomId: string; language?: Language }
) {
  try {
    const { roomId } = data;
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

    // Get current state
    let currentState = await getGameState();
    
    if (!currentState) {
      // Initialize state if it doesn't exist
      const [players, messages, creatures] = await Promise.all([
        getPlayers(roomId),
        getMessages(roomId),
        getCreatures(roomId),
      ]);

      currentState = {
        roomId: room.id,
        ownerId: room.ownerId,
        code: room.code,
        phase: room.phase as any,
        settings: room.settings,
        worldDescription: room.worldDescription,
        players,
        messages,
        creatures,
        combatState: null,
        createdAt: room.createdAt,
        updatedAt: Date.now(),
      };
    }

    // Invoke game graph to process turn
    const result = await invokeGameGraph(roomId, currentState);

    // Emit new messages
    const resultMessages = result.messages as Array<{
      id: string; sender: string; text: string; timestamp: number; recipientId?: string;
    }>;
    const currentMessages = currentState.messages as Array<{
      id: string; sender: string; text: string; timestamp: number; recipientId?: string;
    }>;
    const newMessagesCount = resultMessages.length - currentMessages.length;
    const newMessages = resultMessages.slice(-newMessagesCount);
    
    for (const msg of newMessages) {
      if (msg.recipientId) {
        io.to(msg.recipientId).emit('message:new', msg);
      } else {
        io.to(roomId).emit('message:new', msg);
      }
      
      // Also save to Firestore for legacy compatibility
      await addMessage(roomId, msg);
    }

    // Clear player actions in Firestore
    const resultPlayers = result.players as Array<{ id: string; action: string | null }>;
    for (const player of resultPlayers) {
      await updatePlayerAction(roomId, player.id, '');
    }

    // Notify turn complete
    io.to(roomId).emit('turn:complete');

    logger.info(`Turn processed via graph in room ${roomId}`);
  } catch (error) {
    logger.error('Error processing turn:', error);
    io.to(data.roomId).emit('error', { message: 'Failed to process turn' });
  }
}

/**
 * Handle combat:action event
 * Routes combat actions through the game graph
 */
async function handleCombatAction(
  io: Server,
  socket: Socket,
  _userId: string,
  data: {
    roomId: string;
    action: 'attack' | 'move' | 'end_turn' | 'start_combat' | 'end_combat';
    params: Record<string, unknown>;
  }
) {
  try {
    const { roomId, action, params } = data;

    logger.info(`Combat action: ${action} in room ${roomId}`);

    const session = getActiveCombatSession(roomId);
    if (!session && action !== 'start_combat') {
      socket.emit('error', { message: 'No active combat session' });
      return;
    }

    let updatedState;

    switch (action) {
      case 'attack':
        if (session) {
          updatedState = await session.attack(
            params.attackerId as string, 
            params.defenderId as string, 
            {
              weaponDamage: params.weaponDamage as string | undefined,
              damageType: params.damageType as string | undefined,
            }
          );
        }
        break;
      
      case 'move':
        if (session) {
          updatedState = await session.moveCharacter(
            params.characterId as string, 
            {
              x: params.targetX as number,
              y: params.targetY as number,
            }
          );
        }
        break;
      
      case 'end_turn':
        if (session) {
          updatedState = await session.endTurn();
        }
        break;
      
      default:
        socket.emit('error', { message: 'Unknown combat action' });
        return;
    }

    if (updatedState) {
      // Update game state with new combat state
      const gameState = await getGameState();
      if (gameState) {
        await invokeGameGraph(roomId, {
          ...gameState,
          combatState: updatedState,
        });
      }

      // Emit updated combat state
      io.to(roomId).emit('combat:state_update', updatedState);
    }

    logger.info(`Combat action ${action} completed`);
  } catch (error) {
    logger.error('Error handling combat action:', error);
    socket.emit('error', { message: 'Failed to execute combat action' });
  }
}

/**
 * Handle combat:restore event (time-travel)
 */
async function handleRestoreCombatState(
  io: Server,
  socket: Socket,
  _userId: string,
  data: { roomId: string; historyIndex: number }
) {
  try {
    const { roomId, historyIndex } = data;

    const session = getActiveCombatSession(roomId);
    if (!session) {
      socket.emit('error', { message: 'No active combat session' });
      return;
    }

    // Restore to previous state
    const restoredState = await session.restoreState(historyIndex);

    // Update game graph state
    const gameState = await getGameState();
    if (gameState) {
      await invokeGameGraph(roomId, {
        ...gameState,
        combatState: restoredState,
      });
    }

    // Emit restored state
    io.to(roomId).emit('combat:state_update', restoredState);
    
    logger.info(`Combat state restored to index ${historyIndex} in room ${roomId}`);
  } catch (error) {
    logger.error('Error restoring combat state:', error);
    socket.emit('error', { message: 'Failed to restore combat state' });
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
    socket.on('combat:action', (data) => handleCombatAction(io, socket, userId, data));
    socket.on('combat:restore', (data) => handleRestoreCombatState(io, socket, userId, data));
    socket.on('disconnect', () => handleDisconnect(socket, userId, socketData));
  });
}
