import { test, expect } from '@playwright/test';

test.describe('Game Flow E2E', () => {
  test('Create New Room and Enter Gameplay', async ({ page }) => {
    test.setTimeout(120000); // Allow 2 minutes for full flow including AI gen

    // Enable browser logs
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));

    // 1. Navigate to Landing Page (Authenticated)
    console.log('Injecting auth token...');
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'strapi_jwt',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzY1ODM2OTAyLCJleHAiOjE3Njg0Mjg5MDJ9.YQOZ9ztZKV4rFSh4zZdSGa0q9TwF9uEl8SE1j0nyptM'
      );
    });

    // Mock GraphQL mutations for Avatar Generation
    await page.route('**/graphql', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData && postData.operationName) {
        const dummyImage = {
          mimeType: 'image/png',
          data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', // 1x1 red pixel
        };

        if (postData.operationName === 'GenerateAvatarPortrait') {
          console.log('Mocking GenerateAvatarPortrait');
          await route.fulfill({
            json: { data: { generateAvatarPortrait: dummyImage } },
          });
          return;
        }
        if (postData.operationName === 'GenerateAvatarUpperBody') {
          console.log('Mocking GenerateAvatarUpperBody');
          await route.fulfill({
            json: { data: { generateAvatarUpperBody: dummyImage } },
          });
          return;
        }
        if (postData.operationName === 'GenerateAvatarFullBody') {
          console.log('Mocking GenerateAvatarFullBody');
          await route.fulfill({
            json: { data: { generateAvatarFullBody: dummyImage } },
          });
          return;
        }
      }
      // Continue other requests
      await route.continue();
    });

    console.log('Navigating to Home...');
    await page.goto('http://localhost:3000');

    // 2. Click Create New Adventure
    // Wait for button to be visible
    await page.waitForSelector('[data-testid="lobby-create-room-btn"]', { state: 'visible', timeout: 10000 });
    await page.click('[data-testid="lobby-create-room-btn"]');

    // 3. Wait for /create page
    await page.waitForURL('**/create', { timeout: 10000 });
    console.log('Navigated to Create Page');

    // 4. Wizard Step 1: DM & Scope
    // Wait for the DM group to be visible
    await page.waitForSelector('[data-testid="wizard-group-dm"]', { timeout: 10000 });
    console.log('Wizard Step 1: DM & Scope');

    // Fill required text inputs
    await page.fill('input#theme-input', 'E2E Validation');
    await page.fill('input#tone-input', 'Automated');
    await page.fill('input#setting-input', 'Test Runner Environment');

    // Click Next
    await page.click('[data-testid="wizard-next-button"]');

    // 5. Wizard Step 2: Terrain Builder
    // Wait for the Terrain group to be visible
    await page.waitForSelector('[data-testid="wizard-group-terrain"]', { timeout: 10000 });
    console.log('Wizard Step 2: Terrain Builder');

    // Click Create Room (Submit)
    // The button testid changes on the final step
    await page.waitForSelector('[data-testid="wizard-create-room-button"]', { state: 'visible' });
    await page.click('[data-testid="wizard-create-room-button"]');

    // 6. Wait for Room Redirect and Lobby Load
    console.log('Waiting for Room Load...');
    await page.waitForURL('**/room/**', { timeout: 30000 });

    // 7. Lobby: Create Character
    console.log('Lobby Loaded. Starting Character Creation...');
    // 7. Lobby: Create Character
    console.log('Lobby Loaded. Starting Character Creation...');

    // Handle Auto-Redirect: If user has no character, GameRoom might auto-redirect to wizard
    // We race waiting for either "Create Character" button (Lobby) OR "Class Selection" (Wizard)
    const lobbyCreateBtn = page.locator('[data-testid="lobby-create-char"]');
    const wizardStep1 = page.locator('button:has-text("Fighter")'); // "Fighter" button in Class step

    try {
      await Promise.race([
        lobbyCreateBtn.waitFor({ state: 'visible', timeout: 30000 }),
        wizardStep1.waitFor({ state: 'visible', timeout: 30000 }),
      ]);
    } catch (e) {
      console.log('Timeout waiting for Lobby OR Wizard. Dumping page content...');
      const content = await page.content();
      console.log('--- PAGE CONTENT START ---');
      console.log(content.substring(0, 2000)); // Log first 2KB to avoid spam
      console.log('--- PAGE CONTENT END ---');
      throw e;
    }

    if (await lobbyCreateBtn.isVisible()) {
      console.log('In Lobby. Clicking Create Character...');
      await lobbyCreateBtn.click();
    } else {
      console.log('Auto-redirected to Character Creation Wizard.');
    }

    // 8. Character Creation Wizard

    // Step 1: Class
    console.log('Char Wizard: Class Selection');
    // Select "Fighter" to trigger auto-fill
    await page.click('button:has-text("Fighter")');
    await page.waitForTimeout(1000);
    // Use robust data-testid for navigation
    await page.click('[data-testid="wizard-next-btn"]');

    // Step 2: Race
    console.log('Char Wizard: Race Selection');
    await page.click('[data-testid="wizard-next-btn"]');

    // Step 3: Attributes
    console.log('Char Wizard: Attributes');
    await page.click('[data-testid="wizard-next-btn"]');

    // Step 4: Alignment
    console.log('Char Wizard: Alignment');
    await page.click('[data-testid="wizard-next-btn"]');

    // Step 5: Identity (Appearance & Details)
    console.log('Char Wizard: Details');
    // Verify auto-fill worked (Name and Background should be populated)
    const nameInput = page.locator('input[type="text"]').first();
    await expect(nameInput).not.toBeEmpty();

    // Background is the second textarea or has specific placeholder/label
    // Using nth(1) as we saw 2 textareas in the output, second one was background
    const backgroundInput = page.locator('textarea').nth(1);
    await expect(backgroundInput).not.toBeEmpty();

    // Proceed
    await page.click('[data-testid="wizard-next-btn"]');

    // Step 6: Equipment
    console.log('Char Wizard: Equipment');
    await page.click('[data-testid="wizard-next-btn"]');

    // Step 7: Visuals (Avatar)
    console.log('Char Wizard: Visuals');

    // Check if we need to generate avatars
    // The "Create Character" / Finish button (wizard-complete-btn) will be disabled until avatars are valid.
    const completeBtn = page.locator('[data-testid="wizard-complete-btn"]');

    // Click Generate All if visible
    const generateBtn = page.getByRole('button', { name: /generate/i });
    if ((await generateBtn.count()) > 0) {
      console.log('Clicking Generate...');
      await generateBtn.first().click();

      // Wait for generation completion - complete button becomes enabled
      // 60s timeout for AI generation
      await expect(completeBtn).toBeEnabled({ timeout: 60000 });
    } else {
      // Maybe already generated or mocked? Ensure complete button is enabled
      await expect(completeBtn).toBeEnabled();
    }

    // Finish / Create Character
    console.log('Char Wizard: Creating Character...');
    await completeBtn.click();

    // 9. Back in Lobby: Mark Ready and Start Game
    console.log('Character Created. Back in Lobby.');
    // Wait for "Mark as Ready" button
    try {
      await page.waitForSelector('[data-testid="lobby-ready-toggle"]', { timeout: 20000 });
      await page.click('[data-testid="lobby-ready-toggle"]');
    } catch (e) {
      console.log('FAILED to find Ready button. Checking for errors...');
      // Log any error text on screen
      const errorText = await page.textContent('body');
      console.log('Page Content Dump:', errorText?.substring(0, 1000));

      const specificError = await page.locator('.text-red-500, .text-destructive').allTextContents();
      console.log('Visible Errors:', specificError);

      throw e;
    }

    // Wait for "Start Adventure" button (Owner only, which we are)
    await page.waitForSelector('[data-testid="lobby-start-game"]', { timeout: 10000 });
    await page.click('[data-testid="lobby-start-game"]');

    // 10. Verify Gameplay Screen
    // We look for the main input area. It might be disabled initially while processing opening.
    // Use :visible to avoid matching the hidden mobile/desktop duplicates
    const inputSelector = 'textarea:visible';

    // Extended timeout for generation/loading
    await page.waitForSelector(inputSelector, { state: 'visible', timeout: 60000 });
    console.log('Gameplay Input Detected!');

    // Wait for it to be enabled (no longer processing)
    // The placeholder changes when disabled, so relying on placeholder is brittle.
    await expect(page.locator(inputSelector)).toBeEnabled({ timeout: 30000 });

    // 11. Interact
    const input = page.locator(inputSelector);
    await input.fill('I look around for any immediate threats.');
    await page.keyboard.press('Enter');
    console.log('Action submitted.');

    // 12. Process Turn
    // As we are the only player (and DM), we must manually trigger the turn processing.
    // Wait for the "Process Turn" button to appear.
    // Using loose regex to match "Process Turn" or "Processar Turno"
    const processBtn = page.getByRole('button', { name: /process/i });
    await expect(processBtn).toBeVisible({ timeout: 10000 });
    await processBtn.click();
    console.log('Process Turn clicked.');

    // 13. Wait for response
    // Verify the DM response appears in the chat.
    // Note: Since we are mocking the LLM in the backend during this test, we expect the mock text.
    // "[MOCK] The adventure begins!"

    // Wait for DM response
    const dmResponseSelector =
      'div[role="article"][aria-label="Message from assistant"], div[role="article"][aria-label="Message from DM"]';

    await page.waitForSelector(dmResponseSelector, { timeout: 120000 });
    const dmMessages = page.locator(dmResponseSelector);
    await expect(dmMessages.first()).toBeVisible();

    // Optional: Verify mock text content to be sure we got the *new* message
    // await expect(page.getByText('The adventure begins!')).toBeVisible();

    console.log('DM Response received.');

    // 14. Verify Map Rendering
    console.log('Verifying Map Rendering...');
    // The map is in a container with "relative flex-1 bg-black" in GameplayScreen (lines 267)
    // TerrainExplorerInternal renders a canvas.
    // Ideally we'd have a testid, but we can look for the canvas in the right area.
    const mapCanvas = page.locator('div.bg-black canvas');
    await expect(mapCanvas).toBeVisible();

    // Verify Terrain Grid Data via Window Property (inserted by TerrainExplorer for debug)
    const gridData = await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (window as any).__TERRAIN_GRID__;
    });

    if (!gridData || !Array.isArray(gridData) || gridData.length === 0) {
      throw new Error('Map grid data is missing or empty!');
    }

    // Check for ANY structure or road tile
    // We expect at least some non-plain/grass tiles due to generation
    let hasStructure = false;
    for (const row of gridData) {
      for (const tile of row) {
        if (
          tile &&
          ((tile.biome && tile.biome.startsWith('structure_')) ||
            (tile.blockType && tile.blockType !== 'grass' && tile.blockType !== 'dirt' && tile.blockType !== 'air'))
        ) {
          hasStructure = true;
          break;
        }
      }
      if (hasStructure) break;
    }

    if (!hasStructure) {
      console.warn('WARNING: No structures or roads detected in the initial map!');
    } else {
      console.log('Map verified: Structures/Roads detected.');
    }

    console.log(`Map verified with ${gridData.length} rows.`);
  });
});
