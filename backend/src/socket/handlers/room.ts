import type { Socket } from 'socket.io';
import { getRoom, getPlayers, getMessages, getCreatures } from '@/services/firestore';
import { logger } from '@/utils/logger';
import type { SocketData } from './auth';

export async function handleJoinRoom(socket: Socket, userId: string, data: { roomId: string }, socketData: SocketData) {
  try {
    const { roomId } = data;
    const room = await getRoom(roomId);

    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    await socket.join(roomId);
    // eslint-disable-next-line no-param-reassign
    socketData.roomId = roomId;

    // Use debug level for rejoin events (expected heartbeat behavior)
    logger.debug(`User ${userId} joined room ${roomId}`);

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

    socket.to(roomId).emit('player:joined', { userId });
  } catch (error) {
    logger.error('Error joining room:', error);
    socket.emit('error', { message: 'Failed to join room' });
  }
}

export async function handleLeaveRoom(socket: Socket, userId: string, socketData: SocketData) {
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
