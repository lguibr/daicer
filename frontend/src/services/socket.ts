/**
 * Socket.io client for real-time communication
 */

import { io, Socket } from 'socket.io-client';
import { auth } from './firebase';
import type { Room, Player, Message, Creature } from '../types/shared';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

/**
 * Socket event callbacks
 */
interface SocketEvents {
  onGameState?: (data: { room: Room; players: Player[]; messages: Message[]; creatures: Creature[] }) => void;
  onRoomUpdated?: (data: { type: string; userId: string; action?: string }) => void;
  onPlayerJoined?: (data: { userId: string }) => void;
  onPlayerLeft?: (data: { userId: string }) => void;
  onPlayerCreated?: (player: Player) => void;
  onPlayerReadyUpdated?: (data: { userId: string; isReady: boolean }) => void;
  onAllReady?: () => void;
  onPhaseChanged?: (data: { phase: string }) => void;
  onTurnProcessing?: () => void;
  onTurnComplete?: (data: { messages: Message[] }) => void;
  onError?: (data: { message: string }) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

/**
 * Initialize socket connection
 * @param events - Event callbacks
 * @returns Socket instance
 */
export async function initSocket(events: SocketEvents = {}): Promise<Socket> {
  if (socket?.connected) {
    return socket;
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to connect socket');
  }

  const token = await user.getIdToken();

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
  });

  // Register event listeners
  if (events.onConnect) socket.on('connect', events.onConnect);
  if (events.onDisconnect) socket.on('disconnect', events.onDisconnect);
  if (events.onGameState) socket.on('game:state', events.onGameState);
  if (events.onRoomUpdated) socket.on('room:updated', events.onRoomUpdated);
  if (events.onPlayerJoined) socket.on('player:joined', events.onPlayerJoined);
  if (events.onPlayerLeft) socket.on('player:left', events.onPlayerLeft);
  if (events.onPlayerCreated) socket.on('player:created', events.onPlayerCreated);
  if (events.onPlayerReadyUpdated) socket.on('player:ready_updated', events.onPlayerReadyUpdated);
  if (events.onAllReady) socket.on('room:all_ready', events.onAllReady);
  if (events.onPhaseChanged) socket.on('room:phase_changed', events.onPhaseChanged);
  if (events.onTurnProcessing) socket.on('turn:processing', events.onTurnProcessing);
  if (events.onTurnComplete) socket.on('turn:complete', events.onTurnComplete);
  if (events.onError) socket.on('error', events.onError);

  return socket;
}

/**
 * Get current socket instance
 * @returns Socket or null
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Join a room
 * @param roomId - Room ID
 */
export function joinRoom(roomId: string): void {
  if (!socket || !socket.connected) {
    return;
  }
  socket.emit('room:join', { roomId });
}

/**
 * Leave current room
 */
export function leaveRoom(): void {
  if (!socket || !socket.connected) return; // Safe no-op if not connected
  socket.emit('room:leave');
}

/**
 * Set ready status
 * @param roomId - Room ID
 * @param isReady - Ready state
 */
export function setReady(roomId: string, isReady: boolean): void {
  if (!socket || !socket.connected) {
    return;
  }
  socket.emit('player:ready', { roomId, isReady });
}

/**
 * Submit player action
 * @param roomId - Room ID
 * @param action - Player action text
 */
export function submitAction(roomId: string, action: string): void {
  if (!socket || !socket.connected) {
    return;
  }
  socket.emit('player:action', { roomId, action });
}

/**
 * Request turn processing
 * @param roomId - Room ID
 * @param language - Language code
 */
export function processTurn(roomId: string, language = 'en'): void {
  if (!socket || !socket.connected) {
    return;
  }
  socket.emit('turn:process', { roomId, language });
}

/**
 * Disconnect socket
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Check if socket is connected
 * @returns Connection status
 */
export function isConnected(): boolean {
  return socket?.connected || false;
}
