#!/usr/bin/env tsx
/**
 * E2E Test Orchestrator
 * Auto-starts all services, waits for health, runs tests, cleans up
 */

import { spawn, type ChildProcess } from 'child_process';
import waitOn from 'wait-on';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ServiceProcess {
  name: string;
  proc: ChildProcess;
}

const processes: ServiceProcess[] = [];
const isHeaded = process.argv.includes('--headed');

function log(emoji: string, message: string): void {
  console.log(`${emoji} ${message}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function startService(name: string, command: string, cwd: string, env: Record<string, string> = {}): ChildProcess {
  log('🚀', `Starting ${name}...`);
  console.log(`   Command: ${command}`);
  console.log(`   CWD: ${cwd}`);
  console.log('');

  const proc = spawn(command, {
    shell: true,
    cwd: path.resolve(__dirname, '..', cwd),
    stdio: 'inherit', // Show all output immediately
    env: { ...process.env, ...env },
  });

  processes.push({ name, proc });

  proc.on('error', (err: Error) => {
    log('❌', `${name} error: ${err.message}`);
  });

  proc.on('exit', (code: number | null) => {
    if (code !== 0 && code !== null) {
      log('⚠️', `${name} exited with code ${code}`);
    }
  });

  return proc;
}

async function waitForService(url: string, name: string, timeout = 120000): Promise<void> {
  log('⏳', `Waiting for ${name} at ${url}...`);
  console.log(`   Timeout: ${timeout / 1000}s`);
  console.log('');

  const startWait = Date.now();
  try {
    await waitOn({
      resources: [url],
      timeout,
      interval: 500,
      window: 500,
      validateStatus: (status: number) => status >= 200 && status < 500,
      log: true, // Show wait-on progress
    });
    const elapsed = ((Date.now() - startWait) / 1000).toFixed(1);
    log('✅', `${name} ready! (${elapsed}s)`);
    console.log('');
  } catch (error) {
    const elapsed = ((Date.now() - startWait) / 1000).toFixed(1);
    const message = error instanceof Error ? error.message : String(error);
    log('❌', `${name} failed to start after ${elapsed}s: ${message}`);
    log('💡', `Check if the service is listening on ${url}`);
    throw error;
  }
}

function cleanup(code = 0): void {
  log('🛑', 'Cleaning up...');
  processes.forEach(({ name, proc }) => {
    try {
      proc.kill('SIGTERM');
    } catch (e) {
      // ignore
    }
  });

  // Force kill after 2s
  setTimeout(() => {
    processes.forEach(({ proc }) => {
      try {
        proc.kill('SIGKILL');
      } catch (e) {
        // ignore
      }
    });
    process.exit(code);
  }, 2000);
}

process.on('SIGINT', () => cleanup(130));
process.on('SIGTERM', () => cleanup(143));

async function main(): Promise<void> {
  log('🎭', 'Starting E2E Environment...\n');

  const startTime = Date.now();

  try {
    // 1. Start Firebase emulators
    startService(
      'Emulators',
      'npx firebase-tools emulators:start --project=demo-project --config firebase.e2e.json --import=./emulator-data-e2e --export-on-exit=./emulator-data-e2e',
      '.'
    );

    // Check emulator hub (port 4401 per firebase.e2e.json)
    await waitForService('http://localhost:4401', 'Emulator Hub', 90000);

    // Emulator UI (confirms Firestore + Auth are ready)
    await waitForService('http://localhost:4001', 'Emulator UI', 30000);

    // Auth emulator has HTTP endpoint
    await waitForService('http://localhost:9100', 'Auth Emulator', 30000);

    // Firestore uses gRPC (no HTTP), trust hub status + give extra time
    await sleep(3000);
    console.log('✅ Firestore Emulator ready (via Hub status)\n');

    // 2. Start backend
    startService('Backend', 'yarn dev', 'backend', {
      PORT: '3101',
      FIRESTORE_EMULATOR_HOST: 'localhost:8081',
      FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9100',
      FIREBASE_PROJECT_ID: 'demo-project',
    });

    await waitForService('http://localhost:3101/health', 'Backend', 120000);

    // 3. Start frontend
    startService('Frontend', 'yarn dev', 'frontend', {
      VITE_PORT: '3100',
      VITE_API_URL: 'http://localhost:3101',
      VITE_FIREBASE_PROJECT_ID: 'demo-project',
    });

    await waitForService('http://localhost:3100', 'Frontend', 90000);

    const setupTime = ((Date.now() - startTime) / 1000).toFixed(1);
    log('\n✅', `All services ready in ${setupTime}s!\n`);
    log('📍', 'Emulator UI: http://localhost:4001');
    log('🔧', 'Backend:     http://localhost:3101');
    log('💻', 'Frontend:    http://localhost:3100\n');

    // 4. Run Playwright tests
    log('🧪', `Running E2E tests ${isHeaded ? '(headed mode)' : '(headless)'}...\n`);

    const extraArgs = process.argv.slice(2).filter((arg) => arg !== '--headed');
    let cmd = `yarn playwright test${isHeaded ? ' --headed' : ''}`;
    if (extraArgs.length > 0) {
      cmd += ` ${extraArgs.join(' ')}`;
    }
    const testProc = spawn(cmd, {
      shell: true,
      cwd: path.resolve(__dirname, '..', 'e2e'),
      stdio: 'inherit',
      env: {
        ...process.env,
        SKIP_WEBSERVER: '1',
        FIRESTORE_EMULATOR_HOST: 'localhost:8081',
        FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9100',
        FIREBASE_PROJECT_ID: 'demo-project',
      },
    });

    const testExitCode = await new Promise<number>((resolve) => {
      testProc.on('exit', (code: number | null) => resolve(code || 0));
    });

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

    if (testExitCode === 0) {
      log('\n✅', `All tests passed! (${totalTime}s total)`);
    } else {
      log('\n❌', `Tests failed with exit code ${testExitCode}`);
    }

    cleanup(testExitCode);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log('❌', `E2E run failed: ${message}`);
    cleanup(1);
  }
}

main();
