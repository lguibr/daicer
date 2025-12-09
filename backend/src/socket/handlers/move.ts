import type { Server, Socket } from 'socket.io';
import { logger } from '@/utils/logger';
import { updatePlayerPosition, getPlayers } from '@/services/firestore/players';
import { getCreatures } from '@/services/firestore/creatures';

export async function handlePlayerMove(
  _io: Server,
  socket: Socket,
  userId: string,
  data: { roomId: string; position: { x: number; y: number; z: number } }
): Promise<void> {
  const { roomId, position } = data;

  try {
    // 1. Validate position (basic bounds check could go here, but map size varies)

    // 2. Collision Detection
    // Fetch all entities to check for occupancy
    // TODO: Optimize with spatial queries if scaling up
    const [players, creatures] = await Promise.all([getPlayers(roomId), getCreatures(roomId)]);

    const isPlayerAtPos = players.some(
      (p) =>
        p.userId !== userId && // Ignore self
        p.position &&
        Math.round(p.position.x) === Math.round(position.x) &&
        Math.round(p.position.y) === Math.round(position.y)
    );

    if (isPlayerAtPos) {
      logger.warn(`Player ${userId} attempted to move to occupied square (${position.x}, ${position.y})`);
      socket.emit('error', { message: 'Path blocked by another player' });
      return;
    }

    const isCreatureAtPos = creatures.some(
      (c) => Math.round(c.position.x) === Math.round(position.x) && Math.round(c.position.y) === Math.round(position.y)
    );

    if (isCreatureAtPos) {
      logger.warn(`Player ${userId} attempted to move to occupied square (${position.x}, ${position.y})`);
      socket.emit('error', { message: 'Path blocked by a creature' });
      return;
    }

    // 3. Update player position in Firestore
    await updatePlayerPosition(roomId, userId, position);

    // 4. Broadcast movement to other players in the room
    socket.to(roomId).emit('player:move', {
      userId,
      position,
    });
  } catch (error) {
    logger.error('Failed to handle player move:', error);
    socket.emit('error', { message: 'Failed to update position' });
  }
}
