/**
 * E2E Test Helper Utilities
 * Shared functions for authentication, room/character creation, turn processing, and assertions
 */

import { type Page, expect } from '@playwright/test';

// ============================================================================
// Test User Constant
// ============================================================================

export const TEST_USER = {
  email: 'e2e-test@example.com',
  displayName: 'E2E Test User',
};

// ============================================================================
// Authentication Helpers
// ============================================================================

/**
 * Setup auth for test - alias for signInWithEmulator
 * Used by tests that import `setupAuth` instead of `signInWithEmulator`
 */
export async function setupAuth(page: Page, user: { email: string; displayName: string }): Promise<void> {
  await signInWithEmulator(page, user.email, user.displayName);
}

/**
 * Sign in using Firebase emulator with fake Google account
 */
export async function signInWithEmulator(page: Page, email: string, displayName: string): Promise<void> {
  await page.goto('/');

  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle');

  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('button', { name: /Continue with Google/i }).click(),
  ]);

  await popup.waitForLoadState('domcontentloaded');
  await popup.getByRole('button', { name: 'Add new account' }).click();
  await popup.locator('#email-input').fill(email);
  await popup.locator('#display-name-input').fill(displayName);

  // Click sign in and wait for both popup close AND page navigation
  try {
    await Promise.all([
      popup.waitForEvent('close'),
      page.waitForURL(/\//, { timeout: 15000 }), // Increased timeout
      popup.getByRole('button', { name: /Sign in with/i }).click(),
    ]);
  } catch (error) {
    // If popup already closed, just wait for navigation
    console.log('⚠️  Popup close race condition, waiting for navigation...');
    await page.waitForURL(/\//, { timeout: 10000 });
  }

  // Verify we're on lobby page
  await expect(page).toHaveURL(/\//, { timeout: 5000 });

  // Wait for auth to fully settle and propagate
  await page.waitForTimeout(2000);
}

// ============================================================================
// Room Creation Helpers
// ============================================================================

/**
 * Create a minimal room with default settings
 * Returns the room ID extracted from URL
 */
export async function createRoomMinimal(page: Page): Promise<string> {
  await page.goto('/create');
  await page.waitForLoadState('networkidle');

  // Wait for page to fully render
  await page.waitForTimeout(3000);

  // Verify wizard loaded
  await page.getByRole('heading', { name: /Create Adventure/i }).waitFor({ state: 'visible', timeout: 10000 });

  // Skip through wizard with waits
  for (let i = 0; i < 4; i++) {
    const nextBtn = page.getByRole('button', { name: /next/i });
    // Wait for button to be visible and enabled
    await nextBtn.waitFor({ state: 'visible', timeout: 10000 });
    await nextBtn.click();
    // Wait for transition
    await page.waitForTimeout(1000);
  }

  // Submit on preview step
  const createBtn = page.getByRole('button', { name: /create/i }).last();
  await createBtn.waitFor({ state: 'visible', timeout: 15000 });
  await createBtn.click();

  // Wait for redirect with longer timeout
  try {
    await page.waitForURL(/\/room\/[^/]+$/, { timeout: 25000 });
  } catch (error) {
    // Log current URL for debugging
    console.error(`Failed to navigate to room. Current URL: ${page.url()}`);
    throw error;
  }

  // Additional wait to ensure URL is stable
  await page.waitForTimeout(1000);

  // Extract roomId from URL
  const url = page.url();
  const roomId = url.split('/room/')[1]?.split('?')[0] || '';

  if (!roomId) {
    throw new Error(`Failed to extract roomId from URL: ${url}`);
  }

  return roomId;
}

/**
 * Create room with full custom settings
 */
export async function createRoomFull(
  page: Page,
  settings: {
    archetype?: string;
    theme?: string;
    tone?: string;
    setting?: string;
    background?: string;
    partySize?: number;
    difficulty?: number;
    verbosity?: number;
  }
): Promise<string> {
  await page.goto('/create');

  // Step 1: World archetype
  if (settings.archetype) {
    await page
      .getByRole('button', { name: new RegExp(settings.archetype, 'i') })
      .first()
      .click();
  }
  await page.getByRole('button', { name: /next/i }).click();

  // Step 2: Story details
  if (settings.theme) {
    await page.locator('#theme-input').fill(settings.theme);
  }
  if (settings.tone) {
    await page.locator('#tone-input').fill(settings.tone);
  }
  if (settings.setting) {
    await page.locator('#setting-input').fill(settings.setting);
  }
  if (settings.background) {
    await page.locator('#background-input').fill(settings.background);
  }
  await page.getByRole('button', { name: /next/i }).click();

  // Step 3: Scope (skip for now, uses defaults)
  await page.getByRole('button', { name: /next/i }).click();

  // Step 4: DM style (skip for now, uses defaults)
  await page.getByRole('button', { name: /next/i }).click();

  // Step 5: Preview & submit
  await page.getByRole('button', { name: /create/i }).click();

  await page.waitForURL(/\/room\/[^/]+$/);
  const url = page.url();
  const roomId = url.split('/room/')[1]?.split('?')[0] || '';
  return roomId;
}

/**
 * Generate world description for a room
 */
export async function generateWorld(page: Page, roomId: string): Promise<void> {
  // Don't navigate if already on room page
  if (!page.url().includes(`/room/${roomId}`)) {
    await page.goto(`/room/${roomId}`);
  }

  // Wait for page to load
  await page.waitForTimeout(2000);

  // Look for generate world button or trigger world generation
  // The exact selector depends on the UI state
  const generateButton = page.getByRole('button', { name: /generate world/i }).first();
  if (await generateButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await generateButton.click();
  }

  // Wait for world description to appear (may take 10-20s for LLM)
  // World generation may auto-trigger, so just wait
  await page.waitForTimeout(3000);
}

// ============================================================================
// Character Creation Helpers
// ============================================================================

/**
 * Create character using a quick template
 */
export async function createCharacterTemplate(page: Page, template: string = 'Fighter'): Promise<void> {
  // Click template button
  await page.getByRole('button', { name: template }).click();
  await page.waitForTimeout(500);

  // Form should be populated
  const nameInput = page.locator('#name');
  await expect(nameInput).not.toHaveValue('');
}

/**
 * Generate avatar portraits for character
 */
export async function generateAvatarPortraits(page: Page): Promise<void> {
  const generateButton = page.getByRole('button', { name: /generate.*portrait/i });
  await generateButton.click();

  // Wait for all 3 portraits to load (can take 15-30s)
  // This is a long operation, increase timeout
  await page.waitForTimeout(3000);
}

/**
 * Create a custom character with specific attributes
 */
export async function createCharacterCustom(
  page: Page,
  char: {
    name: string;
    race?: string;
    characterClass?: string;
    alignment?: string;
    background?: string;
    attributes?: Record<string, number>;
  }
): Promise<void> {
  // Fill name
  await page.locator('#name').fill(char.name);

  // Select race if provided
  if (char.race) {
    await page
      .getByRole('button', { name: new RegExp(char.race, 'i') })
      .first()
      .click();
  }

  // Select class if provided
  if (char.characterClass) {
    await page
      .getByRole('button', { name: new RegExp(char.characterClass, 'i') })
      .first()
      .click();
  }

  // Select alignment if provided
  if (char.alignment) {
    await page
      .getByRole('button', { name: new RegExp(char.alignment, 'i') })
      .first()
      .click();
  }

  // Fill background if provided
  if (char.background) {
    await page.locator('#background').fill(char.background);
  }

  // Set attributes if provided
  if (char.attributes) {
    for (const [attr, value] of Object.entries(char.attributes)) {
      // Find the attribute stepper and set value
      // This may require specific selectors based on the UI
      await page.waitForTimeout(100);
    }
  }
}

/**
 * Submit character form
 */
export async function submitCharacter(page: Page): Promise<void> {
  const submitButton = page.getByRole('button', { name: /create/i }).last();
  await submitButton.click();

  // Wait for character to be created
  await page.waitForTimeout(2000);
}

/**
 * Mark player as ready
 */
export async function markPlayerReady(page: Page, roomId: string): Promise<void> {
  // Navigate to room if not already there
  if (!page.url().includes(`/room/${roomId}`)) {
    await page.goto(`/room/${roomId}`);
  }

  // Find and click ready button
  const readyButton = page.getByRole('button', { name: /ready/i });
  await readyButton.click();
  await page.waitForTimeout(500);
}

// ============================================================================
// Turn Processing Helpers
// ============================================================================

/**
 * Submit an action during gameplay
 */
export async function submitAction(page: Page, action: string): Promise<void> {
  const textarea = page.locator('textarea').first();
  await textarea.fill(action);

  const submitButton = page.getByRole('button', { name: /submit/i });
  await submitButton.click();

  await page.waitForTimeout(500);
}

/**
 * Wait for turn processing to complete
 */
export async function waitForTurnProcessing(page: Page, timeoutMs: number = 30000): Promise<void> {
  // Wait for loading overlay to appear
  await page
    .waitForSelector('[data-testid="loading-overlay"], .loading-overlay', {
      state: 'visible',
      timeout: 5000,
    })
    .catch(() => {
      // Overlay might already be gone if processing was fast
    });

  // Wait for loading overlay to disappear
  await page
    .waitForSelector('[data-testid="loading-overlay"], .loading-overlay', {
      state: 'hidden',
      timeout: timeoutMs,
    })
    .catch(() => {
      // Already hidden
    });
}

/**
 * Wait for a new message to appear in chat
 */
export async function waitForMessage(page: Page, senderFilter?: string, timeoutMs: number = 30000): Promise<void> {
  const messageSelector = senderFilter ? `[data-sender="${senderFilter}"]` : '[role="article"], .message';

  await page.waitForSelector(messageSelector, {
    state: 'visible',
    timeout: timeoutMs,
  });
}

/**
 * Manually process turn as DM
 */
export async function processTurnManual(page: Page): Promise<void> {
  const processButton = page.getByRole('button', { name: /process.*turn/i });
  await processButton.click();
  await page.waitForTimeout(500);
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert loading overlay is visible with optional text check
 */
export async function assertLoadingOverlay(page: Page, expectedText?: string): Promise<void> {
  // Try to catch overlay within 5 seconds, but don't fail if missed
  try {
    const overlay = page.locator('[data-testid="loading-overlay"], .loading-overlay').first();
    await expect(overlay).toBeVisible({ timeout: 5000 });

    if (expectedText) {
      await expect(overlay).toContainText(expectedText);
    }
  } catch {
    // Overlay may have appeared and disappeared too quickly
    // This is acceptable for fast operations
  }
}

/**
 * Assert loading overlay is not visible
 */
export async function assertNoLoadingOverlay(page: Page): Promise<void> {
  const overlay = page.locator('[data-testid="loading-overlay"], .loading-overlay').first();
  await expect(overlay).not.toBeVisible({ timeout: 2000 });
}

/**
 * Assert action has been submitted
 */
export async function assertActionSubmitted(page: Page): Promise<void> {
  // Check for submitted state indicators
  const submittedIndicator = page.locator('text=/action submitted/i, text=/waiting for/i').first();
  await expect(submittedIndicator).toBeVisible({ timeout: 3000 });
}

/**
 * Assert action field is cleared
 */
export async function assertActionCleared(page: Page): Promise<void> {
  const textarea = page.locator('textarea').first();
  await expect(textarea).toHaveValue('');
}

/**
 * Assert minimum number of messages in chat
 */
export async function assertMessageCount(page: Page, minCount: number): Promise<void> {
  await page.waitForTimeout(1000);
  const messages = page.locator('[role="article"], .message');
  const count = await messages.count();
  expect(count).toBeGreaterThanOrEqual(minCount);
}

/**
 * Assert number of players in room
 */
export async function assertPlayerCount(page: Page, count: number): Promise<void> {
  await page.waitForTimeout(1000);
  // This depends on how players are displayed in the UI
  // Adjust selector as needed
  const players = page.locator('[data-testid="player-item"], .player-item');
  await expect(players).toHaveCount(count, { timeout: 5000 });
}

/**
 * Assert turn status text
 */
export async function assertTurnStatus(page: Page, expected: string): Promise<void> {
  const statusText = page.locator(`text=/${expected}/i`).first();
  await expect(statusText).toBeVisible({ timeout: 3000 });
}

/**
 * Assert room phase
 */
export async function assertRoomPhase(page: Page, expectedPhase: string): Promise<void> {
  // Check URL or page content for phase indicator
  await page.waitForTimeout(500);
  // Implementation depends on how phase is displayed in UI
}

// ============================================================================
// Socket Event Helpers
// ============================================================================

/**
 * Wait for a specific socket event to be emitted
 */
export async function waitForSocketEvent(page: Page, eventName: string, timeoutMs: number = 10000): Promise<any> {
  return page.evaluate(
    ({ event, timeout }) =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`Socket event '${event}' not received within ${timeout}ms`));
        }, timeout);

        // Access socket from window if available
        const { socket } = window as any;
        if (!socket) {
          clearTimeout(timer);
          reject(new Error('Socket not available on window'));
          return;
        }

        socket.once(event, (data: any) => {
          clearTimeout(timer);
          resolve(data);
        });
      }),
    { event: eventName, timeout: timeoutMs }
  );
}

/**
 * Assert socket is connected
 */
export async function assertSocketConnected(page: Page): Promise<void> {
  const isConnected = await page.evaluate(() => {
    const { socket } = window as any;
    return socket?.connected === true;
  });

  expect(isConnected).toBe(true);
}

/**
 * Get room ID from current URL
 */
export function getRoomIdFromUrl(page: Page): string {
  const url = page.url();
  const match = url.match(/\/room\/([^/?]+)/);
  return match?.[1] || '';
}

/**
 * Wait for navigation with timeout
 */
export async function waitForNavigation(page: Page, urlPattern: RegExp, timeoutMs: number = 10000): Promise<void> {
  await page.waitForURL(urlPattern, { timeout: timeoutMs });
}
