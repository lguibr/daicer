/**
 * Helpers to manage Firebase emulators during Playwright runs.
 */

const DEFAULT_PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? process.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-project';
const DEFAULT_AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9100';
const DEFAULT_FIRESTORE_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8081';

type EmulatorHost = string;

function ensureHttpProtocol(host: EmulatorHost): string {
  if (host.startsWith('http://') || host.startsWith('https://')) {
    return host;
  }
  return `http://${host}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function shouldRetry(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  if (error instanceof Error) {
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ECONNRESET')) {
      return true;
    }
    if (error.cause instanceof Error) {
      return shouldRetry(error.cause);
    }
  }

  if ('cause' in error) {
    const { cause } = error as { cause?: unknown };
    return shouldRetry(cause);
  }

  if ('message' in error && typeof (error as { message?: unknown }).message === 'string') {
    const message = (error as { message?: string }).message ?? '';
    return message.includes('ECONNREFUSED') || message.includes('ECONNRESET');
  }

  return false;
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  description: string,
  retries = 40,
  delayMs = 500
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await fetch(url, init);
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt === retries;
      if (!shouldRetry(error) || isLastAttempt) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to connect to ${description}: ${message}`);
      }

      // eslint-disable-next-line no-await-in-loop
      await sleep(delayMs);
    }
  }

  throw new Error(`Failed to connect to ${description}: ${String(lastError)}`);
}

async function deleteWithOk(url: string, description: string): Promise<void> {
  const response = await fetchWithRetry(url, { method: 'DELETE' }, description);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to reset ${description}: ${response.status} ${response.statusText} - ${body}`);
  }
}

/**
 * Remove all Auth emulator accounts for the configured project.
 */
export async function resetAuthEmulator(projectId: string = DEFAULT_PROJECT_ID): Promise<void> {
  const baseUrl = ensureHttpProtocol(DEFAULT_AUTH_HOST);
  const url = `${baseUrl}/emulator/v1/projects/${projectId}/accounts`;
  await deleteWithOk(url, 'auth emulator');
}

/**
 * Remove all Firestore emulator documents for the configured project.
 */
export async function resetFirestoreEmulator(projectId: string = DEFAULT_PROJECT_ID): Promise<void> {
  const baseUrl = ensureHttpProtocol(DEFAULT_FIRESTORE_HOST);
  const url = `${baseUrl}/emulator/v1/projects/${projectId}/databases/(default)/documents`;
  await deleteWithOk(url, 'firestore emulator');
}

/**
 * Reset all emulators relevant to the E2E flow.
 * Includes retry logic to handle emulators not being ready yet
 */
export async function resetEmulators(projectId: string = DEFAULT_PROJECT_ID): Promise<void> {
  const maxRetries = 5;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    try {
      await Promise.all([resetAuthEmulator(projectId), resetFirestoreEmulator(projectId)]);
      return; // Success!
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries - 1) {
        // Wait before retry (exponential backoff)
        const delayMs = 1000 * (attempt + 1);
        console.log(`⚠️  Emulator reset failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delayMs}ms...`);
        // eslint-disable-next-line no-await-in-loop
        await sleep(delayMs);
      }
    }
  }

  throw new Error(`Failed to reset emulators after ${maxRetries} attempts: ${lastError?.message}`);
}
