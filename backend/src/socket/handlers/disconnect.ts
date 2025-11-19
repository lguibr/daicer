import type { Socket } from 'socket.io';
import { logger } from '@/utils/logger';
import type { SocketData } from './auth';

export function handleDisconnect(socket: Socket, userId: string, socketData: SocketData) {
  logger.info(`Socket disconnected: ${socket.id}`);

  if (socketData.roomId) {
    socket.to(socketData.roomId).emit('player:disconnected', { userId });
  }
}
