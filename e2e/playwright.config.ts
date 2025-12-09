/**
 * @file Playwright E2E Test Configuration
 */

import { defineConfig, devices } from '@playwright/test';

console.log('PLAYWRIGHT CONFIG: SKIP_WEBSERVER =', process.env.SKIP_WEBSERVER);

export default defineConfig({
  testDir: './',
  testIgnore: ['**/langgraph-studio.spec.ts'], // Studio server not started in E2E env
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  timeout: 60000, // 60s per test
  globalTimeout: 600000, // 10min total

  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Firefox and WebKit disabled by default for faster e2e runs
    // Uncomment to test cross-browser compatibility
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // webServer: Auto-starts all required services (emulators, backend, frontend)
  // Set SKIP_WEBSERVER=1 to disable if services are already running
  // webServer: Auto-starts all required services (emulators, backend, frontend)
  // Set SKIP_WEBSERVER=1 to disable if services are already running
  webServer:
    process.env.SKIP_WEBSERVER === '1'
      ? undefined
      : [
          // 1. Start Firebase emulators first (required by backend)
          // Uses separate emulator-data-e2e folder to isolate from dev environment
          // E2E emulator UI runs on port 4001 (dev uses 4000)
          {
            command:
              'cd .. && firebase emulators:start --config firebase.e2e.json --import=./emulator-data-e2e --export-on-exit=./emulator-data-e2e',
            url: 'http://localhost:8081', // E2E Firestore health check (dev uses 8080)
            reuseExistingServer: true,
            timeout: 180000, // Emulators take longer to start
          },
          // 2. Start backend (depends on emulators)
          // E2E backend runs on port 3101 (dev uses 3001)
          {
            command:
              'cd ../backend && PORT=3101 FIRESTORE_EMULATOR_HOST=localhost:8081 FIREBASE_AUTH_EMULATOR_HOST=localhost:9100 yarn dev',
            url: 'http://localhost:3101',
            reuseExistingServer: true,
            timeout: 180000, // Backend needs time for worker pool initialization
          },
          // 3. Start frontend
          // E2E frontend runs on port 3100 (dev uses 3000)
          {
            command: 'cd ../frontend && VITE_PORT=3100 VITE_API_URL=http://localhost:3101 yarn dev',
            url: 'http://localhost:3100',
            reuseExistingServer: true,
            timeout: 60000, // Vite needs time to build
          },
        ],
});
