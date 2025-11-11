/**
 * @file E2E auth tests
 * @description Test login flow with Firebase emulators
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('shows login screen when not authenticated', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1')).toContainText('DAIcer');
    await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();
  });

  test('redirects to lobby after login', async ({ page }) => {
    await page.goto('/');

    // Mock Firebase auth for emulator
    await page.evaluate(() => {
      // Simulate successful login
      window.localStorage.setItem(
        'firebase:authUser',
        JSON.stringify({
          uid: 'test-user-id',
          email: 'test@example.com',
          displayName: 'Test User',
        })
      );
    });

    await page.reload();

    // Should redirect to lobby
    await expect(page).toHaveURL('/lobby');
  });

  test('protects routes when not authenticated', async ({ page }) => {
    await page.goto('/lobby');

    // Should redirect to login
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();
  });
});
