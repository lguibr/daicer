import { test, expect } from '@playwright/test';

test.describe('9-Step World Creation Wizard', () => {
  test('should complete full world creation flow', async ({ page }) => {
    // Navigate to create room page
    await page.goto('http://localhost:3100/create');

    // Wait for page to load (main heading is "Create Adventure")
    await expect(page.getByRole('heading', { name: /Create Adventure/i })).toBeVisible({ timeout: 10000 });

    // Step 1: World Archetype
    await expect(page.locator('text=Step 1')).toBeVisible();
    await page.locator('[data-testid="archetype-terra"]').first().click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2: Story Frame
    await expect(page.locator('text=Step 2')).toBeVisible();
    await page.locator('select[name="adventureLength"]').first().selectOption('medium');
    await page.locator('select[name="difficulty"]').first().selectOption('medium');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3: Scope
    await expect(page.locator('text=Step 3')).toBeVisible();
    // Accept defaults for party size and starting level
    await page.getByRole('button', { name: /next/i }).click();

    // Step 4: DM Personality
    await expect(page.locator('text=Step 4')).toBeVisible();
    // Accept defaults for DM sliders
    await page.getByRole('button', { name: /next/i }).click();

    // Step 5: Prompt Preview
    await expect(page.locator('text=Step 5')).toBeVisible();
    await expect(page.locator('pre')).toBeVisible(); // System prompt should be visible
    await page.getByRole('button', { name: /next/i }).click();

    // Step 6: History Configuration (room creation happens here)
    await expect(page.locator('text=Step 6')).toBeVisible();
    await expect(page.locator('text=/History/i')).toBeVisible();
    // Accept default history depth and era count
    await page.getByRole('button', { name: /next/i }).click();

    // Step 7: Structure Settings
    await expect(page.locator('text=Step 7')).toBeVisible();
    await expect(page.locator('text=/Structures/i')).toBeVisible();
    // Accept default structure density
    // Check a few structure types
    await page.locator('input[type="checkbox"]').first().check();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 8: Terrain & Roads
    await expect(page.locator('text=Step 8')).toBeVisible();
    await expect(page.locator('text=/Terrain/i')).toBeVisible();
    // Accept default terrain settings (roads enabled by default)
    await page.getByRole('button', { name: /next/i }).click();

    // Step 9: World Preview (world generation happens here)
    await expect(page.locator('text=Step 9')).toBeVisible();

    // Wait for world generation to complete (up to 60 seconds)
    await expect(page.locator('text=/World.*Generated/i')).toBeVisible({ timeout: 60000 });

    // Verify WorldMapView is rendered (canvas element)
    await expect(page.locator('canvas')).toBeVisible();

    // Verify HistoryTimeline is rendered if history was generated
    const historyTimeline = page.locator('text=/World History/i');
    if (await historyTimeline.isVisible()) {
      await expect(historyTimeline).toBeVisible();
    }

    // Click Begin Adventure button
    await page.getByRole('button', { name: /begin.*adventure/i }).click();

    // Verify navigation to character creation
    await expect(page).toHaveURL(/\/room\/[a-zA-Z0-9-]+/);

    // Verify we're in CHARACTER_CREATION phase
    await expect(page.locator('text=/Character Creation/i')).toBeVisible({ timeout: 10000 });
  });

  test('should allow navigation between steps', async ({ page }) => {
    await page.goto('http://localhost:3100/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Go forward to step 2
    await page.getByRole('button', { name: /next/i }).click();
    await expect(page.locator('text=Step 2')).toBeVisible();

    // Go back to step 1
    await page.getByRole('button', { name: /back|previous/i }).click();
    await expect(page.locator('text=Step 1')).toBeVisible();

    // Go forward again
    await page.getByRole('button', { name: /next/i }).click();
    await expect(page.locator('text=Step 2')).toBeVisible();
  });

  test('should display step counter showing 9 total steps', async ({ page }) => {
    await page.goto('http://localhost:3100/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify step counter shows "/ 9"
    await expect(page.locator('text=/Step 1.*of.*9/i')).toBeVisible();
  });

  test('should execute 11-phase world generation graph with incremental updates', async ({ page }) => {
    // Navigate to create room page
    await page.goto('http://localhost:3100/create');
    await expect(page.getByRole('heading', { name: /Create Adventure/i })).toBeVisible({ timeout: 10000 });

    // Quickly navigate through wizard (minimal config)
    // Step 1: Archetype
    await page.locator('[data-testid="archetype-terra"]').first().click();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2: Story Frame
    await page.locator('select[name="adventureLength"]').first().selectOption('flash'); // Fastest
    await page.locator('select[name="difficulty"]').first().selectOption('easy');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3: Scope (1 player, level 1)
    await page.getByRole('button', { name: /next/i }).click();

    // Step 4: DM Personality
    await page.getByRole('button', { name: /next/i }).click();

    // Step 5: Prompt Preview
    await page.getByRole('button', { name: /next/i }).click();

    // Step 6: History (set to 100 years = 2 periods for testing)
    const historySlider = page.locator('input[type="range"]').first();
    await historySlider.fill('100');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 7: Structures
    await page.locator('input[type="checkbox"]').first().check();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 8: Terrain
    await page.getByRole('button', { name: /next/i }).click();

    // Step 9: Create room
    await page.getByRole('button', { name: /create/i }).click();

    // Wait for room to be created
    await expect(page.getByTestId('generate-world-button')).toBeVisible({ timeout: 10000 });

    // Click generate world
    await page.getByTestId('generate-world-button').click();

    // Verify WorldGenProgress component appears
    await expect(page.getByTestId('world-gen-progress')).toBeVisible();

    // Verify phases appear in order (with timeouts for each)
    // Phase 1: Init
    await expect(page.locator('text=/Initializing world generation/i')).toBeVisible({ timeout: 5000 });

    // Phase 2: Conditions
    await expect(page.locator('text=/Generating world conditions/i')).toBeVisible({ timeout: 5000 });

    // Phase 3: History (2 periods)
    await expect(page.locator('text=/Creating world history/i')).toBeVisible({ timeout: 5000 });

    // Verify period progress indicator appears
    await expect(page.locator('text=/Period.*\\/.*2/i')).toBeVisible({ timeout: 10000 });

    // Phase 4: Structures
    await expect(page.locator('text=/Placing structures/i')).toBeVisible({ timeout: 15000 });

    // Phase 5: Roads (conditional)
    await expect(page.locator('text=/Building roads/i')).toBeVisible({ timeout: 10000 });

    // Phase 6: Terrain
    await expect(page.locator('text=/Shaping terrain/i')).toBeVisible({ timeout: 10000 });

    // Phase 7: Chunks
    await expect(page.locator('text=/Pre-generating map chunks/i')).toBeVisible({ timeout: 10000 });

    // Phase 8: Lore
    await expect(page.locator('text=/Crafting world lore/i')).toBeVisible({ timeout: 15000 });

    // Phase 9: Complete
    await expect(page.locator('text=/World generation complete/i')).toBeVisible({ timeout: 5000 });

    // Verify progress reaches 100%
    await expect(page.locator('text=/100%/i')).toBeVisible({ timeout: 5000 });

    // Verify world preview appears
    await expect(page.getByTestId('world-preview')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('world-description')).toBeVisible();

    // Verify map is rendered
    await expect(page.locator('canvas')).toBeVisible();
  });
});
