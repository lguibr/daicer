import { test, expect } from '@playwright/test';
import {
  hasBlackPixels,
  waitForChunksLoaded,
  measureChunkLoadTime,
  assertCanvasNotEmpty,
} from './utils/canvas-helpers';

test.describe('Map Rendering - No Black Flash', () => {
  test('should render map without black flashing', async ({ page }) => {
    // Create room and generate world first
    await page.goto('http://localhost:3100/create');
    await expect(page.getByRole('heading', { name: /Create Adventure/i })).toBeVisible({ timeout: 10000 });

    // Quick wizard navigation (minimal settings)
    await page.locator('[data-testid="archetype-terra"]').first().click();
    await page.getByRole('button', { name: /next/i }).click();

    await page.locator('select[name="adventureLength"]').first().selectOption('flash');
    await page.locator('select[name="difficulty"]').first().selectOption('easy');
    await page.getByRole('button', { name: /next/i }).click();

    // Skip through remaining steps
    for (let i = 0; i < 6; i++) {
      await page.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(200);
    }

    // Create room
    await page.getByRole('button', { name: /create/i }).click();
    await expect(page.getByTestId('generate-world-button')).toBeVisible({ timeout: 10000 });

    // Generate world
    await page.getByTestId('generate-world-button').click();

    // Wait for world generation to complete
    await expect(page.locator('text=/World generation complete/i')).toBeVisible({ timeout: 120000 });

    // Navigate to map view
    const mapCanvas = page.locator('canvas').first();
    await expect(mapCanvas).toBeVisible({ timeout: 5000 });

    // Wait for chunks to load
    const chunksLoaded = await waitForChunksLoaded(page, 'canvas', 5000);
    expect(chunksLoaded).toBe(true);

    // Assert: No black pixels (Answer 9-b: pixel sampling)
    const hasBlack = await hasBlackPixels(page, 'canvas', 10);
    expect(hasBlack).toBe(false);

    // Assert: Canvas not empty
    const hasContent = await assertCanvasNotEmpty(page, 'canvas');
    expect(hasContent).toBe(true);
  });

  test('should load chunks within 500ms', async ({ page }) => {
    // Navigate to existing world with map
    await page.goto('http://localhost:3100/create');

    // ... create and generate world (same as above) ...
    await expect(page.getByRole('heading', { name: /Create Adventure/i })).toBeVisible({ timeout: 10000 });
    await page.locator('[data-testid="archetype-terra"]').first().click();

    // Fast-forward through wizard
    for (let i = 0; i < 8; i++) {
      await page.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(100);
    }

    await page.getByRole('button', { name: /create/i }).click();
    await expect(page.getByTestId('generate-world-button')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('generate-world-button').click();
    await expect(page.locator('text=/World generation complete/i')).toBeVisible({ timeout: 120000 });

    // Measure chunk load time (Answer 10-b: < 500ms)
    const loadTime = await measureChunkLoadTime(page, 'canvas');

    console.log(`Chunk load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(500);
  });

  test('should support z-layer switching', async ({ page }) => {
    // Navigate to map with world
    await page.goto('http://localhost:3100/create');
    await expect(page.getByRole('heading', { name: /Create Adventure/i })).toBeVisible({ timeout: 10000 });
    await page.locator('[data-testid="archetype-terra"]').first().click();

    for (let i = 0; i < 8; i++) {
      await page.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(100);
    }

    await page.getByRole('button', { name: /create/i }).click();
    await expect(page.getByTestId('generate-world-button')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('generate-world-button').click();
    await expect(page.locator('text=/World generation complete/i')).toBeVisible({ timeout: 120000 });

    // Find z-layer slider
    const layerSlider = page.locator('input[type="range"]').first();
    await expect(layerSlider).toBeVisible();

    // Change layer
    await layerSlider.fill('5');
    await page.waitForTimeout(200);

    // Verify layer display updates
    await expect(page.locator('text=/Layer 5/i')).toBeVisible();

    // Change to negative layer
    await layerSlider.fill('-3');
    await page.waitForTimeout(200);
    await expect(page.locator('text=/Layer -3/i')).toBeVisible();

    // Verify no black flash during layer switch
    await page.waitForTimeout(500); // Let layer load
    const hasBlack = await hasBlackPixels(page, 'canvas', 10);
    expect(hasBlack).toBe(false);
  });
});
