/**
 * @file E2E auth tests
 * @description Test login flow with Firebase emulators
 */

import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { signInWithEmulator } from './utils/helpers';

test.describe('Authentication', () => {
  test('shows login screen when not authenticated', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1')).toContainText('DAIcer');
    await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();
  });

  test('redirects to lobby after login', async ({ page }) => {
    const email = faker.internet.email();
    const displayName = faker.person.fullName();

    // Use proper emulator sign-in from helpers
    await signInWithEmulator(page, email, displayName);

    // Should already be at / after signInWithEmulator
    await expect(page).toHaveURL('/');

    // Verify user menu shows displayName
    await expect(page.getByText(displayName)).toBeVisible();
  });

  test('protects routes when not authenticated', async ({ page }) => {
    await page.goto('/');

    // Should redirect to login
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();
  });
});
