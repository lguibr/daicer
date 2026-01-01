/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
import { getStrapiClient } from './utils/strapi-client';

async function migrateMonsterSpeeds() {
  const client = getStrapiClient();
  const PAGE_SIZE = 50;
  let page = 1;
  let hasMore = true;
  let updatedCount = 0;
  let errorCount = 0;

  console.log('Starting Monster Speed Migration...');

  // Helper to parse speed string
  const parseSpeed = (val: any): number | boolean => {
    if (typeof val === 'boolean') return val; // Handle "hover": true
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const match = val.match(/(\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    return val; // Fallback
  };

  try {
    while (hasMore) {
      console.log(`Processing page ${page}...`);
      const response = await client.collection('monsters').find({
        pagination: { page, pageSize: PAGE_SIZE },
        fields: ['name', 'speed'],
      });

      const monsters = Array.isArray(response) ? response : response.data || [];

      if (monsters.length === 0) {
        hasMore = false;
        break;
      }

      for (const monster of monsters) {
        const originalSpeed = monster.speed || monster.attributes?.speed;
        let needsUpdate = false;
        const newSpeed: Record<string, any> = {};

        if (originalSpeed && typeof originalSpeed === 'object') {
          for (const [key, value] of Object.entries(originalSpeed)) {
            const parsed = parseSpeed(value);
            if (parsed !== value) {
              needsUpdate = true;
            }
            newSpeed[key] = parsed;
          }
        }

        if (needsUpdate) {
          try {
            // Strapi v5 often prefers documentId, fall back to id if needed
            const id = monster.documentId || monster.id;
            await client.collection('monsters').update(id, {
              speed: newSpeed,
            });
            updatedCount++;
            console.log(`Updated ${monster.name}:`, JSON.stringify(originalSpeed), '->', JSON.stringify(newSpeed));
          } catch (err) {
            console.error(`Failed to update ${monster.name}:`, err);
            errorCount++;
          }
        }
      }

      // Pagination check
      if (response.meta?.pagination) {
        if (page >= response.meta.pagination.pageCount) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    console.log('\n--- Migration Results ---');
    console.log(`Total Updated: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateMonsterSpeeds();
