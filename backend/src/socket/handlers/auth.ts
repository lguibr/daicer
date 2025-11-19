import type { Socket } from 'socket.io';
import { getFirebaseAuth } from '@/config/firebase';
import { logger } from '@/utils/logger';

export interface SocketData {
  userId: string;
  roomId?: string;
}

export async function verifySocketAuth(socket: Socket): Promise<string | null> {
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
