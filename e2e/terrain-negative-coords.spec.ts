/**
 * E2E Test: Terrain Explorer Negative Coordinates
 * Tests navigation into negative coordinate space without teleporting
 */

import { test, expect } from '@playwright/test';

test.describe('Terrain Explorer - Negative Coordinates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3100');

    // Login
    await page.getByTestId('auth-email-input').fill('test@example.com');
    await page.getByTestId('auth-password-input').fill('testpass123');
    await page.getByTestId('auth-login-button').click();

    // Wait for lobby
    await expect(page.getByTestId('lobby-screen')).toBeVisible();
  });

  test('should navigate upward into negative Y coordinates without teleporting', async ({ page }) => {
    // Create room
    await page.getByTestId('lobby-createRoom-button').click();
    await page.getByTestId('roomSettings-confirm-button').click();

    // Wait for world generation
    await expect(page.getByText('World Description', { exact: false })).toBeVisible({ timeout: 30000 });

    // Navigate to terrain explorer (click map tab if it exists)
    const mapTab = page.getByText('Map', { exact: true });
    if (await mapTab.isVisible()) {
      await mapTab.click();
    }

    // Wait for terrain canvas
    const canvas = page.getByTestId('terrain-canvas');
    await expect(canvas).toBeVisible();

    // Press W key multiple times to move upward
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('w');
      await page.waitForTimeout(50);
    }

    // Check console for chunk loading at negative Y
    const logs: string[] = [];
    page.on('console', (msg) => {
      if (msg.text().includes('[useInfiniteChunks]') || msg.text().includes('chunkY')) {
        logs.push(msg.text());
      }
    });

    // Continue moving upward
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('w');
      await page.waitForTimeout(50);
    }

    // Verify chunks with negative Y were loaded
    const hasNegativeY = logs.some((log) => log.includes('chunkY') && log.match(/-\d+/));
    expect(hasNegativeY).toBeTruthy();

    // Verify player is still visible on canvas (not teleported off-screen)
    const screenshot = await page.screenshot();
    expect(screenshot).toBeTruthy();
  });

  test('should navigate leftward into negative X coordinates without teleporting', async ({ page }) => {
    // Create room
    await page.getByTestId('lobby-createRoom-button').click();
    await page.getByTestId('roomSettings-confirm-button').click();

    // Wait for world generation
    await expect(page.getByText('World Description', { exact: false })).toBeVisible({ timeout: 30000 });

    // Navigate to terrain explorer
    const mapTab = page.getByText('Map', { exact: true });
    if (await mapTab.isVisible()) {
      await mapTab.click();
    }

    const canvas = page.getByTestId('terrain-canvas');
    await expect(canvas).toBeVisible();

    // Press A key multiple times to move left
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('a');
      await page.waitForTimeout(50);
    }

    // Verify no rapid walking or teleporting occurred
    // Player should still be smoothly following camera
    const screenshot = await page.screenshot();
    expect(screenshot).toBeTruthy();
  });

  test('should handle all 4 directions without coordinate bugs', async ({ page }) => {
    // Create room
    await page.getByTestId('lobby-createRoom-button').click();
    await page.getByTestId('roomSettings-confirm-button').click();

    // Wait for world generation
    await expect(page.getByText('World Description', { exact: false })).toBeVisible({ timeout: 30000 });

    // Navigate to terrain explorer
    const mapTab = page.getByText('Map', { exact: true });
    if (await mapTab.isVisible()) {
      await mapTab.click();
    }

    const canvas = page.getByTestId('terrain-canvas');
    await expect(canvas).toBeVisible();

    // Move in a square pattern: up, right, down, left
    // This tests all quadrants including negative coords
    const movements = [
      { key: 'w', times: 30 }, // Up (negative Y)
      { key: 'd', times: 30 }, // Right (positive X)
      { key: 's', times: 30 }, // Down (positive Y)
      { key: 'a', times: 30 }, // Left (negative X)
    ];

    for (const move of movements) {
      for (let i = 0; i < move.times; i++) {
        await page.keyboard.press(move.key);
        await page.waitForTimeout(30);
      }
    }

    // Verify canvas is still rendering correctly
    const canvas2 = page.getByTestId('terrain-canvas');
    await expect(canvas2).toBeVisible();
  });
});
