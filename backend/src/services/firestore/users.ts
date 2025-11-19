import { getDb, getFirebaseAuth } from '@/config/firebase';
import type { User } from '@/types/index';
import { logger } from '@/utils/logger';

const db = () => getDb();

export async function createUser(userId: string, email: string, displayName: string, photoURL: string): Promise<User> {
  const now = new Date().toISOString();
  const user: User = {
    id: userId,
    email,
    displayName,
    photoURL,
    avatarUrl: null,
    role: 'free',
    language: 'en',
    createdAt: now,
    updatedAt: now,
  };

  await db().collection('users').doc(userId).set(user);

  // Set custom claim for role
  const auth = getFirebaseAuth();
  await auth.setCustomUserClaims(userId, { role: 'free' });

  logger.info(`User created: ${userId} with role: free`);
  return user;
}

export async function getUser(userId: string): Promise<User | null> {
  const doc = await db().collection('users').doc(userId).get();
  return doc.exists ? (doc.data() as User) : null;
}
