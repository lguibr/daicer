/**
 * Update DM Prompts for Structured God Mode
 * usage: npx ts-node scripts/update-prompts.ts
 */

import { getStrapiClient } from './utils/strapi-client';

const GOD_MODE_INSTRUCTIONS = `
IMPORTANT FOR GOD MODE / DEBUG TOOLS:
- Prefer using Tools over loose text.
- If the user provides an input like "summon_entity @Goat", it means they selected a "Goat" from a UI dropdown.
- INTERPRET "@Name" as a precise request for an entity with that exact name or ID.
- DO NOT hallucinate "Giant Goat" if the user asked for "Goat".
- Use the 'search_monsters' tool if you need to find the stats for "Goat".
- If the input contains a coordinate like (-126, 43, 0), USE IT EXACTLY in the tool call.
`;

const keysToUpdate = ['narrator_dm', 'narrator_debug'];

async function updatePromptsMain() {
  try {
    const client = getStrapiClient();

    // Use 'prompts' collection (plural API ID)
    const promptsCollection = client.collection('prompts');

    for (const key of keysToUpdate) {
      console.log(`[Client] Updating prompt: ${key}...`);

      const results = await promptsCollection.find({
        filters: { key: { $eq: key } },
        pagination: { limit: 1 },
      });

      const existing = Array.isArray(results) ? results[0] : results.data?.[0];

      if (!existing) {
        console.warn(`[Client] Prompt ${key} not found.`);
        continue;
      }

      const currentText = existing.text || existing.attributes?.text || '';
      if (!currentText.includes('IMPORTANT FOR GOD MODE')) {
        const newText = currentText + `\n\n${GOD_MODE_INSTRUCTIONS}`;

        // Handle ID vs DocumentID
        const idToUpdate = existing.documentId || existing.id;

        await promptsCollection.update(idToUpdate, { text: newText });
        console.log(`[Client] Successfully updated ${key}`);
      } else {
        console.log(`[Client] Instructions already present for ${key}.`);
      }
    }
  } catch (err) {
    console.error('Failed to update prompts:', err);
    process.exit(1);
  }
}

updatePromptsMain();
