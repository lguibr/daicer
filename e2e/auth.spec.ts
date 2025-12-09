import { test, expect } from '@playwright/test';
import { signInWithEmulator, TEST_USER } from './utils/helpers';

test.describe('Authentication Flows', () => {
  test('should protect routes when unauthenticated', async ({ page }) => {
    // Attempt to visit a protected route
    await page.goto('/create');

    // Should NOT stay on /create
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });

    // Should see the login button
    await expect(page.getByRole('button', { name: /Continue with Google/i }).first()).toBeVisible();
  });

  test('should allow successful login with Emulator', async ({ page }) => {
    // Perform login
    await signInWithEmulator(page, TEST_USER.email, TEST_USER.displayName);

    // Verify successful login state (e.g., presence of "Create Adventure" button)
    await expect(page.getByTestId('lobby-create-room-btn')).toBeVisible({ timeout: 10000 });

    // Should not see the login button anymore
    await expect(page.getByRole('button', { name: /Continue with Google/i }).first()).not.toBeVisible();
  });

  test('should persist session across reloads', async ({ page }) => {
    // Login first
    await signInWithEmulator(page, TEST_USER.email, TEST_USER.displayName);

    // Verify initial state
    await expect(page.getByTestId('lobby-create-room-btn')).toBeVisible({ timeout: 10000 });

    // Reload page
    await page.reload();

    // Verify session passes
    await expect(page.getByTestId('lobby-create-room-btn')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Continue with Google/i }).first()).not.toBeVisible();
  });
});
