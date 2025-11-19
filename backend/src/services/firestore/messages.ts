import { getDb } from '@/config/firebase';
import type { Message } from '@/types/index';

const db = () => getDb();

export async function addMessage(roomId: string, message: Message): Promise<void> {
  await db().collection('rooms').doc(roomId).collection('messages').doc(message.id).set(message);
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
