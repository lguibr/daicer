import type { Server, Socket } from 'socket.io';
import { logger } from '@/utils/logger';
import { verifySocketAuth, type SocketData } from './handlers/auth';
import { handleJoinRoom, handleLeaveRoom } from './handlers/room';
import { handlePlayerReady } from './handlers/ready';
import { handlePlayerAction } from './handlers/action';
import { handleProcessTurn } from './handlers/turn';
import { handleCombatAction, handleRestoreCombatState } from './handlers/combat';
import { handleDisconnect } from './handlers/disconnect';
import { registerAssetHandlers } from './handlers/assets';
import { registerStreamingHandlers, cleanupUserStreams } from './handlers/streaming';
import { registerPresenceHandlers, clearUserPresence } from './handlers/presence';
import { registerWorldChunkHandlers } from './handlers/worldChunks';
import { registerMapFeatureHandlers } from './handlers/mapFeatures';
import { registerTacticalDMHandlers } from './handlers/tacticalDM';
import { handlePlayerMove } from './handlers/move';

import { streamManager } from '@/services/llm/stream-manager';

export function initializeSocketHandlers(io: Server): void {
  // Initialize StreamManager with IO instance
  streamManager.setSocketServer(io);

  io.on('connection', async (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    const userId = await verifySocketAuth(socket);

    if (!userId) {
      logger.warn(`Unauthenticated socket: ${socket.id}`);
      socket.emit('error', { message: 'Authentication required' });
      socket.disconnect();
      return;
    }

    const socketData: SocketData = { userId };

    // Register world chunk handlers
    registerWorldChunkHandlers(socket, userId);

    socket.on('room:join', (data) => handleJoinRoom(socket, userId, data, socketData));
    socket.on('room:leave', () => handleLeaveRoom(socket, userId, socketData));
    socket.on('player:ready', (data) => {
      logger.info(`🔥 Received player:ready event from ${userId}:`, data);
      handlePlayerReady(io, socket, userId, data);
    });
    socket.on('player:action', (data) => handlePlayerAction(io, socket, userId, data));
    socket.on('turn:process', (data) => handleProcessTurn(io, socket, userId, data));
    socket.on('combat:action', (data) => handleCombatAction(io, socket, userId, data));
    socket.on('combat:restore', (data) => handleRestoreCombatState(io, socket, userId, data));
    socket.on('player:move', (data) => handlePlayerMove(io, socket, userId, data));
    socket.on('disconnect', () => {
      // Cleanup streaming and presence on disconnect
      cleanupUserStreams(userId);
      clearUserPresence(userId);
      handleDisconnect(socket, userId, socketData);
    });

    // Register asset generation handlers
    registerAssetHandlers(io, socket, userId);

    // Register streaming handlers
    registerStreamingHandlers(io, socket, userId);

    // Register presence handlers
    registerPresenceHandlers(io, socket, userId);

    // Register world chunk handlers
    registerWorldChunkHandlers(socket, userId);

    // Register map feature handlers
    registerMapFeatureHandlers(socket, userId);

    // Register tactical DM handlers
    registerTacticalDMHandlers(socket, userId);
  });
}
