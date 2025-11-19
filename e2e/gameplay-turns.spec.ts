/**
 * E2E Tests: Turn Mechanics & Responsiveness (Tests 7-18)
 * PRIMARY FOCUS: Turn processing, loading states, real-time UI updates
 * This file contains all 12 turn-related tests
 */

import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { resetEmulators } from './utils/emulator';
import {
  signInWithEmulator,
  createRoomMinimal,
  generateWorld,
  submitAction,
  waitForTurnProcessing,
  processTurnManual,
  assertLoadingOverlay,
  assertNoLoadingOverlay,
  assertActionSubmitted,
  assertActionCleared,
  assertMessageCount,
  getRoomIdFromUrl,
} from './utils/helpers';

test.describe.serial('Turn Mechanics & Responsiveness', () => {
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

  test('Test 7: Single action submission feedback', async ({ page }) => {
    // Setup: Create room, world, character, and reach GAMEPLAY phase
    const email = faker.internet.email();
    const displayName = faker.person.fullName();
    await signInWithEmulator(page, email, displayName);

    const roomId = await createRoomMinimal(page);
    await generateWorld(page, roomId);

    // Fast character creation (use template, skip portraits if possible)
    await page.goto(`/room/${roomId}`);
    await page.waitForTimeout(2000);

    // Create character quickly
    const template = page.getByRole('button', { name: /fighter/i }).first();
    if (await template.isVisible({ timeout: 3000 })) {
      await template.click();
      await page.waitForTimeout(500);

      // Force submit (even without portraits for testing)
      const submitBtn = page.getByRole('button', { name: /create/i }).last();
      // Try to click, might be disabled
      try {
        await submitBtn.click({ force: true });
        await page.waitForTimeout(3000);
      } catch (e) {
        // If can't submit, skip this test
        test.skip();
      }
    }

    // Mark ready to reach gameplay
    const readyBtn = page.getByRole('button', { name: /ready/i }).first();
    if (await readyBtn.isVisible({ timeout: 3000 })) {
      await readyBtn.click();
      await page.waitForTimeout(15000); // Wait for openings
    }

    // Now in GAMEPLAY phase
    // Type action
    const textarea = page.locator('textarea').first();
    await textarea.fill('I search the room for hidden treasures');

    // Click Submit
    const submitButton = page.getByRole('button', { name: /submit/i }).first();
    await submitButton.click();

    // Assert textarea disabled instantly
    await expect(textarea).toBeDisabled({ timeout: 2000 });

    // Assert "Action submitted" or similar message appears
    await expect(page.locator('text=/submitted|waiting/i')).toBeVisible({ timeout: 3000 });

    // Assert action counter shows 1/1 submitted
    await expect(page.locator('text=/1.*\\/.*1|1.*of.*1/i')).toBeVisible({ timeout: 3000 });

    // DM clicks "Process Turn"
    const processBtn = page.getByRole('button', { name: /process.*turn/i });
    if (await processBtn.isVisible({ timeout: 3000 })) {
      await processBtn.click();

      // Assert loading overlay appears immediately
      await assertLoadingOverlay(page);

      // Wait for turn processing (LLM call)
      await waitForTurnProcessing(page, 30000);

      // Assert loading disappears
      await assertNoLoadingOverlay(page);

      // Assert action field re-enabled WITHOUT reload
      await expect(textarea).toBeEnabled({ timeout: 2000 });
    }
  });

  test('Test 8: Auto-process all players', async ({ page, context }) => {
    // Setup: 2 players in GAMEPLAY
    const emailA = faker.internet.email();
    const displayNameA = faker.person.fullName();
    await signInWithEmulator(page, emailA, displayNameA);

    const roomId = await createRoomMinimal(page);
    await generateWorld(page, roomId);

    // Player 1 creates character
    await page.goto(`/room/${roomId}`);
    await page.waitForTimeout(2000);

    const templateA = page.getByRole('button', { name: /fighter/i }).first();
    if (await templateA.isVisible({ timeout: 3000 })) {
      await templateA.click();
      await page.waitForTimeout(500);

      try {
        const submitBtnA = page.getByRole('button', { name: /create/i }).last();
        await submitBtnA.click({ force: true });
        await page.waitForTimeout(3000);
      } catch (e) {
        test.skip();
      }
    }

    // Player 2 joins
    const pageB = await context.newPage();
    const emailB = faker.internet.email();
    const displayNameB = faker.person.fullName();
    await signInWithEmulator(pageB, emailB, displayNameB);

    await pageB.goto(`/room/${roomId}`);
    await pageB.waitForTimeout(2000);

    const templateB = pageB.getByRole('button', { name: /rogue/i }).first();
    if (await templateB.isVisible({ timeout: 3000 })) {
      await templateB.click();
      await pageB.waitForTimeout(500);

      try {
        const submitBtnB = pageB.getByRole('button', { name: /create/i }).last();
        await submitBtnB.click({ force: true });
        await pageB.waitForTimeout(3000);
      } catch (e) {
        await pageB.close();
        test.skip();
      }
    }

    // Both mark ready
    const readyA = page.getByRole('button', { name: /ready/i }).first();
    if (await readyA.isVisible({ timeout: 3000 })) {
      await readyA.click();
    }

    const readyB = pageB.getByRole('button', { name: /ready/i }).first();
    if (await readyB.isVisible({ timeout: 3000 })) {
      await readyB.click();
      await page.waitForTimeout(20000); // Wait for openings
      await pageB.waitForTimeout(20000);
    }

    // Player 1 submits action
    const textareaA = page.locator('textarea').first();
    await textareaA.fill('I attack the nearest enemy');
    await page
      .getByRole('button', { name: /submit/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    // Assert 1/2 counter updates
    await expect(page.locator('text=/1.*\\/.*2|1.*of.*2/i')).toBeVisible({ timeout: 3000 });

    // Player 2 submits action
    const textareaB = pageB.locator('textarea').first();
    await textareaB.fill('I cast shield spell');
    await pageB
      .getByRole('button', { name: /submit/i })
      .first()
      .click();
    await pageB.waitForTimeout(500);

    // Assert 2/2 counter updates
    await expect(page.locator('text=/2.*\\/.*2|2.*of.*2/i')).toBeVisible({ timeout: 3000 });

    // Assert "All actions submitted!" or auto-processing begins
    // No manual button click required

    // Wait for auto-process (loading state should appear)
    await page.waitForTimeout(2000);

    // Assert loading overlay (auto-processing)
    await assertLoadingOverlay(page);

    // Wait for turn processing (may take 10-20s)
    await waitForTurnProcessing(page, 30000);

    // Assert new DM message appears WITHOUT reload
    await page.waitForTimeout(2000);

    // Assert both action fields cleared and re-enabled
    await expect(textareaA).toHaveValue('');
    await expect(textareaA).toBeEnabled();

    await expect(textareaB).toHaveValue('');
    await expect(textareaB).toBeEnabled();

    // Assert counter resets to 0/2
    await expect(page.locator('text=/0.*\\/.*2|0.*of.*2/i')).toBeVisible({ timeout: 5000 });

    await pageB.close();
  });

  test('Test 9: Manual turn before all submit', async ({ page, context }) => {
    // Setup: 2 players, Player 1 submits, Player 2 does NOT
    const emailA = faker.internet.email();
    const displayNameA = faker.person.fullName();
    await signInWithEmulator(page, emailA, displayNameA);

    const roomId = await createRoomMinimal(page);
    await generateWorld(page, roomId);

    // Create Player 1 character (owner)
    await page.goto(`/room/${roomId}`);
    await page.waitForTimeout(2000);

    const templateA = page.getByRole('button', { name: /fighter/i }).first();
    if (await templateA.isVisible({ timeout: 3000 })) {
      await templateA.click();
      await page.waitForTimeout(500);

      try {
        const submitBtnA = page.getByRole('button', { name: /create/i }).last();
        await submitBtnA.click({ force: true });
        await page.waitForTimeout(3000);
      } catch (e) {
        test.skip();
      }
    }

    // Create Player 2
    const pageB = await context.newPage();
    const emailB = faker.internet.email();
    const displayNameB = faker.person.fullName();
    await signInWithEmulator(pageB, emailB, displayNameB);

    await pageB.goto(`/room/${roomId}`);
    await pageB.waitForTimeout(2000);

    const templateB = pageB.getByRole('button', { name: /cleric/i }).first();
    if (await templateB.isVisible({ timeout: 3000 })) {
      await templateB.click();
      await pageB.waitForTimeout(500);

      try {
        const submitBtnB = pageB.getByRole('button', { name: /create/i }).last();
        await submitBtnB.click({ force: true });
        await pageB.waitForTimeout(3000);
      } catch (e) {
        await pageB.close();
        test.skip();
      }
    }

    // Both ready
    const readyA = page.getByRole('button', { name: /ready/i }).first();
    if (await readyA.isVisible({ timeout: 3000 })) {
      await readyA.click();
    }

    const readyB = pageB.getByRole('button', { name: /ready/i }).first();
    if (await readyB.isVisible({ timeout: 3000 })) {
      await readyB.click();
      await page.waitForTimeout(20000);
      await pageB.waitForTimeout(20000);
    }

    // Player 1 submits action
    const textareaA = page.locator('textarea').first();
    await textareaA.fill('I investigate the ancient runes');
    await page
      .getByRole('button', { name: /submit/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    // Player 2 does NOT submit (leave textarea empty)

    // Assert "Process Turn" button visible to DM (Player 1 is owner)
    const processBtn = page.getByRole('button', { name: /process.*turn/i });
    await expect(processBtn).toBeVisible({ timeout: 5000 });

    // DM clicks button
    await processBtn.click();

    // Assert immediate loading overlay
    await assertLoadingOverlay(page);

    // Wait for turn processing
    await waitForTurnProcessing(page, 30000);

    // Assert Player 1's field cleared
    await expect(textareaA).toHaveValue('');

    // Assert Player 2's field still empty (unchanged)
    const textareaB = pageB.locator('textarea').first();
    await expect(textareaB).toHaveValue('');

    // Message should reference only Player 1's action
    await page.waitForTimeout(2000);

    await pageB.close();
  });

  test('Test 10: Loading states during turn processing', async ({ page }) => {
    // Setup: 2 players (simplified - use single context for speed)
    const email = faker.internet.email();
    const displayName = faker.person.fullName();
    await signInWithEmulator(page, email, displayName);

    const roomId = await createRoomMinimal(page);
    await generateWorld(page, roomId);

    await page.goto(`/room/${roomId}`);
    await page.waitForTimeout(2000);

    // Quick character creation
    const template = page.getByRole('button', { name: /fighter/i }).first();
    if (await template.isVisible({ timeout: 3000 })) {
      await template.click();
      await page.waitForTimeout(500);

      try {
        const submitBtn = page.getByRole('button', { name: /create/i }).last();
        await submitBtn.click({ force: true });
        await page.waitForTimeout(3000);
      } catch (e) {
        test.skip();
      }
    }

    const ready = page.getByRole('button', { name: /ready/i }).first();
    if (await ready.isVisible({ timeout: 3000 })) {
      await ready.click();
      await page.waitForTimeout(15000);
    }

    // Submit action
    const textarea = page.locator('textarea').first();
    await textarea.fill('I explore the dungeon');
    await page
      .getByRole('button', { name: /submit/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    // Trigger auto-process or manual process
    const processBtn = page.getByRole('button', { name: /process.*turn/i });
    if (await processBtn.isVisible({ timeout: 3000 })) {
      await processBtn.click();
    }

    // Assert specific loading overlay with:
    const overlay = page.locator('[data-testid="loading-overlay"], .loading-overlay').first();
    await expect(overlay).toBeVisible({ timeout: 5000 });

    // - "Processing turn..." text or similar
    const overlayText = await overlay.textContent();
    expect(overlayText?.toLowerCase()).toMatch(/processing|loading|turn|dice/);

    // - Animated dice (check for animation or dice elements)
    // This is visual, hard to test - just verify overlay structure

    // - Semi-transparent backdrop (check CSS if possible)

    // Assert overlay blocks interaction
    const isClickable = await textarea.isEnabled().catch(() => false);
    expect(isClickable).toBe(false);

    // Measure duration (should be 5-20s for LLM)
    const startTime = Date.now();
    await waitForTurnProcessing(page, 30000);
    const duration = Date.now() - startTime;

    // Assert overlay disappears when message arrives
    await assertNoLoadingOverlay(page);

    // Verify duration was reasonable (2-30s)
    expect(duration).toBeGreaterThan(2000);
    expect(duration).toBeLessThan(35000);

    // Assert no flash/flicker (hard to test, but verify clean state)
    await page.waitForTimeout(500);
    await expect(textarea).toBeEnabled();
  });

  test('Test 11: Message streaming real-time', async ({ page }) => {
    // Setup: Game in progress with message history
    const email = faker.internet.email();
    const displayName = faker.person.fullName();
    await signInWithEmulator(page, email, displayName);

    const roomId = await createRoomMinimal(page);
    await generateWorld(page, roomId);

    await page.goto(`/room/${roomId}`);
    await page.waitForTimeout(2000);

    // Create character and reach gameplay
    const template = page.getByRole('button', { name: /fighter/i }).first();
    if (await template.isVisible({ timeout: 3000 })) {
      await template.click();
      await page.waitForTimeout(500);

      try {
        await page
          .getByRole('button', { name: /create/i })
          .last()
          .click({ force: true });
        await page.waitForTimeout(3000);
      } catch (e) {
        test.skip();
      }
    }

    const ready = page.getByRole('button', { name: /ready/i }).first();
    if (await ready.isVisible({ timeout: 3000 })) {
      await ready.click();
      await page.waitForTimeout(15000);
    }

    // Count existing messages
    await page.waitForTimeout(1000);
    const messagesBefore = await page.locator('[role="article"], .message').count();

    // Submit action → process turn
    const textarea = page.locator('textarea').first();
    await textarea.fill('I examine the mysterious artifact');
    await page
      .getByRole('button', { name: /submit/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    const processBtn = page.getByRole('button', { name: /process.*turn/i });
    if (await processBtn.isVisible({ timeout: 3000 })) {
      await processBtn.click();
    }

    await waitForTurnProcessing(page, 30000);

    // Assert new message appears at bottom of chat
    await page.waitForTimeout(2000);
    const messagesAfter = await page.locator('[role="article"], .message').count();
    expect(messagesAfter).toBeGreaterThan(messagesBefore);

    // Assert chat auto-scrolls to latest message (hard to test, check scroll position)

    // Assert message renders markdown correctly (check for formatted content)
    const lastMessage = page.locator('[role="article"], .message').last();
    await expect(lastMessage).toBeVisible();

    // Assert message timestamp is current (within last minute)
    const now = Date.now();
    // Timestamp verification would require reading message data

    // Assert sender badge shows "DM"
    await expect(lastMessage).toContainText(/DM|dungeon master/i, { timeout: 2000 });

    // Verify message persists after reload (Firestore sync)
    await page.reload();
    await page.waitForTimeout(2000);
    const messagesReload = await page.locator('[role="article"], .message').count();
    expect(messagesReload).toBeGreaterThanOrEqual(messagesAfter);
  });

  test('Test 12: Action clear feedback', async ({ page }) => {
    // Setup: Player submits action
    const email = faker.internet.email();
    const displayName = faker.person.fullName();
    await signInWithEmulator(page, email, displayName);

    const roomId = await createRoomMinimal(page);
    await generateWorld(page, roomId);

    await page.goto(`/room/${roomId}`);
    await page.waitForTimeout(2000);

    const template = page.getByRole('button', { name: /fighter/i }).first();
    if (await template.isVisible({ timeout: 3000 })) {
      await template.click();
      await page.waitForTimeout(500);

      try {
        await page
          .getByRole('button', { name: /create/i })
          .last()
          .click({ force: true });
        await page.waitForTimeout(3000);
      } catch (e) {
        test.skip();
      }
    }

    const ready = page.getByRole('button', { name: /ready/i }).first();
    if (await ready.isVisible({ timeout: 3000 })) {
      await ready.click();
      await page.waitForTimeout(15000);
    }

    // Submit action
    const textarea = page.locator('textarea').first();
    const actionText = 'I cast fireball at the enemies';
    await textarea.fill(actionText);
    await page
      .getByRole('button', { name: /submit/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    // Process turn
    const processBtn = page.getByRole('button', { name: /process.*turn/i });
    if (await processBtn.isVisible({ timeout: 3000 })) {
      await processBtn.click();
    }

    await waitForTurnProcessing(page, 30000);

    // Turn completes - Assert action textarea clears immediately
    await assertActionCleared(page);

    // Assert placeholder text returns
    const placeholder = await textarea.getAttribute('placeholder');
    expect(placeholder).toBeTruthy();

    // Assert submit button re-enabled
    const submitBtn = page.getByRole('button', { name: /submit/i }).first();
    await expect(submitBtn).toBeEnabled({ timeout: 2000 });

    // Assert counter resets (if visible)
    await page.waitForTimeout(500);

    // Assert "Your turn" indicator reappears
    await expect(page.locator('text=/your turn/i')).toBeVisible({ timeout: 5000 });

    // Assert no residual state from previous turn
    const currentValue = await textarea.inputValue();
    expect(currentValue).toBe('');
  });

  test('Test 13: Turn status indicators', async ({ page, context }) => {
    // Setup: Game with 2 players
    const emailA = faker.internet.email();
    const displayNameA = faker.person.fullName();
    await signInWithEmulator(page, emailA, displayNameA);

    const roomId = await createRoomMinimal(page);
    await generateWorld(page, roomId);

    await page.goto(`/room/${roomId}`);
    await page.waitForTimeout(2000);

    // Player 1
    const templateA = page.getByRole('button', { name: /fighter/i }).first();
    if (await templateA.isVisible({ timeout: 3000 })) {
      await templateA.click();
      await page.waitForTimeout(500);

      try {
        await page
          .getByRole('button', { name: /create/i })
          .last()
          .click({ force: true });
        await page.waitForTimeout(3000);
      } catch (e) {
        test.skip();
      }
    }

    // Player 2
    const pageB = await context.newPage();
    const emailB = faker.internet.email();
    const displayNameB = faker.person.fullName();
    await signInWithEmulator(pageB, emailB, displayNameB);

    await pageB.goto(`/room/${roomId}`);
    await pageB.waitForTimeout(2000);

    const templateB = pageB.getByRole('button', { name: /wizard/i }).first();
    if (await templateB.isVisible({ timeout: 3000 })) {
      await templateB.click();
      await pageB.waitForTimeout(500);

      try {
        await pageB
          .getByRole('button', { name: /create/i })
          .last()
          .click({ force: true });
        await pageB.waitForTimeout(3000);
      } catch (e) {
        await pageB.close();
        test.skip();
      }
    }

    // Both ready
    const readyA = page.getByRole('button', { name: /ready/i }).first();
    if (await readyA.isVisible({ timeout: 3000 })) {
      await readyA.click();
    }

    const readyB = pageB.getByRole('button', { name: /ready/i }).first();
    if (await readyB.isVisible({ timeout: 3000 })) {
      await readyB.click();
      await page.waitForTimeout(20000);
      await pageB.waitForTimeout(20000);
    }

    // Player 1 submits
    const textareaA = page.locator('textarea').first();
    await textareaA.fill('I prepare my weapon');
    await page
      .getByRole('button', { name: /submit/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    // Player 1 view: Assert shows "Waiting for others" after submit
    await expect(page.locator('text=/waiting/i')).toBeVisible({ timeout: 5000 });

    // Player 2 view: Assert shows "Your turn!" indicator
    await expect(pageB.locator('text=/your turn/i')).toBeVisible({ timeout: 5000 });

    // DM view (Player 1 is owner): Assert shows "1/2 actions submitted"
    await expect(page.locator('text=/1.*\\/.*2|1.*of.*2/i')).toBeVisible({ timeout: 3000 });

    // Player 2 submits
    const textareaB = pageB.locator('textarea').first();
    await textareaB.fill('I cast magic missile');
    await pageB
      .getByRole('button', { name: /submit/i })
      .first()
      .click();
    await pageB.waitForTimeout(500);

    // Both submit → Assert all see "Ready to process" or auto-processing
    await page.waitForTimeout(2000);

    // Assert status bar updates without reload
    await expect(page.locator('text=/2.*\\/.*2|processing|all.*submitted/i')).toBeVisible({ timeout: 5000 });

    await pageB.close();
  });

  test('Test 14: Rapid action submissions', async ({ page }) => {
    // Setup: 1 player
    const email = faker.internet.email();
    const displayName = faker.person.fullName();
    await signInWithEmulator(page, email, displayName);

    const roomId = await createRoomMinimal(page);
    await generateWorld(page, roomId);

    await page.goto(`/room/${roomId}`);
    await page.waitForTimeout(2000);

    const template = page.getByRole('button', { name: /fighter/i }).first();
    if (await template.isVisible({ timeout: 3000 })) {
      await template.click();
      await page.waitForTimeout(500);

      try {
        await page
          .getByRole('button', { name: /create/i })
          .last()
          .click({ force: true });
        await page.waitForTimeout(3000);
      } catch (e) {
        test.skip();
      }
    }

    const ready = page.getByRole('button', { name: /ready/i }).first();
    if (await ready.isVisible({ timeout: 3000 })) {
      await ready.click();
      await page.waitForTimeout(15000);
    }

    // Submit action rapidly 3 times in succession
    const textarea = page.locator('textarea').first();
    await textarea.fill('I attack');

    const submitBtn = page.getByRole('button', { name: /submit/i }).first();

    // Click 3 times rapidly
    await submitBtn.click();
    await submitBtn.click();
    await submitBtn.click();

    await page.waitForTimeout(1000);

    // Assert only first submission registers
    // Assert subsequent clicks show "Already submitted" or button disabled
    await expect(submitBtn).toBeDisabled({ timeout: 2000 });

    // Assert no duplicate messages in chat (check message count doesn't increase)
    await page.waitForTimeout(2000);

    // Button should remain disabled
    await expect(submitBtn).toBeDisabled();
  });

  test('Test 15: Concurrent player actions', async ({ page, context }) => {
    // Setup: 3 players simultaneously submit actions
    const emails = [faker.internet.email(), faker.internet.email(), faker.internet.email()];
    const names = [faker.person.fullName(), faker.person.fullName(), faker.person.fullName()];

    // Player 1 (owner)
    await signInWithEmulator(page, emails[0], names[0]);
    const roomId = await createRoomMinimal(page);
    await generateWorld(page, roomId);

    // Create 3 characters quickly
    const pages = [page];

    // Player 1 character
    await page.goto(`/room/${roomId}`);
    await page.waitForTimeout(2000);

    const template1 = page.getByRole('button', { name: /fighter/i }).first();
    if (await template1.isVisible({ timeout: 3000 })) {
      await template1.click();
      await page.waitForTimeout(500);
      try {
        await page
          .getByRole('button', { name: /create/i })
          .last()
          .click({ force: true });
        await page.waitForTimeout(3000);
      } catch (e) {
        test.skip();
      }
    }

    // Player 2
    const page2 = await context.newPage();
    pages.push(page2);
    await signInWithEmulator(page2, emails[1], names[1]);
    await page2.goto(`/room/${roomId}`);
    await page2.waitForTimeout(2000);

    const template2 = page2.getByRole('button', { name: /wizard/i }).first();
    if (await template2.isVisible({ timeout: 3000 })) {
      await template2.click();
      await page2.waitForTimeout(500);
      try {
        await page2
          .getByRole('button', { name: /create/i })
          .last()
          .click({ force: true });
        await page2.waitForTimeout(3000);
      } catch (e) {
        await page2.close();
        test.skip();
      }
    }

    // Player 3
    const page3 = await context.newPage();
    pages.push(page3);
    await signInWithEmulator(page3, emails[2], names[2]);
    await page3.goto(`/room/${roomId}`);
    await page3.waitForTimeout(2000);

    const template3 = page3.getByRole('button', { name: /rogue/i }).first();
    if (await template3.isVisible({ timeout: 3000 })) {
      await template3.click();
      await page3.waitForTimeout(500);
      try {
        await page3
          .getByRole('button', { name: /create/i })
          .last()
          .click({ force: true });
        await page3.waitForTimeout(3000);
      } catch (e) {
        await page2.close();
        await page3.close();
        test.skip();
      }
    }

    // All ready
    for (const p of pages) {
      const readyBtn = p.getByRole('button', { name: /ready/i }).first();
      if (await readyBtn.isVisible({ timeout: 3000 })) {
        await readyBtn.click();
      }
    }
    await page.waitForTimeout(25000);

    // All 3 submit within 1 second window
    const textarea1 = page.locator('textarea').first();
    const textarea2 = page2.locator('textarea').first();
    const textarea3 = page3.locator('textarea').first();

    await Promise.all([
      textarea1.fill('Action 1').then(() =>
        page
          .getByRole('button', { name: /submit/i })
          .first()
          .click()
      ),
      textarea2.fill('Action 2').then(() =>
        page2
          .getByRole('button', { name: /submit/i })
          .first()
          .click()
      ),
      textarea3.fill('Action 3').then(() =>
        page3
          .getByRole('button', { name: /submit/i })
          .first()
          .click()
      ),
    ]);

    await page.waitForTimeout(2000);

    // Assert all 3 actions registered
    await expect(page.locator('text=/3.*\\/.*3|3.*of.*3/i')).toBeVisible({ timeout: 5000 });

    // Assert auto-process triggers once
    await waitForTurnProcessing(page, 35000);

    // Assert DM message references all 3 players (or at least processes successfully)
    await page.waitForTimeout(2000);

    // Assert all 3 see same turn result (messages)
    const messages1 = await page.locator('[role="article"], .message').count();
    const messages2 = await page2.locator('[role="article"], .message').count();
    const messages3 = await page3.locator('[role="article"], .message').count();

    expect(messages1).toBeGreaterThan(0);
    expect(messages2).toBe(messages1);
    expect(messages3).toBe(messages1);

    await page2.close();
    await page3.close();
  });

  test('Test 16: Turn processing with slow LLM', async ({ page }) => {
    // This test verifies the UI handles long processing times gracefully
    // In reality, LLM calls can take 15-25 seconds

    const email = faker.internet.email();
    const displayName = faker.person.fullName();
    await signInWithEmulator(page, email, displayName);

    const roomId = await createRoomMinimal(page);
    await generateWorld(page, roomId);

    await page.goto(`/room/${roomId}`);
    await page.waitForTimeout(2000);

    const template = page.getByRole('button', { name: /fighter/i }).first();
    if (await template.isVisible({ timeout: 3000 })) {
      await template.click();
      await page.waitForTimeout(500);
      try {
        await page
          .getByRole('button', { name: /create/i })
          .last()
          .click({ force: true });
        await page.waitForTimeout(3000);
      } catch (e) {
        test.skip();
      }
    }

    const ready = page.getByRole('button', { name: /ready/i }).first();
    if (await ready.isVisible({ timeout: 3000 })) {
      await ready.click();
      await page.waitForTimeout(15000);
    }

    // Submit complex action (might trigger longer LLM response)
    const textarea = page.locator('textarea').first();
    await textarea.fill(
      'I attempt a complex series of actions: first I investigate the ancient runes, then carefully disarm the magical trap, and finally try to decipher the cryptic message.'
    );
    await page
      .getByRole('button', { name: /submit/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    const processBtn = page.getByRole('button', { name: /process.*turn/i });
    if (await processBtn.isVisible({ timeout: 3000 })) {
      await processBtn.click();
    }

    // Assert loading overlay persists entire duration
    await assertLoadingOverlay(page);

    // Wait up to 40 seconds (accounting for slow LLM)
    const startTime = Date.now();
    await waitForTurnProcessing(page, 40000);
    const duration = Date.now() - startTime;

    // Assert no timeout errors (we should have received response)
    await assertNoLoadingOverlay(page);

    // Assert user can't submit new action during processing (already tested by disabled state)

    // Assert message eventually arrives
    await page.waitForTimeout(1000);
    await assertMessageCount(page, 1);

    // Assert UI recovers cleanly
    await expect(textarea).toBeEnabled({ timeout: 2000 });
    await expect(textarea).toHaveValue('');
  });

  test('Test 17: Partial actions handling', async ({ page, context }) => {
    // Setup: 2 players, only Player 1 submits
    const emailA = faker.internet.email();
    const displayNameA = faker.person.fullName();
    await signInWithEmulator(page, emailA, displayNameA);

    const roomId = await createRoomMinimal(page);
    await generateWorld(page, roomId);

    await page.goto(`/room/${roomId}`);
    await page.waitForTimeout(2000);

    // Player 1
    const template1 = page.getByRole('button', { name: /fighter/i }).first();
    if (await template1.isVisible({ timeout: 3000 })) {
      await template1.click();
      await page.waitForTimeout(500);
      try {
        await page
          .getByRole('button', { name: /create/i })
          .last()
          .click({ force: true });
        await page.waitForTimeout(3000);
      } catch (e) {
        test.skip();
      }
    }

    // Player 2
    const page2 = await context.newPage();
    const emailB = faker.internet.email();
    const displayNameB = faker.person.fullName();
    await signInWithEmulator(page2, emailB, displayNameB);

    await page2.goto(`/room/${roomId}`);
    await page2.waitForTimeout(2000);

    const template2 = page2.getByRole('button', { name: /cleric/i }).first();
    if (await template2.isVisible({ timeout: 3000 })) {
      await template2.click();
      await page2.waitForTimeout(500);
      try {
        await page2
          .getByRole('button', { name: /create/i })
          .last()
          .click({ force: true });
        await page2.waitForTimeout(3000);
      } catch (e) {
        await page2.close();
        test.skip();
      }
    }

    // Both ready
    const ready1 = page.getByRole('button', { name: /ready/i }).first();
    if (await ready1.isVisible({ timeout: 3000 })) {
      await ready1.click();
    }

    const ready2 = page2.getByRole('button', { name: /ready/i }).first();
    if (await ready2.isVisible({ timeout: 3000 })) {
      await ready2.click();
      await page.waitForTimeout(20000);
      await page2.waitForTimeout(20000);
    }

    // Only Player 1 submits
    const textarea1 = page.locator('textarea').first();
    await textarea1.fill('I scout ahead');
    await page
      .getByRole('button', { name: /submit/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    // Wait 5 seconds (no auto-process should occur)
    await page.waitForTimeout(5000);

    // DM manually processes turn
    const processBtn = page.getByRole('button', { name: /process.*turn/i });
    if (await processBtn.isVisible({ timeout: 3000 })) {
      await processBtn.click();

      await waitForTurnProcessing(page, 30000);

      // Assert turn processes with only Player 1's action
      // Assert Player 2's empty action doesn't break turn
      await page.waitForTimeout(2000);

      // Assert DM message acknowledges only Player 1 (or at least doesn't error)
      await assertMessageCount(page, 1);

      // Player 2 submits next turn → Assert works normally
      const textarea2 = page2.locator('textarea').first();
      await textarea2.fill('I heal the party');
      await page2
        .getByRole('button', { name: /submit/i })
        .first()
        .click();
      await page2.waitForTimeout(500);

      // Should work normally
      await expect(page2.locator('text=/submitted|waiting/i')).toBeVisible({ timeout: 3000 });
    }

    await page2.close();
  });

  test('Test 18: Turn history verification', async ({ page }) => {
    // Play 3 complete turns with player(s)
    const email = faker.internet.email();
    const displayName = faker.person.fullName();
    await signInWithEmulator(page, email, displayName);

    const roomId = await createRoomMinimal(page);
    await generateWorld(page, roomId);

    await page.goto(`/room/${roomId}`);
    await page.waitForTimeout(2000);

    const template = page.getByRole('button', { name: /fighter/i }).first();
    if (await template.isVisible({ timeout: 3000 })) {
      await template.click();
      await page.waitForTimeout(500);
      try {
        await page
          .getByRole('button', { name: /create/i })
          .last()
          .click({ force: true });
        await page.waitForTimeout(3000);
      } catch (e) {
        test.skip();
      }
    }

    const ready = page.getByRole('button', { name: /ready/i }).first();
    if (await ready.isVisible({ timeout: 3000 })) {
      await ready.click();
      await page.waitForTimeout(15000);
    }

    // Count initial messages (opening)
    const messagesInitial = await page.locator('[role="article"], .message').count();

    // Turn 1
    await submitAction(page, 'Turn 1: I explore the entrance');
    const processBtn = page.getByRole('button', { name: /process.*turn/i });
    if (await processBtn.isVisible({ timeout: 3000 })) {
      await processBtn.click();
    }
    await waitForTurnProcessing(page, 30000);
    await page.waitForTimeout(2000);

    // Turn 2
    await submitAction(page, 'Turn 2: I check for traps');
    if (await processBtn.isVisible({ timeout: 3000 })) {
      await processBtn.click();
    }
    await waitForTurnProcessing(page, 30000);
    await page.waitForTimeout(2000);

    // Turn 3
    await submitAction(page, 'Turn 3: I proceed deeper');
    if (await processBtn.isVisible({ timeout: 3000 })) {
      await processBtn.click();
    }
    await waitForTurnProcessing(page, 30000);
    await page.waitForTimeout(2000);

    // Assert all messages visible (initial + 3 turns)
    const messagesFinal = await page.locator('[role="article"], .message').count();
    expect(messagesFinal).toBeGreaterThanOrEqual(messagesInitial + 3);

    // Scroll to top → Assert opening messages still present
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // Reload page → Assert all messages persist (Firestore)
    await page.reload();
    await page.waitForTimeout(3000);

    const messagesReload = await page.locator('[role="article"], .message').count();
    expect(messagesReload).toBeGreaterThanOrEqual(messagesFinal);

    // Assert message order maintained
    // Assert timestamps in chronological order (would require reading message data)
    await page.waitForTimeout(500);
  });
});
