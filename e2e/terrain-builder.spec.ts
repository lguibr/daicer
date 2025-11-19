import { test, expect } from '@playwright/test';

test.describe('Terrain Builder', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to create page
        await page.goto('http://localhost:3000/create');

        // Handle login if redirected
        if (page.url().includes('login')) {
            await page.getByText('Continuar com Google').click();
            // Select the first test account
            await page.getByText('test@example.com').first().click();
            await page.waitForURL('**/create');
        }
    });

    test('should load chunks on WASD movement and not trigger modal on update', async ({ page }) => {
        // 1. Navigate to Terrain Builder step
        await page.getByRole('button', { name: 'Next' }).click();

        // 2. Verify map is visible
        const canvas = page.locator('canvas');
        await expect(canvas).toBeVisible();

        // 3. Focus canvas and simulate WASD movement
        await canvas.click();

        // Move right with 'd' key
        for (let i = 0; i < 10; i++) {
            await page.keyboard.press('d');
            await page.waitForTimeout(100); // Wait for potential debounce/render
        }

        // 4. Click "Update Preview"
        await page.getByRole('button', { name: 'Update Preview' }).click();

        // 5. Verify "Create Character" modal is NOT visible
        // The modal typically has a header "Create Your Character"
        await expect(page.getByText('Create Your Character')).not.toBeVisible();

        // Verify we are still on the Terrain Builder step (Update Preview button still visible)
        await expect(page.getByRole('button', { name: 'Update Preview' })).toBeVisible();
    });
});
