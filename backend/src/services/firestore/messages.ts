import { getDb } from '@/config/firebase';
import type { Message } from '@/types/index';

const db = () => getDb();

import { getIO } from '@/socket/instance';

export async function addMessage(roomId: string, message: Message): Promise<void> {
  await db().collection('rooms').doc(roomId).collection('messages').doc(message.id).set(message);

  try {
    const io = getIO();
    io.to(roomId).emit('message:new', message);
  } catch (error) {
    // Ignore socket errors (e.g. if called during tests or before socket init)
    // console.warn('Socket emission failed in addMessage:', error);
  }
}

export async function getMessages(roomId: string, limit = 100): Promise<Message[]> {
  const snapshot = await db()
    .collection('rooms')
    .doc(roomId)
    .collection('messages')
    .orderBy('timestamp', 'asc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => doc.data() as Message);
}
