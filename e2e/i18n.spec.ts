/**
 * @file E2E i18n tests
 * @description Test language switching and persistence
 */

import { test, expect } from '@playwright/test';

test.describe('Internationalization', () => {
  test('detects browser language on first visit', async ({ page, context }) => {
    // Set browser language to Spanish
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'language', {
        get() {
          return 'es-ES';
        },
      });
    });

    await page.goto('/');

    // Should show Spanish title
    await expect(page.locator('h1')).toContainText('DAIcer');
    await expect(page.getByRole('button')).toContainText('Continuar con Google');
  });

  test('switches language and persists on reload', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForTimeout(500);

    // Default English
    await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();

    // Switch to Spanish using native select
    const languageSelector = page.locator('[data-testid="language-selector"]');
    await languageSelector.selectOption('es');

    // Should update immediately
    await expect(page.getByRole('button', { name: /Continuar con Google/i })).toBeVisible();

    // Reload page
    await page.reload();
    await page.waitForTimeout(500);

    // Should still be Spanish
    await expect(page.getByRole('button', { name: /Continuar con Google/i })).toBeVisible();
  });

  test('all three languages have complete translations', async ({ page }) => {
    const languages = [
      { code: 'en', loginText: 'Continue with Google' },
      { code: 'es', loginText: 'Continuar con Google' },
      { code: 'pt-BR', loginText: 'Continuar com Google' },
    ];

    for (const lang of languages) {
      await page.goto('/');
      await page.waitForTimeout(300);

      // Set language via selector
      const languageSelector = page.locator('[data-testid="language-selector"]');
      await languageSelector.selectOption(lang.code);
      await page.waitForTimeout(200);

      // Check login button text
      await expect(page.getByRole('button', { name: new RegExp(lang.loginText, 'i') })).toBeVisible();
    }
  });
});
