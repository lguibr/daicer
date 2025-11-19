/**
 * Canvas Testing Helpers
 * Utilities for E2E testing of canvas-based map rendering
 */

import type { Page } from '@playwright/test';

/**
 * Check if canvas has black pixels (indicates flash/rendering issue)
 * Answer 9-b: Pixel sampling approach
 *
 * @param page - Playwright page
 * @param selector - Canvas selector
 * @param threshold - Number of black pixels to tolerate (default 10)
 * @returns true if black pixels detected above threshold
 */
export async function hasBlackPixels(page: Page, selector: string, threshold: number = 10): Promise<boolean> {
  const blackPixelCount = await page.evaluate(
    ({ canvasSelector, blackThreshold }) => {
      const canvas = document.querySelector(canvasSelector) as HTMLCanvasElement;
      if (!canvas) {
        throw new Error(`Canvas not found: ${canvasSelector}`);
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get 2d context');
      }

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      let blackCount = 0;

      // Sample every pixel (RGBA format)
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        // Check if pixel is black (r=0, g=0, b=0) and opaque
        if (r === 0 && g === 0 && b === 0 && a > 128) {
          blackCount++;
        }
      }

      return blackCount;
    },
    { canvasSelector: selector, blackThreshold: threshold }
  );

  return blackPixelCount > threshold;
}

/**
 * Wait for chunks to finish loading
 * Detects when canvas stops changing (stable render)
 *
 * @param page - Playwright page
 * @param selector - Canvas selector
 * @param maxWaitMs - Maximum wait time
 * @returns true if chunks loaded successfully
 */
export async function waitForChunksLoaded(page: Page, selector: string, maxWaitMs: number = 5000): Promise<boolean> {
  const startTime = Date.now();

  let previousHash = '';
  let stableCount = 0;

  while (Date.now() - startTime < maxWaitMs) {
    const currentHash = await getCanvasHash(page, selector);

    if (currentHash === previousHash) {
      stableCount++;
      if (stableCount >= 3) {
        // Canvas stable for 3 checks = loaded
        return true;
      }
    } else {
      stableCount = 0;
    }

    previousHash = currentHash;
    await page.waitForTimeout(100);
  }

  return false; // Timeout
}

/**
 * Get hash of canvas content for comparison
 */
async function getCanvasHash(page: Page, selector: string): Promise<string> {
  return page.evaluate((canvasSelector) => {
    const canvas = document.querySelector(canvasSelector) as HTMLCanvasElement;
    if (!canvas) return '';

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Simple hash: sum of all pixel values
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }

    return sum.toString();
  }, selector);
}

/**
 * Measure chunk load time for performance testing
 * Answer 10-b: < 500ms target
 *
 * @param page - Playwright page
 * @param selector - Canvas selector
 * @returns Load time in milliseconds
 */
export async function measureChunkLoadTime(page: Page, selector: string): Promise<number> {
  const startTime = Date.now();

  // Wait for canvas to be visible
  await page.waitForSelector(selector, { state: 'visible' });

  // Wait for chunks to finish loading
  await waitForChunksLoaded(page, selector);

  const endTime = Date.now();
  return endTime - startTime;
}

/**
 * Assert canvas is not empty
 */
export async function assertCanvasNotEmpty(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((canvasSelector) => {
    const canvas = document.querySelector(canvasSelector) as HTMLCanvasElement;
    if (!canvas) return false;

    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Check if any non-black, non-transparent pixels exist
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      if ((r !== 0 || g !== 0 || b !== 0) && a > 0) {
        return true; // Found a colored pixel
      }
    }

    return false; // Canvas is empty/black
  }, selector);
}
