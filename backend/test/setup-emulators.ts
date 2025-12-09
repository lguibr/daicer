/**
 * Jest global setup - starts Firebase emulators before running tests
 */

/* eslint-disable no-console */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const EMULATOR_START_TIMEOUT = 60000; // 60 seconds (increased for slower systems)

// Use E2E ports for tests (parallel-safe, no conflicts with dev)
// Dev: Firestore 8080, Auth 9099
// E2E: Firestore 8081, Auth 9100
const IS_E2E = process.env.TEST_ENV === 'e2e' || process.env.NODE_ENV === 'test';
const FIRESTORE_PORT = IS_E2E ? 8081 : 8080;
const AUTH_PORT = IS_E2E ? 9100 : 9099;
const HUB_PORT = IS_E2E ? 4401 : 4400; // Hub/UI port

/**
 * Check if emulators are already running (via Emulator Hub)
 */
async function areEmulatorsRunning(): Promise<boolean> {
  console.log(`🔍 Checking if emulators are running via Hub on port ${HUB_PORT}...`);
  try {
    // The Hub API returns JSON status of all emulators
    // http://localhost:4400/emulators
    const response = await fetch(`http://localhost:${HUB_PORT}/emulators`, { signal: AbortSignal.timeout(2000) });

    if (!response.ok) return false;

    const data = (await response.json()) as Record<string, { port?: number; status?: string }>;

    // Check if Firestore and Auth are running
    const firestoreRunning = data.firestore?.port === FIRESTORE_PORT;
    const authRunning = data.auth?.port === AUTH_PORT;

    if (firestoreRunning && authRunning) {
      console.log(`✅ Emulators detected via Hub: Firestore (: ${FIRESTORE_PORT}), Auth (: ${AUTH_PORT})`);
      return true;
    }

    return false;
  } catch (error) {
    // Fetch failed means Hub is likely not running
    return false;
  }
}

/**
 * Wait for emulators to be ready with retry logic
 */
async function waitForEmulators(): Promise<void> {
  const startTime = Date.now();
  let attempts = 0;
  let lastError: string = '';

  console.log(`⏳ Waiting for emulators to start (timeout: ${EMULATOR_START_TIMEOUT / 1000}s)...`);

  while (Date.now() - startTime < EMULATOR_START_TIMEOUT) {
    attempts++;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    try {
      const firestoreResponse = await fetch(`http://localhost:${FIRESTORE_PORT}`, {
        signal: AbortSignal.timeout(3000),
      });
      const authResponse = await fetch(`http://localhost:${AUTH_PORT}`, { signal: AbortSignal.timeout(3000) });

      console.log(
        `[Attempt ${attempts}] Firestore: ${firestoreResponse.status}, Auth: ${authResponse.status} (${elapsed}s)`
      );

      if (firestoreResponse.ok && authResponse.ok) {
        console.log(`✅ Both emulators ready after ${attempts} attempts (${elapsed}s)`);
        return;
      }

      lastError = `Firestore ${firestoreResponse.ok ? 'OK' : 'NOT OK'}, Auth ${authResponse.ok ? 'OK' : 'NOT OK'}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Connection failed';

      // Log progress every 3 attempts
      if (attempts % 3 === 0) {
        console.log(`⏳ Still waiting... (attempt ${attempts}, ${elapsed}s) - ${lastError}`);
      }
    }

    // Exponential backoff: start with 500ms, max 3s
    const delay = Math.min(500 * Math.pow(1.2, attempts), 3000);
    await new Promise((resolve) => {
      setTimeout(resolve, delay);
    });
  }

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  console.error(`❌ Emulator timeout details:`);
  console.error(`   - Ports checked: Firestore ${FIRESTORE_PORT}, Auth ${AUTH_PORT}`);
  console.error(`   - Total attempts: ${attempts}`);
  console.error(`   - Time elapsed: ${elapsed}s`);
  console.error(`   - Last error: ${lastError}`);
  console.error(`   - Environment: ${IS_E2E ? 'E2E (8081/9100)' : 'DEV (8080/9099)'}`);

  throw new Error(
    `Timeout waiting for Firebase emulators after ${attempts} attempts (${elapsed}s). Last error: ${lastError}`
  );
}

/**
 * Global setup function
 */
export default async function globalSetup(): Promise<void> {
  console.log('🔧 Setting up test environment...');
  console.log(`📍 Using ${IS_E2E ? 'E2E' : 'DEV'} emulator ports: Firestore ${FIRESTORE_PORT}, Auth ${AUTH_PORT}`);

  // Check if emulators are already running
  const running = await areEmulatorsRunning();

  if (running) {
    console.log(`ℹ️  Firebase emulators already running on ${IS_E2E ? 'E2E' : 'DEV'} ports`);

    // Set environment variables
    process.env.FIRESTORE_EMULATOR_HOST = `localhost:${FIRESTORE_PORT}`;
    process.env.FIREBASE_AUTH_EMULATOR_HOST = `localhost:${AUTH_PORT}`;
    process.env.NODE_ENV = 'test';

    return;
  }

  console.log(`🚀 Starting Firebase emulators on ${IS_E2E ? 'E2E' : 'DEV'} ports...`);

  // Don't kill existing emulators - they may be dev emulators
  console.log('ℹ️  Skipping emulator kill (parallel-safe with dev environment)');

  // Start emulators in detached mode with correct config
  const emulatorConfig = IS_E2E ? 'firebase.e2e.json' : 'firebase.json';
  const rootDir = process.cwd() + '/..';
  const command = `firebase emulators:start --only firestore,auth --project demo-project --config ${emulatorConfig}`;

  console.log(`📂 Working directory: ${rootDir}`);
  console.log(`🔧 Command: ${command}`);
  console.log(`📄 Config file: ${emulatorConfig}`);

  // Use spawn instead of exec for better long-running process control and 'detached' support
  const emulatorProcess = spawn(command, {
    cwd: rootDir,
    env: { ...process.env, FORCE_COLOR: '0' },
    detached: true,
    shell: true,
    stdio: 'pipe',
  });

  // Log emulator output for debugging
  if (emulatorProcess.stdout) {
    emulatorProcess.stdout.on('data', (data) => {
      console.log(`[Emulator STDOUT] ${data.toString().trim()}`);
    });
  }

  if (emulatorProcess.stderr) {
    emulatorProcess.stderr.on('data', (data) => {
      console.error(`[Emulator STDERR] ${data.toString().trim()}`);
    });
  }

  emulatorProcess.unref();

  // Wait for emulators to start
  await waitForEmulators();

  // Set environment variables
  process.env.FIRESTORE_EMULATOR_HOST = `localhost:${FIRESTORE_PORT}`;
  process.env.FIREBASE_AUTH_EMULATOR_HOST = `localhost:${AUTH_PORT}`;
  process.env.NODE_ENV = 'test';

  console.log('✅ Test environment ready!');
}
