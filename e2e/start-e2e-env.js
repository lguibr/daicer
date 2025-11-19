#!/usr/bin/env node
/**
 * Start E2E environment with proper health checks
 * Uses wait-on to ensure services are ready before proceeding
 */

const { spawn } = require('child_process');
const waitOn = require('wait-on');

const services = [];

function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

function startService(name, command, cwd) {
  log('🚀', `Starting ${name}...`);
  const proc = spawn(command, {
    shell: true,
    cwd,
    stdio: 'inherit',
    env: { ...process.env },
  });
  
  services.push({ name, proc });
  
  proc.on('error', (err) => {
    log('❌', `${name} error: ${err.message}`);
  });
  
  return proc;
}

async function waitForService(url, name, timeout = 60000) {
  log('⏳', `Waiting for ${name} at ${url}...`);
  try {
    await waitOn({
      resources: [url],
      timeout,
      interval: 1000,
      window: 1000,
      validateStatus: (status) => status >= 200 && status < 500,
    });
    log('✅', `${name} ready!`);
  } catch (error) {
    log('❌', `${name} failed to start: ${error.message}`);
    throw error;
  }
}

async function main() {
  log('🎭', 'Starting E2E Environment...\n');
  
  try {
    // 1. Start Firebase emulators
    const firestorePort = process.env.FIRESTORE_EMULATOR_HOST?.split(':')[1] || '8081';
    const authPort = process.env.FIREBASE_AUTH_EMULATOR_HOST?.split(':')[1] || '9100';
    
    startService(
      'Firebase Emulators',
      `npx firebase-tools emulators:start --project=${process.env.FIREBASE_PROJECT_ID || 'demo-project'} --config firebase.e2e.json --import=./emulator-data-e2e --export-on-exit=./emulator-data-e2e`,
      '..'
    );
    await waitForService(`http://localhost:${firestorePort}`, 'Firestore Emulator', 90000);
    await waitForService(`http://localhost:${authPort}`, 'Auth Emulator', 90000);
    
    // 2. Start backend
    startService(
      'Backend',
      'yarn dev',
      '../backend'
    );
    await waitForService(`http://localhost:${process.env.PORT || 3101}/health`, 'Backend', 120000);
    
    // 3. Start frontend
    startService(
      'Frontend',
      'yarn dev',
      '../frontend'
    );
    await waitForService(`http://localhost:${process.env.VITE_PORT || 3100}`, 'Frontend', 90000);
    
    log('\n✅', 'E2E Environment is ready!');
    log('', '');
    log('📍', 'Emulator UI: http://localhost:4001');
    log('🔧', 'Backend:     http://localhost:3101');
    log('💻', 'Frontend:    http://localhost:3100');
    log('', '');
    log('', 'Now run tests with:');
    log('', '  cd e2e && SKIP_WEBSERVER=1 yarn test:headed');
    log('', '');
    log('', 'Press Ctrl+C to stop all services\n');
    
    // Handle shutdown
    process.on('SIGINT', () => {
      log('\n🛑', 'Shutting down services...');
      services.forEach(({ name, proc }) => {
        log('🛑', `Killing ${name}...`);
        proc.kill('SIGTERM');
      });
      setTimeout(() => {
        services.forEach(({ proc }) => proc.kill('SIGKILL'));
        process.exit(0);
      }, 2000);
    });
    
    // Keep script running
    await new Promise(() => {});
    
  } catch (error) {
    log('❌', `Startup failed: ${error.message}`);
    services.forEach(({ proc }) => proc.kill());
    process.exit(1);
  }
}

main();

