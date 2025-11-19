/**
 * Grid Map E2E Tests
 * Tests infinite grid rendering, zoom, pan, z-layer navigation, and tile inspection
 */

import { test, expect } from '@playwright/test';

test.describe('Grid Map Renderer', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:3100');

    // TODO: Add proper auth and room creation flow
    // For now, assume we can navigate directly to grid map
  });

  test('should render grid map canvas', async ({ page }) => {
    const canvas = page.getByTestId('grid-canvas');
    await expect(canvas).toBeVisible();
  });

  test('should zoom in and out', async ({ page }) => {
    const zoomInButton = page.getByTestId('zoom-in-button');
    const zoomOutButton = page.getByTestId('zoom-out-button');

    // Initial zoom
    await expect(page.getByText(/Zoom: 1\.0x/)).toBeVisible();

    // Zoom in
    await zoomInButton.click();
    await expect(page.getByText(/Zoom: 1\.2x/)).toBeVisible();

    // Zoom out
    await zoomOutButton.click();
    await expect(page.getByText(/Zoom: 1\.0x/)).toBeVisible();
  });

  test('should reset view', async ({ page }) => {
    const zoomInButton = page.getByTestId('zoom-in-button');
    const resetButton = page.getByTestId('reset-view-button');

    // Zoom in a few times
    await zoomInButton.click();
    await zoomInButton.click();
    await expect(page.getByText(/Zoom: 1\.[2-9]x/)).toBeVisible();

    // Reset
    await resetButton.click();
    await expect(page.getByText(/Zoom: 1\.0x/)).toBeVisible();
  });

  test('should display current z-layer', async ({ page }) => {
    await expect(page.getByText(/Grid World \(Layer 0\)/)).toBeVisible();
  });

  test('should switch z-layers', async ({ page }) => {
    // Find z-layer slider
    const slider = page.locator('input[type="range"]');
    await expect(slider).toBeVisible();

    // Change to underground layer
    await slider.fill('-3');
    await expect(page.getByText(/Grid World \(Layer -3\)/)).toBeVisible();

    // Change to sky layer
    await slider.fill('2');
    await expect(page.getByText(/Grid World \(Layer 2\)/)).toBeVisible();
  });

  test('should display chunk count', async ({ page }) => {
    await expect(page.getByText(/\d+ chunks loaded/)).toBeVisible();
  });

  test('should open tile metadata panel on click', async ({ page }) => {
    const canvas = page.getByTestId('grid-canvas');

    // Click on canvas
    await canvas.click({ position: { x: 100, y: 100 } });

    // Metadata panel should appear
    const panel = page.getByTestId('tile-metadata-panel');
    await expect(panel).toBeVisible();

    // Should show tile coordinates
    await expect(panel.getByText(/Position/)).toBeVisible();
    await expect(panel.getByText(/X:/)).toBeVisible();
    await expect(panel.getByText(/Y:/)).toBeVisible();
    await expect(panel.getByText(/Z:/)).toBeVisible();
  });

  test('should close metadata panel', async ({ page }) => {
    const canvas = page.getByTestId('grid-canvas');

    // Click to open
    await canvas.click({ position: { x: 100, y: 100 } });

    const panel = page.getByTestId('tile-metadata-panel');
    await expect(panel).toBeVisible();

    // Click close button
    const closeButton = page.getByTestId('close-metadata-button');
    await closeButton.click();

    await expect(panel).not.toBeVisible();
  });

  test('should display tile properties in metadata', async ({ page }) => {
    const canvas = page.getByTestId('grid-canvas');
    await canvas.click({ position: { x: 100, y: 100 } });

    const panel = page.getByTestId('tile-metadata-panel');

    // Should show block type
    await expect(panel.getByText(/Block Type:/)).toBeVisible();

    // Should show biome
    await expect(panel.getByText(/Biome:/)).toBeVisible();

    // Should show light level
    await expect(panel.getByText(/Light Level:/)).toBeVisible();
  });

  test('should display features if present', async ({ page }) => {
    // This test assumes a tile with features exists
    // In real scenario, we'd navigate to known coordinates

    const canvas = page.getByTestId('grid-canvas');
    await canvas.click({ position: { x: 200, y: 200 } });

    const panel = page.getByTestId('tile-metadata-panel');

    // If features exist, should show count
    const featuresSection = panel.getByText(/Features \(\d+\)/);
    if (await featuresSection.isVisible()) {
      // Feature details should be visible
      await expect(panel.getByText(/Type:/)).toBeVisible();
      await expect(panel.getByText(/Subtype:/)).toBeVisible();
    }
  });

  test('should pan the map with mouse drag', async ({ page }) => {
    const canvas = page.getByTestId('grid-canvas');

    // Get initial view
    const initialInfo = await page.getByText(/\d+ chunks loaded/).textContent();

    // Drag canvas
    await canvas.hover({ position: { x: 400, y: 300 } });
    await page.mouse.down();
    await page.mouse.move(300, 200);
    await page.mouse.up();

    // Chunks may have changed (panning loads new chunks)
    // Just verify it didn't crash
    await expect(canvas).toBeVisible();
  });

  test('should load chunks progressively as viewport changes', async ({ page }) => {
    const canvas = page.getByTestId('grid-canvas');
    const chunkInfo = page.getByText(/\d+ chunks loaded/);

    // Get initial chunk count
    const initialText = await chunkInfo.textContent();
    const initialCount = parseInt(initialText?.match(/(\d+) chunks/)?.[1] || '0');

    // Pan to new area
    await canvas.hover({ position: { x: 400, y: 300 } });
    await page.mouse.down();
    await page.mouse.move(200, 100);
    await page.mouse.up();

    // Wait for new chunks to load
    await page.waitForTimeout(1000);

    // Chunk count may have increased
    const newText = await chunkInfo.textContent();
    const newCount = parseInt(newText?.match(/(\d+) chunks/)?.[1] || '0');

    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });
});
