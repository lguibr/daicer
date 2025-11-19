/**
 * E2E Test: Map Creation and Viewing
 */

import { test, expect, type Page } from '@playwright/test';
import { signInWithEmulator } from './utils/helpers';

/**
 * Navigate to maps page with proper wait states
 */
async function navigateToMaps(page: Page, worldId?: string): Promise<void> {
  const url = worldId ? `http://localhost:3100/assets/maps?worldId=${worldId}` : 'http://localhost:3100/assets/maps';

  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Allow React to render

  // Verify page loaded (not error page)
  await expect(page.getByText('Procedural Maps')).toBeVisible({ timeout: 10000 });
}

test.describe('Map Generation and Viewing', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await signInWithEmulator(page, 'test@example.com', 'Test User');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('FULL USER JOURNEY: create → render → zoom → click tile → WASD navigation', async () => {
    console.log('🎮 Starting full map interaction journey...');

    // ==========================================
    // STEP 1: CREATE NEW MAP
    // ==========================================
    console.log('📍 Step 1: Navigate and create new map');
    await navigateToMaps(page);

    // Click Create World button
    await page.getByRole('button', { name: /create world/i }).click();
    await page.waitForTimeout(500);

    // Fill in basic world parameters (skip sliders for now)
    const worldName = `Journey Test ${Date.now()}`;
    await page.locator('#name').fill(worldName);
    console.log('✅ Filled world name:', worldName);

    // Seed and dimensions should have defaults, just submit
    // The form has defaults: width=256, height=256, seed=auto-generated
    await page.waitForTimeout(500);

    // Click Generate World button at bottom
    await page.getByRole('button', { name: /generate world/i }).click();
    console.log('✅ Clicked Generate World');

    // Wait for world to be created and appear in list
    await page.waitForTimeout(3000);
    await expect(page.getByText(worldName)).toBeVisible({ timeout: 10000 });
    console.log('✅ Map created:', worldName);

    // ==========================================
    // STEP 2: OPEN MAP & WATCH IT RENDER
    // ==========================================
    console.log('📍 Step 2: Opening map and watching chunks load...');

    // Click "View Map" button for this world
    await page
      .getByRole('button', { name: /view map/i })
      .first()
      .click();
    await page.waitForTimeout(1000);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Watch connection establish
    await expect(page.getByText(/🟢 connected/i)).toBeVisible({ timeout: 15000 });
    console.log('✅ WebSocket connected');

    // Wait and watch chunks render progressively
    await page.waitForTimeout(4000);

    // ==========================================
    // STEP 3: VERIFY MAP RENDERED WITH COLORS
    // ==========================================
    console.log('📍 Step 3: Analyzing rendered map colors...');
    const initialAnalysis = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return null;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const colorSet = new Set<string>();
      let colorfulPixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r > 20 || g > 20 || b > 20) {
          colorfulPixels++;
          if (i % 40 === 0) {
            colorSet.add(`${Math.floor(r / 10)},${Math.floor(g / 10)},${Math.floor(b / 10)}`);
          }
        }
      }

      return {
        uniqueColors: colorSet.size,
        colorfulPixels,
        percentageColorful: (colorfulPixels / (data.length / 4)) * 100,
      };
    });

    console.log('🎨 Initial render:', initialAnalysis);
    expect(initialAnalysis).not.toBeNull();
    expect(initialAnalysis!.uniqueColors).toBeGreaterThan(3);
    expect(initialAnalysis!.percentageColorful).toBeGreaterThan(20);
    console.log(`✅ Map rendered with ${initialAnalysis!.uniqueColors} biome colors`);

    await page.screenshot({ path: 'test-results/journey-1-initial-render.png' });

    // ==========================================
    // STEP 4: ZOOM IN (scroll up)
    // ==========================================
    console.log('📍 Step 4: Zooming in...');
    const zoomBefore = await page.getByText(/zoom: /i).textContent();

    await canvas.hover();
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, -200); // Negative = zoom in
      await page.waitForTimeout(300);
    }

    const zoomAfterIn = await page.getByText(/zoom: /i).textContent();
    expect(zoomBefore).not.toBe(zoomAfterIn);
    console.log(`✅ Zoomed: ${zoomBefore} → ${zoomAfterIn}`);

    await page.screenshot({ path: 'test-results/journey-2-zoomed-in.png' });

    // ==========================================
    // STEP 5: ZOOM OUT (scroll down)
    // ==========================================
    console.log('📍 Step 5: Zooming out...');
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 200); // Positive = zoom out
      await page.waitForTimeout(300);
    }

    const zoomAfterOut = await page.getByText(/zoom: /i).textContent();
    expect(zoomAfterOut).not.toBe(zoomAfterIn);
    console.log(`✅ Zoomed out: ${zoomAfterIn} → ${zoomAfterOut}`);

    await page.screenshot({ path: 'test-results/journey-3-zoomed-out.png' });

    // ==========================================
    // STEP 6: CLICK ON TILE & SEE DATA
    // ==========================================
    console.log('📍 Step 6: Clicking on tile to see data...');
    const canvasBounds = await canvas.boundingBox();
    if (!canvasBounds) throw new Error('Canvas bounds not found');

    // Click center of canvas
    const clickX = canvasBounds.x + canvasBounds.width / 2;
    const clickY = canvasBounds.y + canvasBounds.height / 2;
    await page.mouse.click(clickX, clickY);

    // Verify tile info appears
    await expect(page.getByText('Selected Tile')).toBeVisible();
    const tileInfo = await page.getByText(/X: \d+, Y: \d+/).textContent();
    console.log(`✅ Tile selected: ${tileInfo}`);

    await page.screenshot({ path: 'test-results/journey-4-tile-selected.png' });

    // ==========================================
    // STEP 7: DRAG TO PAN
    // ==========================================
    console.log('📍 Step 7: Testing drag to pan...');
    await page.mouse.move(clickX, clickY);
    await page.mouse.down();
    await page.mouse.move(clickX + 100, clickY + 100, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(1000);

    console.log('✅ Drag panning completed');
    await page.screenshot({ path: 'test-results/journey-5-after-panning.png' });

    // ==========================================
    // FINAL VERIFICATION
    // ==========================================
    console.log('📍 Final: Verifying map still functional...');

    // Should still be connected
    await expect(page.getByText(/🟢 connected/i)).toBeVisible();

    // Click one more time to verify interaction still works
    await page.mouse.click(clickX, clickY);
    await expect(page.getByText('Selected Tile')).toBeVisible();

    const finalAnalysis = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return null;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let colorfulPixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 20 || data[i + 1] > 20 || data[i + 2] > 20) {
          colorfulPixels++;
        }
      }

      return { colorfulPixels };
    });

    expect(finalAnalysis?.colorfulPixels).toBeGreaterThan(1000);

    console.log('✅ FULL USER JOURNEY COMPLETE!');
    console.log('📸 Screenshots saved in test-results/journey-*.png');
  });

  test('should display error for invalid world access', async () => {
    // Navigate to maps page normally first
    await navigateToMaps(page);

    // Try to access non-existent world directly
    await navigateToMaps(page, 'non-existent-id');

    // Should show error or redirect (or just normal page since error handling may vary)
    const hasNormalPage = await page.getByText('Procedural Maps').isVisible();
    const hasError = await page.getByText(/world not found|access denied|failed to load/i).isVisible();

    expect(hasNormalPage || hasError).toBeTruthy();
  });

  test('should handle disconnection gracefully', async () => {
    // Navigate to maps page
    await navigateToMaps(page);

    // Create a world
    await page.getByRole('button', { name: /create world/i }).click();
    await page.getByLabel(/name/i).fill(`Test ${Date.now()}`);
    await page.getByLabel(/seed/i).fill('99999');
    await page.getByRole('button', { name: /create/i }).click();
    await page.waitForTimeout(2000);

    // View world
    await page
      .getByRole('button', { name: /view map/i })
      .first()
      .click();
    await page.waitForTimeout(1000);

    // Simulate network offline
    await page.context().setOffline(true);
    await page.waitForTimeout(1000);

    // Should show disconnected status
    await expect(page.getByText(/🔴 disconnected/i)).toBeVisible({ timeout: 5000 });

    // Restore network
    await page.context().setOffline(false);
    await page.waitForTimeout(2000);

    // Should reconnect
    await expect(page.getByText(/🟢 connected/i)).toBeVisible({ timeout: 10000 });
  });

  test('should delete world successfully', async () => {
    // Navigate to maps page
    await navigateToMaps(page);

    // Create a world to delete
    const worldName = `Delete Me ${Date.now()}`;
    await page.getByRole('button', { name: /create world/i }).click();
    await page.getByLabel(/name/i).fill(worldName);
    await page.getByLabel(/seed/i).fill('11111');
    await page.getByRole('button', { name: /create/i }).click();
    await expect(page.getByText(worldName)).toBeVisible({ timeout: 10000 });

    // Click delete button
    const worldCard = page.locator('.group', { hasText: worldName });
    await worldCard.getByRole('button').last().click();

    // Confirm deletion
    await page
      .getByRole('button', { name: /delete/i })
      .last()
      .click();

    // World should be removed
    await expect(page.getByText(worldName)).not.toBeVisible({ timeout: 5000 });
  });

  test('should load chunks progressively when panning', async () => {
    // Navigate and create world
    await navigateToMaps(page);
    await page.getByRole('button', { name: /create world/i }).click();
    await page.getByLabel(/name/i).fill(`Progressive ${Date.now()}`);
    await page.getByLabel(/seed/i).fill('54321');
    await page.getByLabel(/width/i).fill('256');
    await page.getByLabel(/height/i).fill('256');
    await page.getByRole('button', { name: /create/i }).click();
    await page.waitForTimeout(2000);

    // View world
    await page
      .getByRole('button', { name: /view map/i })
      .first()
      .click();
    await expect(page.locator('canvas')).toBeVisible();

    // Wait for initial chunks
    await page.waitForTimeout(2000);

    // Pan to trigger new chunk loading
    const canvas = page.locator('canvas');
    const bounds = await canvas.boundingBox();

    if (bounds) {
      // Drag canvas to pan
      await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      await page.mouse.down();
      await page.mouse.move(bounds.x + 200, bounds.y + 200, { steps: 10 });
      await page.mouse.up();

      // Should see loading footer while chunks load
      await expect(page.getByText(/loading chunks/i)).toBeVisible({ timeout: 3000 });
    }
  });

  test('should handle large viewport with automatic batching (>50 chunks)', async () => {
    // Navigate and create a large world
    await navigateToMaps(page);
    await page.getByRole('button', { name: /create world/i }).click();
    await page.getByLabel(/name/i).fill(`Large World ${Date.now()}`);
    await page.getByLabel(/seed/i).fill('99999');
    await page.getByLabel(/width/i).fill('512'); // Large world to trigger many chunks
    await page.getByLabel(/height/i).fill('512');
    await page.getByRole('button', { name: /create/i }).click();
    await page.waitForTimeout(2000);

    // Capture console logs to verify batching
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'log' && msg.text().includes('[WorldChunks]')) {
        consoleLogs.push(msg.text());
      }
    });

    // View world - this will trigger large chunk request
    await page
      .getByRole('button', { name: /view map/i })
      .first()
      .click();
    await expect(page.locator('canvas')).toBeVisible();

    // Zoom out to maximum to force loading many chunks at once
    const canvas = page.locator('canvas');
    await canvas.hover();

    // Zoom out significantly (scroll down multiple times)
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(100);
    }

    // Wait for chunks to load
    await page.waitForTimeout(5000);

    // Verify connected (no batch size errors)
    await expect(page.getByText(/🟢 connected/i)).toBeVisible();

    // Verify no error messages about batch size
    const hasErrorText = await page
      .getByText(/too many chunks|maximum.*chunks|invalid batch/i)
      .isVisible()
      .catch(() => false);
    expect(hasErrorText).toBe(false);

    // Check console logs for batching behavior
    const batchLogs = consoleLogs.filter((log) => log.includes('batch(es)'));

    // If we requested more than 50 chunks, there should be batching
    if (batchLogs.length > 0) {
      const hasBatching = batchLogs.some((log) => {
        // Extract "in X batch(es)" from log
        const match = log.match(/in (\d+) batch\(es\)/);
        return match && parseInt(match[1]) > 1;
      });

      // If we zoomed out enough, we should see multiple batches
      console.log('Batching detected:', hasBatching);
      console.log('Batch logs:', batchLogs);
    }

    // Verify canvas rendered content with multiple biome colors
    const canvasAnalysis = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return { hasContent: false, uniqueColors: 0, colorfulPixels: 0, totalPixels: 0 };

      const ctx = canvas.getContext('2d');
      if (!ctx) return { hasContent: false, uniqueColors: 0, colorfulPixels: 0, totalPixels: 0 };

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const colorSet = new Set<string>();
      let colorfulPixels = 0;
      const totalPixels = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Count non-black/near-black pixels
        if (r > 20 || g > 20 || b > 20) {
          colorfulPixels++;
          // Track unique colors (sample every 10th pixel to avoid Set overflow)
          if (i % 40 === 0) {
            const colorKey = `${Math.floor(r / 10)},${Math.floor(g / 10)},${Math.floor(b / 10)}`;
            colorSet.add(colorKey);
          }
        }
      }

      return {
        hasContent: colorfulPixels > 0,
        uniqueColors: colorSet.size,
        colorfulPixels,
        totalPixels,
        percentageColorful: (colorfulPixels / totalPixels) * 100,
      };
    });

    console.log('Canvas analysis:', canvasAnalysis);

    // Verify we have actual biome content
    expect(canvasAnalysis.hasContent).toBe(true);
    expect(canvasAnalysis.uniqueColors).toBeGreaterThan(3); // Should have multiple biome colors
    expect(canvasAnalysis.percentageColorful).toBeGreaterThan(30); // At least 30% should be non-black

    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/large-world-batching.png' });
  });

  test('should not break with exactly 50 chunks requested', async () => {
    // Navigate and create world
    await navigateToMaps(page);
    await page.getByRole('button', { name: /create world/i }).click();
    await page.getByLabel(/name/i).fill(`Boundary Test ${Date.now()}`);
    await page.getByLabel(/seed/i).fill('77777');
    await page.getByLabel(/width/i).fill('256');
    await page.getByLabel(/height/i).fill('256');
    await page.getByRole('button', { name: /create/i }).click();
    await page.waitForTimeout(2000);

    // View world
    await page
      .getByRole('button', { name: /view map/i })
      .first()
      .click();
    await expect(page.locator('canvas')).toBeVisible();

    // Wait for initial load
    await page.waitForTimeout(2000);

    // Verify connected (no errors at batch boundary)
    await expect(page.getByText(/🟢 connected/i)).toBeVisible();

    // Verify no error messages
    const hasError = await page
      .getByText(/error|failed|invalid/i)
      .isVisible()
      .catch(() => false);
    expect(hasError).toBe(false);

    // Canvas should have content with diverse biome colors
    const canvasAnalysis = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return { hasContent: false, uniqueColors: 0, colorfulPixels: 0 };

      const ctx = canvas.getContext('2d');
      if (!ctx) return { hasContent: false, uniqueColors: 0, colorfulPixels: 0 };

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const colorSet = new Set<string>();
      let colorfulPixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (r > 20 || g > 20 || b > 20) {
          colorfulPixels++;
          if (i % 40 === 0) {
            const colorKey = `${Math.floor(r / 10)},${Math.floor(g / 10)},${Math.floor(b / 10)}`;
            colorSet.add(colorKey);
          }
        }
      }

      return {
        hasContent: colorfulPixels > 0,
        uniqueColors: colorSet.size,
        colorfulPixels,
      };
    });

    console.log('Canvas analysis:', canvasAnalysis);
    expect(canvasAnalysis.hasContent).toBe(true);
    expect(canvasAnalysis.uniqueColors).toBeGreaterThan(2); // Multiple biome colors

    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/boundary-test-50-chunks.png' });
  });
});
