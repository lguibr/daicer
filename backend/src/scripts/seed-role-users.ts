/**
 * Seed script to create test users with different roles
 * Creates free, premium, and god users for testing
 */

import { getFirebaseAuth } from '../config/firebase';
import { setUserRole } from '../services/firestore/roles';
import { logger } from '../utils/logger';

interface TestUser {
  email: string;
  password: string;
  role: 'free' | 'premium' | 'god';
  displayName: string;
}

const testUsers: TestUser[] = [
  {
    email: 'free@daicer.com',
    password: 'freepass123',
    role: 'free',
    displayName: 'Free User',
  },
  {
    email: 'premium@daicer.com',
    password: 'premiumpass123',
    role: 'premium',
    displayName: 'Premium User',
  },
  {
    email: 'god@daicer.com',
    password: 'godpass123',
    role: 'god',
    displayName: 'God Admin',
  },
];

async function seedRoleUsers(): Promise<void> {
  logger.info('Starting role users seed...');
  const auth = getFirebaseAuth();

  for (const testUser of testUsers) {
    try {
      // Check if user already exists
      let user;
      try {
        user = await auth.getUserByEmail(testUser.email);
        logger.info(`User ${testUser.email} already exists, updating role...`);
      } catch {
        // User doesn't exist, create it
        user = await auth.createUser({
          email: testUser.email,
          password: testUser.password,
          displayName: testUser.displayName,
          emailVerified: true,
        });
        logger.info(`Created user ${testUser.email} with uid: ${user.uid}`);
      }

      // Set role via custom claims
      await setUserRole(user.uid, testUser.role);
      logger.info(`✓ ${testUser.email} (${testUser.role})`);
    } catch (error) {
      logger.error(`Failed to create/update user ${testUser.email}:`, error);
    }
  }

  logger.info('Role users seed complete');
}

// Run if executed directly
if (require.main === module) {
  seedRoleUsers()
    .then(() => {
      logger.info('Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seed failed:', error);
      process.exit(1);
    });
}

export { seedRoleUsers };
