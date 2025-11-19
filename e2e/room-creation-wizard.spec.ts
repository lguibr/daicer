/**
 * E2E Tests for Room Creation Wizard (4-step flow)
 * Tests: navigate 4 groups → generate world with streaming → view preview → create room
 */

import { test, expect } from '@playwright/test';
import { loginTestUser } from './utils/helpers';

test.describe('Room Creation Wizard (4-Step Flow)', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page);
  });

  test('Navigate 4 groups → Generate world → Preview → Create room', async ({ page }) => {
    // Navigate to create room page
    await page.goto('http://localhost:3100/create');
    await expect(page.getByText('Create Your Campaign')).toBeVisible();

    // ===== GROUP 1: DM & Scope =====
    await expect(page.getByTestId('wizard-group-1')).toBeVisible();

    // DM Style
    await page.getByLabel('Verbosity').fill('3');
    await page.getByLabel('Detail Level').fill('3');
    await page.getByLabel('Player Engagement').fill('3');
    await page.getByLabel('Narrative Control').fill('3');

    // Scope
    const worldSizeSlider = page.locator('#world-size-slider');
    await worldSizeSlider.fill('2'); // medium

    const adventureLengthSlider = page.locator('#adventure-length-slider');
    await adventureLengthSlider.fill('2'); // medium

    const difficultySlider = page.locator('#difficulty-slider');
    await difficultySlider.fill('2'); // medium

    // Story
    await page.getByTestId('theme-input').fill('High Fantasy');
    await page.getByTestId('tone-input').fill('Heroic');
    await page.getByTestId('setting-input').fill('Medieval Kingdom');

    // Advance to group 2
    await page.getByTestId('wizard-next-button').click();

    // ===== GROUP 2: World Config =====
    await expect(page.getByTestId('wizard-group-2')).toBeVisible();

    await page.locator('#history-depth-slider').fill('500');
    await page.locator('#era-count-slider').fill('3');
    await page.locator('#structure-density-slider').fill('5');

    // Select some structure types
    await page.getByText('settlements').click();
    await page.getByText('temples').click();

    await page.getByTestId('wizard-next-button').click();

    // ===== GROUP 3: Characters =====
    await expect(page.getByTestId('wizard-group-3')).toBeVisible();

    await page.locator('#party-size-slider').fill('4');
    await page.locator('#starting-level-slider').fill('1');

    await page.getByTestId('wizard-next-button').click();

    // ===== GROUP 4: In-Room Config + World Generation =====
    await expect(page.getByTestId('wizard-group-4')).toBeVisible();

    // First, create the room
    await page.getByTestId('wizard-next-button').click();

    // Room should be created, now we can generate world
    await expect(page.getByTestId('generate-world-button')).toBeVisible({ timeout: 5000 });

    // Click generate world
    await page.getByTestId('generate-world-button').click();

    // Wait for streaming progress to appear
    await expect(page.getByTestId('world-gen-progress')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Initializing|Generating/)).toBeVisible();

    // Wait for world generation to complete (with generous timeout for LLM)
    await page.waitForSelector('[data-testid="world-preview"]', { timeout: 120000 });

    // Verify preview content
    await expect(page.getByTestId('world-description')).toBeVisible();
    await expect(page.getByTestId('world-map')).toBeVisible();
    await expect(page.getByTestId('history-timeline')).toBeVisible();

    // Create/enter room
    await page.getByTestId('wizard-create-room-button').click();

    // Verify redirect to room
    await expect(page).toHaveURL(/\/room\/[a-zA-Z0-9-]+/, { timeout: 10000 });
  });

  test('Validation blocks advancement to next group', async ({ page }) => {
    await page.goto('http://localhost:3100/create');

    // Group 1: Try to advance without filling required fields
    await expect(page.getByTestId('wizard-group-1')).toBeVisible();

    // Clear theme (required field)
    await page.getByTestId('theme-input').clear();
    await page.getByTestId('wizard-next-button').click();

    // Should show error and not advance
    await expect(page.getByText(/complete all required fields/i)).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('wizard-group-1')).toBeVisible(); // Still on group 1

    // Fill required fields
    await page.getByTestId('theme-input').fill('Test Theme');
    await page.getByTestId('tone-input').fill('Test Tone');
    await page.getByTestId('setting-input').fill('Test Setting');

    // Now should be able to advance
    await page.getByTestId('wizard-next-button').click();
    await expect(page.getByTestId('wizard-group-2')).toBeVisible({ timeout: 5000 });
  });

  test('Can go back and edit previous groups', async ({ page }) => {
    await page.goto('http://localhost:3100/create');

    // Fill group 1
    await page.getByTestId('theme-input').fill('Original Theme');
    await page.getByTestId('tone-input').fill('Original Tone');
    await page.getByTestId('setting-input').fill('Original Setting');
    await page.getByTestId('wizard-next-button').click();

    // Advance to group 2
    await expect(page.getByTestId('wizard-group-2')).toBeVisible();
    await page.getByTestId('wizard-next-button').click();

    // Now on group 3
    await expect(page.getByTestId('wizard-group-3')).toBeVisible();

    // Go back to group 1
    await page.getByTestId('wizard-previous-button').click();
    await page.getByTestId('wizard-previous-button').click();

    // Should be back on group 1
    await expect(page.getByTestId('wizard-group-1')).toBeVisible();

    // Edit theme
    await page.getByTestId('theme-input').clear();
    await page.getByTestId('theme-input').fill('Edited Theme');

    // Advance back to group 3
    await page.getByTestId('wizard-next-button').click();
    await expect(page.getByTestId('wizard-group-2')).toBeVisible();
    await page.getByTestId('wizard-next-button').click();
    await expect(page.getByTestId('wizard-group-3')).toBeVisible();

    // Verify theme was saved
    await page.getByTestId('wizard-previous-button').click();
    await page.getByTestId('wizard-previous-button').click();
    await expect(page.getByTestId('theme-input')).toHaveValue('Edited Theme');
  });

  test('LocalStorage persists wizard state across page reloads', async ({ page }) => {
    await page.goto('http://localhost:3100/create');

    // Fill some data in group 1
    await page.getByTestId('theme-input').fill('Persistent Theme');
    await page.getByTestId('tone-input').fill('Persistent Tone');
    await page.getByTestId('setting-input').fill('Persistent Setting');
    await page.getByTestId('wizard-next-button').click();

    // Advance to group 2
    await expect(page.getByTestId('wizard-group-2')).toBeVisible();
    await page.locator('#history-depth-slider').fill('1000');

    // Reload page
    await page.reload();

    // Should resume from group 2
    await expect(page.getByTestId('wizard-group-2')).toBeVisible({ timeout: 5000 });

    // Verify history depth persisted
    await expect(page.locator('#history-depth-slider')).toHaveValue('1000');

    // Go back to group 1
    await page.getByTestId('wizard-previous-button').click();

    // Verify theme persisted
    await expect(page.getByTestId('theme-input')).toHaveValue('Persistent Theme');
    await expect(page.getByTestId('tone-input')).toHaveValue('Persistent Tone');
    await expect(page.getByTestId('setting-input')).toHaveValue('Persistent Setting');
  });

  test('Cannot skip ahead to uncompleted groups', async ({ page }) => {
    await page.goto('http://localhost:3100/create');

    // On group 1, try to click group 3 button directly
    const group3Button = page.locator('button').filter({ hasText: 'Characters' });

    // Should be disabled
    await expect(group3Button).toBeDisabled();

    // Complete group 1
    await page.getByTestId('theme-input').fill('Theme');
    await page.getByTestId('tone-input').fill('Tone');
    await page.getByTestId('setting-input').fill('Setting');
    await page.getByTestId('wizard-next-button').click();

    // On group 2, try to click group 4
    const group4Button = page.locator('button').filter({ hasText: 'Preview & Create' });
    await expect(group4Button).toBeDisabled();

    // But can click group 1 (completed)
    const group1Button = page.locator('button').filter({ hasText: 'DM & Scope' });
    await expect(group1Button).not.toBeDisabled();
  });
});
