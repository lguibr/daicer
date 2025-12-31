/**
 * backend/scripts/fetch_rules_data.ts
 *
 * Fetches sample data (limit 20) for key rule-related entities:
 * - Spells
 * - Features
 * - Monsters
 * - Classes
 * - Races
 * - Traits
 *
 * Usage: npx ts-node scripts/fetch_rules_data.ts
 */

import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore
const { getStrapiClient } = require('./utils/strapi-client');

const OUTPUT_PATH = path.resolve(__dirname, '../../studyCase/rulesConsolidation/data_samples.json');

async function main() {
  console.log('--- Starting Rules Data Extraction ---');

  const strapi = getStrapiClient();
  const collections = [
    'spells',
    'features',
    'monsters',
    'classes',
    'races',
    'traits',
    'characters',
    'character-sheets',
    'equipments',
  ];
  const results: Record<string, any[]> = {};

  try {
    for (const collection of collections) {
      console.log(`Fetching ${collection}...`);

      // Use .collection() method for safe access
      const response = await strapi.collection(collection).find({
        pagination: { limit: 20 },
        sort: 'name:asc',
        // We verify the structure in previous steps; grabbing all fields by default
        // For relations/components, we might need populate, but default usually gives basic fields
        // Let's add some basic populate for nested structures if needed, but keeping it simple for now
        populate: '*',
      });

      // Handle potential { data: [], meta: {} } response structure vs direct array
      const items = Array.isArray(response) ? response : (response as any).data;

      console.log(`✅  Found ${items?.length || 0} ${collection}.`);
      results[collection] = items || [];
    }

    console.log(`\nWriting results to: ${OUTPUT_PATH}`);

    // Ensure directory exists
    const dir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
    console.log('--- Extraction Complete ---');
  } catch (error) {
    console.error('❌ Error fetching data:', error);
    process.exit(1);
  }
}

main();
