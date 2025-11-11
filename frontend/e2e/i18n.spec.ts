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
    await expect(page.locator('h1')).toContainText('dAIcer');
    await expect(page.getByRole('button')).toContainText('Continuar con Google');
  });

  test('switches language and persists on reload', async ({ page }) => {
    await page.goto('/');

    // Default English
    await expect(page.getByRole('button')).toContainText('Continue with Google');

    // Switch to Spanish (find language selector)
    const languageSelector = page.locator('[data-testid="language-selector"]').first();
    await languageSelector.click();
    await page.getByRole('option', { name: 'Español' }).click();

    // Should update immediately
    await expect(page.getByRole('button')).toContainText('Continuar con Google');

    // Reload page
    await page.reload();

    // Should still be Spanish
    await expect(page.getByRole('button')).toContainText('Continuar con Google');
  });

  test('all three languages have complete translations', async ({ page }) => {
    const languages = [
      { code: 'en', loginText: 'Continue with Google' },
      { code: 'es', loginText: 'Continuar con Google' },
      { code: 'pt-BR', loginText: 'Continuar com Google' },
    ];

    for (const lang of languages) {
      await page.goto('/');

      // Set language via localStorage
      await page.evaluate((langCode) => {
        localStorage.setItem('daicer-language', langCode);
      }, lang.code);

      await page.reload();

      // Check login button text
      await expect(page.getByRole('button')).toContainText(lang.loginText);
    }
  });
});
