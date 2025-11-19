/**
 * Global teardown for Jest tests
 * Stops Firebase emulators after all tests complete
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Global teardown function
 */
export default async function globalTeardown(): Promise<void> {
  console.log('🧹 Cleaning up test environment...');

  const emulatorPid = process.env.EMULATOR_PID;

  if (emulatorPid) {
    try {
      // Kill the emulator process
      process.kill(Number(emulatorPid), 'SIGTERM');
      console.log('✅ Firebase emulators stopped');
    } catch (error) {
      console.warn('⚠️  Could not stop emulators:', error);
    }
  }

  // Alternative: try to stop via Firebase CLI
  try {
    await execAsync('npx firebase emulators:stop || true');
  } catch {
    // Ignore errors
  }

  console.log('✅ Test environment cleaned up');
}
