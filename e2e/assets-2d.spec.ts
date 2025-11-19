/**
 * E2E Tests for 2D Assets Flow
 * Tests: create collection → create 3 assets → generate 1 → view result
 */

import { test, expect } from '@playwright/test';
import { loginTestUser } from './utils/helpers';

test.describe('2D Assets Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page);
  });

  test('Create collection → Create 3 assets → Generate 1 → View result', async ({ page }) => {
    // Navigate to 2D assets page
    await page.goto('http://localhost:3100/assets/2d');
    await expect(page.getByText('2D Image Assets')).toBeVisible();

    // Step 1: Create collection
    await page.getByTestId('create-collection-button').click();
    await expect(page.getByTestId('create-collection-modal')).toBeVisible();

    await page.getByTestId('collection-name-input').fill('Test 2D Collection');
    await page.getByTestId('collection-mode-select').selectOption('text-to-image');
    await page.getByTestId('collection-submit-button').click();

    // Verify collection card appears
    await expect(page.locator('[data-testid^="collection-card-"]').first()).toBeVisible();
    await expect(page.getByText('Test 2D Collection')).toBeVisible();

    // Step 2: Create 3 assets
    for (let i = 1; i <= 3; i++) {
      // Click "Create Asset" button in collection card
      await page.getByTestId('collection-card-create-asset-button').first().click();
      await expect(page.getByTestId('create-asset-modal')).toBeVisible();

      // Fill asset details
      await page.getByTestId('asset-name-input').fill(`Test Asset ${i}`);
      await page.getByTestId('asset-prompt-input').fill(`A majestic dragon number ${i}`);
      await page.getByTestId('asset-submit-button').click();

      // Wait for modal to close
      await expect(page.getByTestId('create-asset-modal')).not.toBeVisible({ timeout: 5000 });
    }

    // Verify collection shows 3 assets
    await expect(page.getByText(/3 assets?/i)).toBeVisible();

    // Step 3: Open collection to view assets
    await page.getByText('Test 2D Collection').click();

    // Verify we see the 3 assets
    await expect(page.getByText('Test Asset 1')).toBeVisible();
    await expect(page.getByText('Test Asset 2')).toBeVisible();
    await expect(page.getByText('Test Asset 3')).toBeVisible();

    // Step 4: Generate Asset 1 (fire-and-forget)
    const generateButton = page.locator('[data-testid$="-generate-button"]').first();
    await expect(generateButton).toBeVisible();
    await generateButton.click();

    // Verify toast notification appears
    await expect(page.getByText(/generation started/i)).toBeVisible({ timeout: 5000 });

    // Wait for status to change from 'pending' to 'loading' or 'done'
    // Note: This is a fire-and-forget operation, so we just check the status updates
    await page.waitForSelector('[data-testid$="-status-loading"], [data-testid$="-status-done"]', {
      timeout: 10000,
    });

    // Step 5: View result in preview modal
    const viewButton = page.locator('[data-testid$="-view-button"]').first();

    // Wait until asset is done generating (may take time)
    await page.waitForSelector('[data-testid$="-status-done"]', { timeout: 60000 });
    await expect(viewButton).toBeVisible();
    await viewButton.click();

    // Verify preview modal appears
    await expect(page.getByTestId('asset-preview-modal')).toBeVisible();
    await expect(page.getByTestId('asset-preview-image')).toBeVisible();

    // Close modal
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('asset-preview-modal')).not.toBeVisible();

    // Step 6: Open asset detail page
    const firstAssetCard = page.locator('[data-testid^="asset-card-"]').first();
    await firstAssetCard.click();

    // Verify we're on the detail page
    await expect(page).toHaveURL(/\/assets\/[a-z0-9-]+/);
    await expect(page.getByText('Test Asset 1')).toBeVisible();
    await expect(page.getByText(/Preview/i)).toBeVisible();
    await expect(page.getByText(/Asset Details/i)).toBeVisible();
  });

  test('Delete collection with assets shows error', async ({ page }) => {
    await page.goto('http://localhost:3100/assets/2d');

    // Create collection with 1 asset
    await page.getByTestId('create-collection-button').click();
    await page.getByTestId('collection-name-input').fill('Delete Test Collection');
    await page.getByTestId('collection-mode-select').selectOption('text-to-image');
    await page.getByTestId('collection-submit-button').click();

    // Create an asset
    await page.getByTestId('collection-card-create-asset-button').first().click();
    await page.getByTestId('asset-name-input').fill('Test Asset');
    await page.getByTestId('asset-prompt-input').fill('A test dragon');
    await page.getByTestId('asset-submit-button').click();
    await expect(page.getByTestId('create-asset-modal')).not.toBeVisible({ timeout: 5000 });

    // Try to delete collection
    const deleteButton = page.locator('button:has(svg)').filter({ hasText: '' }).first();
    await deleteButton.click();

    // Confirm deletion
    await page.getByText('Delete Collection?').click({ timeout: 2000 });
    await page.getByRole('button', { name: /delete/i }).click();

    // Should show error about having assets
    await expect(page.getByText(/cannot delete collection with \d+ asset/i)).toBeVisible({ timeout: 5000 });
  });

  test('Move asset between collections', async ({ page }) => {
    await page.goto('http://localhost:3100/assets/2d');

    // Create 2 collections
    for (let i = 1; i <= 2; i++) {
      await page.getByTestId('create-collection-button').click();
      await page.getByTestId('collection-name-input').fill(`Collection ${i}`);
      await page.getByTestId('collection-mode-select').selectOption('text-to-image');
      await page.getByTestId('collection-submit-button').click();
      await expect(page.getByTestId('create-collection-modal')).not.toBeVisible({ timeout: 5000 });
    }

    // Create asset in collection 1
    await page.getByText('Collection 1').click();
    await page.getByTestId('collection-card-create-asset-button').first().click();
    await page.getByTestId('asset-name-input').fill('Movable Asset');
    await page.getByTestId('asset-prompt-input').fill('A dragon to move');
    await page.getByTestId('asset-submit-button').click();
    await expect(page.getByTestId('create-asset-modal')).not.toBeVisible({ timeout: 5000 });

    // Open collection to view assets
    await page.getByText('Collection 1').click();
    await expect(page.getByText('Movable Asset')).toBeVisible();

    // Click move button
    const moveButton = page.locator('button:has(svg[class*="lucide-move-right"])').first();
    await moveButton.click();

    // Select target collection
    // Note: This assumes MoveAssetModal has a select dropdown with testid
    await page.selectOption('select', 'Collection 2');
    await page.getByRole('button', { name: /move/i }).click();

    // Verify asset is no longer in current collection
    await expect(page.getByText('No assets in this collection')).toBeVisible({ timeout: 5000 });

    // Go back and check collection 2
    await page.getByText('Back to Collections').click();
    await page.getByText('Collection 2').click();
    await expect(page.getByText('Movable Asset')).toBeVisible();
  });

  test('Create variations from base asset', async ({ page }) => {
    await page.goto('http://localhost:3100/assets/2d');

    // Create collection
    await page.getByTestId('create-collection-button').click();
    await page.getByTestId('collection-name-input').fill('Variations Test');
    await page.getByTestId('collection-mode-select').selectOption('variations');
    await page.getByTestId('collection-submit-button').click();
    await expect(page.getByTestId('create-collection-modal')).not.toBeVisible({ timeout: 5000 });

    // Create base asset
    await page.getByTestId('collection-card-create-asset-button').first().click();
    await page.getByTestId('asset-name-input').fill('Base Asset');
    await page.getByTestId('asset-prompt-input').fill('A dragon');
    await page.getByTestId('asset-submit-button').click();
    await expect(page.getByTestId('create-asset-modal')).not().toBeVisible({ timeout: 5000 });

    // Open collection
    await page.getByText('Variations Test').click();

    // Generate the base asset first
    await page.locator('[data-testid$="-generate-button"]').first().click();
    await expect(page.getByText(/generation started/i)).toBeVisible({ timeout: 5000 });

    // Wait for generation to complete
    await page.waitForSelector('[data-testid$="-status-done"]', { timeout: 60000 });

    // Click variations button
    await page.locator('button:has-text("Variations")').first().click();

    // Should open variations modal (assuming BatchVariationsModal is used)
    await page.fill('input[type="number"]', '3');
    await page.getByRole('button', { name: /create.*variations/i }).click();

    // Verify 3 new variation assets were created
    await expect(page.getByText(/Variation 1/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Variation 2/)).toBeVisible();
    await expect(page.getByText(/Variation 3/)).toBeVisible();
  });
});
