import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { resetEmulators } from './utils/emulator';

test.describe.serial('Initial onboarding flow', () => {
  test.beforeEach(async () => {
    await resetEmulators();
  });

  test.afterEach(async () => {
    await resetEmulators();
  });

  test('new Google account signs in, changes languages, and logs out', async ({ page }) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const displayName = `${firstName} ${lastName}`;
    const email = faker.internet.email({ firstName, lastName, provider: 'example.com' });

    await page.goto('/');

    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', { name: /Continue with Google/i }).click(),
    ]);

    await popup.waitForLoadState('domcontentloaded');
    await popup.getByRole('button', { name: 'Add new account' }).click();
    await popup.locator('#email-input').fill(email);
    await popup.locator('#display-name-input').fill(displayName);
    await popup.getByRole('button', { name: /Sign in with/i }).click();
    await popup.waitForEvent('close');

    await expect(page).toHaveURL(/\//);

    const userMenuButton = page.getByRole('button', { name: new RegExp(displayName, 'i') });
    await expect(userMenuButton).toBeVisible();

    const languageSelector = page.locator('[data-testid="language-selector"]').first();
    await expect(languageSelector).toHaveValue('en');

    await userMenuButton.click();
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
    await userMenuButton.click();

    await languageSelector.selectOption('es');
    await expect(languageSelector).toHaveValue('es');
    await userMenuButton.click();
    await expect(page.getByRole('button', { name: 'Cerrar Sesión' })).toBeVisible();
    await userMenuButton.click();

    await languageSelector.selectOption('pt-BR');
    await expect(languageSelector).toHaveValue('pt-BR');
    await userMenuButton.click();
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();
    await userMenuButton.click();

    await languageSelector.selectOption('en');
    await expect(languageSelector).toHaveValue('en');

    await userMenuButton.click();
    await page.getByRole('button', { name: 'Logout' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();
  });
});
