import { getDb } from '@/config/firebase';
import type { Creature } from '@/types/index';

const db = () => getDb();

export async function addCreature(roomId: string, creature: Creature): Promise<void> {
  await db().collection('rooms').doc(roomId).collection('creatures').add(creature);
}

export async function getCreatures(roomId: string): Promise<Creature[]> {
  const snapshot = await db().collection('rooms').doc(roomId).collection('creatures').get();

  return snapshot.docs.map((doc) => doc.data() as Creature);
}

export async function updateCreatureHp(roomId: string, creatureName: string, hp: number): Promise<void> {
  const snapshot = await db()
    .collection('rooms')
    .doc(roomId)
    .collection('creatures')
    .where('name', '==', creatureName)
    .get();

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    if (doc) {
      await doc.ref.update({ hp });
    }
  }
}
