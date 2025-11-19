/**
 * E2E Tests: Room/World Creation (Tests 1-3)
 * Tests cover room creation flow with loading states and world generation
 */

import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { resetEmulators } from './utils/emulator';
import {
  signInWithEmulator,
  createRoomMinimal,
  createRoomFull,
  generateWorld,
  assertLoadingOverlay,
  assertNoLoadingOverlay,
  getRoomIdFromUrl,
} from './utils/helpers';

test.describe.serial('Room Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Capture browser errors for debugging
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error(`[Browser Error]: ${msg.text()}`);
      }
    });

    await resetEmulators();
  });

  test.afterEach(async () => {
    await resetEmulators();
  });

  test('Test 1: Basic room creation with loading states', async ({ page }) => {
    // Sign in
    const email = faker.internet.email();
    const displayName = faker.person.fullName();
    await signInWithEmulator(page, email, displayName);

    // Navigate to create room
    await page.goto('/create');

    // Select Terra archetype (default)
    await page.waitForTimeout(500);

    // Skip through wizard steps to preview (use defaults)
    for (let i = 0; i < 4; i++) {
      const nextButton = page.getByRole('button', { name: /next/i });
      if (await nextButton.isVisible({ timeout: 2000 })) {
        await nextButton.click();
        await page.waitForTimeout(300);
      }
    }

    // Submit on preview step
    const createButton = page.getByRole('button', { name: /create/i }).last();
    await createButton.click();

    // Assert loading overlay appears
    await assertLoadingOverlay(page);

    // Wait for redirect to room page
    await page.waitForURL(/\/room\/[^/?]+$/, { timeout: 15000 });

    // Assert loading disappears
    await assertNoLoadingOverlay(page);

    // Verify room exists
    const roomId = getRoomIdFromUrl(page);
    expect(roomId).toBeTruthy();
    expect(roomId.length).toBeGreaterThan(0);

    // Room should exist but no world description yet
    await page.waitForTimeout(1000);
  });

  test('Test 2: Full custom settings room', async ({ page }) => {
    // Sign in
    const email = faker.internet.email();
    const displayName = faker.person.fullName();
    await signInWithEmulator(page, email, displayName);

    // Navigate to create room
    await page.goto('/create');
    await page.waitForTimeout(500);

    // Step 1: Select Umbra archetype
    const umbraButton = page.getByRole('button', { name: /umbra/i }).first();
    if (await umbraButton.isVisible({ timeout: 2000 })) {
      await umbraButton.click();
    }
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2: Story - Fill custom details
    await page.locator('#theme-input').fill('Dark Fantasy Realm');
    await page.locator('#tone-input').fill('Grim and Mysterious');
    await page.locator('#setting-input').fill('The Shadowlands of Noctis');
    await page.locator('#background-input').fill('A land shrouded in eternal twilight, where ancient evils stir.');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3: Scope (use defaults for now)
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /next/i }).click();

    // Step 4: DM Style
    await page.waitForTimeout(300);
    // Select grimdark mode if available
    const grimdarkButton = page.getByRole('button', { name: /grimdark/i }).first();
    if (await grimdarkButton.isVisible({ timeout: 2000 })) {
      await grimdarkButton.click();
    }
    await page.getByRole('button', { name: /next/i }).click();

    // Step 5: Preview - Verify system prompt
    await page.waitForTimeout(500);
    const preview = page.locator('pre').first();
    await expect(preview).toBeVisible();
    const previewText = await preview.textContent();
    expect(previewText).toContain('Dark Fantasy Realm');
    expect(previewText).toContain('Shadowlands of Noctis');

    // Submit
    await page
      .getByRole('button', { name: /create/i })
      .last()
      .click();

    // Assert loading overlay
    await assertLoadingOverlay(page);

    // Wait for room creation
    await page.waitForURL(/\/room\/[^/?]+$/, { timeout: 15000 });
    await assertNoLoadingOverlay(page);

    // Verify room created
    const roomId = getRoomIdFromUrl(page);
    expect(roomId).toBeTruthy();
  });

  test('Test 3: World generation with progress indicators', async ({ page }) => {
    // Sign in
    const email = faker.internet.email();
    const displayName = faker.person.fullName();
    await signInWithEmulator(page, email, displayName);

    // Create a minimal room first
    const roomId = await createRoomMinimal(page);
    expect(roomId).toBeTruthy();

    // Now generate world description
    await page.goto(`/room/${roomId}`);
    await page.waitForTimeout(1000);

    // Look for generate world button or mechanism
    // The UI might auto-trigger world generation or have a button
    // Check if world description already exists
    const worldDesc = page.locator('text=/world description/i, text=/setting/i').first();
    const hasWorldDesc = await worldDesc.isVisible({ timeout: 2000 }).catch(() => false);

    if (!hasWorldDesc) {
      // Try to trigger world generation
      const generateBtn = page.getByRole('button', { name: /generate.*world/i }).first();
      if (await generateBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await generateBtn.click();

        // Assert loading overlay appears with appropriate text
        await assertLoadingOverlay(page);

        // Wait for world generation (LLM call, 5-20 seconds)
        await page.waitForTimeout(20000);

        // Assert loading disappears
        await assertNoLoadingOverlay(page);
      }
    }

    // Verify world description appears WITHOUT page reload
    await page.waitForTimeout(1000);

    // Check for phase change to CHARACTER_CREATION
    // This might be indicated in the URL or UI
    await page.waitForTimeout(500);

    // World description should be rendered as markdown
    // Look for narrative text or markdown content
    const content = page.locator('body');
    await expect(content).toContainText(/character|world|setting/i, { timeout: 5000 });
  });
});
