/**
 * User role management service
 */

import { getFirebaseAuth } from '@/config/firebase';
import type { Role } from '@/types/index';
import { logger } from '@/utils/logger';

/**
 * Set custom role claim for a user
 * @param uid - User ID
 * @param role - Role to assign
 */
export async function setUserRole(uid: string, role: Role): Promise<void> {
  const auth = getFirebaseAuth();
  await auth.setCustomUserClaims(uid, { role });
  logger.info(`Role ${role} assigned to user ${uid}`);
}

/**
 * Get user role from custom claims
 * @param uid - User ID
 * @returns User role or 'free' as default
 */
export async function getUserRole(uid: string): Promise<Role> {
  const auth = getFirebaseAuth();
  const user = await auth.getUser(uid);
  const role = user.customClaims?.role as Role;
  return role || 'free';
}
