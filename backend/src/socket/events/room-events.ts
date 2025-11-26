/**
 * Type-safe Socket.IO event emitters for room events
 */

import { getIO } from '@/socket/instance';
import { GamePhase } from '@/types/index';
import type { Room, Player } from '@/types/index';
import { logger } from '@/utils/logger';

/**
 * Game state structure for broadcasting
 */
export interface GameState {
  room: Room;
  players: Player[];
  messages: any[];
  creatures: any[];
}

/**
 * Emit room phase change event
 */
export const emitRoomPhaseChange = (roomId: string, phase: GamePhase): void => {
  const io = getIO();
  io.to(roomId).emit('room:phase_changed', {
    roomId,
    phase,
  });
  logger.info('[SocketIO] Emitted room:phase_changed', { roomId, phase });
};

/**
 * Emit complete game state update
 */
export const emitGameState = (roomId: string, state: GameState): void => {
  const io = getIO();
  io.to(roomId).emit('game:state', state);
  logger.info('[SocketIO] Emitted game:state', {
    roomId,
    playerCount: state.players.length,
    messageCount: state.messages.length,
  });
};

/**
 * Emit room update event
 */
export const emitRoomUpdate = (roomId: string, room: Room): void => {
  const io = getIO();
  io.to(roomId).emit('room:updated', { room });
  logger.info('[SocketIO] Emitted room:updated', { roomId });
};

/**
 * Emit player joined event
 */
export const emitPlayerJoined = (roomId: string, player: Player): void => {
  const io = getIO();
  io.to(roomId).emit('player:joined', { player });
  logger.info('[SocketIO] Emitted player:joined', { roomId, playerId: player.id });
};

/**
 * Emit player left event
 */
export const emitPlayerLeft = (roomId: string, playerId: string): void => {
  const io = getIO();
  io.to(roomId).emit('player:left', { playerId });
  logger.info('[SocketIO] Emitted player:left', { roomId, playerId });
};
