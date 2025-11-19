/**
 * Test fixture utilities for waiting on services
 * @file backend/test/waitForReady.ts
 */

import waitOn from 'wait-on';
import { logger } from '@/utils/logger';

export interface WaitOptions {
  timeout?: number;
  interval?: number;
  window?: number;
}

/**
 * Wait for HTTP endpoint to be ready
 */
export async function waitForHttp(url: string, options: WaitOptions = {}): Promise<void> {
  const { timeout = 30000, interval = 1000, window = 1000 } = options;

  try {
    await waitOn({
      resources: [url],
      timeout,
      interval,
      window,
      validateStatus: (status) => status >= 200 && status < 500,
    });
    logger.info(`✅ Service ready: ${url}`);
  } catch (error) {
    logger.error(`❌ Timeout waiting for ${url}:`, error);
    throw new Error(`Service not ready after ${timeout}ms: ${url}`);
  }
}

/**
 * Wait for multiple HTTP endpoints
 */
export async function waitForMultiple(urls: string[], options: WaitOptions = {}): Promise<void> {
  const { timeout = 30000, interval = 1000, window = 1000 } = options;

  try {
    await waitOn({
      resources: urls,
      timeout,
      interval,
      window,
      validateStatus: (status) => status >= 200 && status < 500,
      simultaneous: 1, // Wait for all resources
    });
    logger.info(`✅ All services ready: ${urls.join(', ')}`);
  } catch (error) {
    logger.error('❌ Timeout waiting for services:', error);
    throw new Error(`Services not ready after ${timeout}ms: ${urls.join(', ')}`);
  }
}

/**
 * Wait for backend API to be ready
 */
export async function waitForBackend(port = 3001, options: WaitOptions = {}): Promise<void> {
  const url = `http://localhost:${port}/health`;
  await waitForHttp(url, options);
}

/**
 * Wait for Firebase emulators to be ready
 */
export async function waitForEmulators(options: WaitOptions = {}): Promise<void> {
  const firestorePort = process.env.FIRESTORE_EMULATOR_HOST?.split(':')[1] || '8080';
  const authPort = process.env.FIREBASE_AUTH_EMULATOR_HOST?.split(':')[1] || '9099';

  await waitForMultiple([`http://localhost:${firestorePort}`, `http://localhost:${authPort}`], options);
}

/**
 * Wait for backend + emulators (full test environment)
 */
export async function waitForTestEnvironment(backendPort = 3001, options: WaitOptions = {}): Promise<void> {
  logger.info('🔄 Waiting for test environment to be ready...');

  // Wait for emulators first
  await waitForEmulators(options);

  // Then wait for backend
  await waitForBackend(backendPort, options);

  logger.info('✅ Test environment ready!');
}
