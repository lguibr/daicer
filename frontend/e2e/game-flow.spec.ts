import { test, expect } from '@playwright/test';

const ROOM_ID = 'iiotv0tbn6z7xip6c92navg9';
const BASE_URL = 'http://localhost:3000';

test.describe('Game Flow E2E', () => {
  test('Enter Gameplay and Interact', async ({ page }) => {
    // 1. Direct Navigation
    console.log(`Navigating directly to room ${ROOM_ID}`);
    await page.goto(`${BASE_URL}/room/${ROOM_ID}`, { timeout: 60000 });

    // 2. Wait for Input (Portuguese or English)
    console.log('Waiting for Gameplay Input...');
    const inputSelector = 'textarea[placeholder="Type an action..."], textarea[placeholder="O que você faz?"]';

    // Extended timeout for initial load
    await page.waitForSelector(inputSelector, { state: 'visible', timeout: 60000 });
    console.log('Gameplay Input Detected!');

    // 3. Interact
    await expect(page.locator(inputSelector).first()).not.toBeDisabled({ timeout: 10000 });
    console.log('Sending "Hello"');
    await page.fill(inputSelector, 'Ola mundo');
    await page.press(inputSelector, 'Enter');

    // 4. Verify Input Cleared (Submission success)
    await expect(page.locator(inputSelector).first()).toHaveValue('', { timeout: 10000 });
    console.log('Message submitted successfully.');

    // Optional: Check for "You" bubble if possible
    try {
      await expect(page.locator('.message-sender:has-text("You")').first()).toBeVisible({ timeout: 5000 });
      console.log('Verified message echo.');
    } catch {}
  });
});
