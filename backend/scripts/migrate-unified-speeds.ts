/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { getStrapiClient } from './utils/strapi-client';

async function migrateUnifiedSpeeds() {
  const client = getStrapiClient();
  const PAGE_SIZE = 10;

  // Helper to parse speed string
  const parseSpeedValue = (val: any): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const match = val.match(/(\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    return 0;
  };

  try {
    // --- 1. Migrate Monsters ---
    console.log('\n--- Migrating Monsters ---');
    let page = 1;
    let hasMore = true;
    let monsterUpdates = 0;

    while (hasMore) {
      console.log(`Processing Monsters page ${page}...`);
      const response = await client.collection('monsters').find({
        pagination: { page, pageSize: PAGE_SIZE },
        fields: ['name', 'speed'],
        populate: ['stats'],
      });

      const monsters = Array.isArray(response) ? response : response.data || [];
      if (monsters.length === 0) {
        hasMore = false;
        break;
      }

      for (const monster of monsters) {
        const speedJson = monster.speed || monster.attributes?.speed;
        const currentStats = monster.stats || monster.attributes?.stats || {};

        // Prepare update payload
        const newStats = { ...currentStats };
        let needsUpdate = false;

        if (speedJson && typeof speedJson === 'object') {
          // Map JSON keys to stats fields
          for (const [key, val] of Object.entries(speedJson)) {
            const numVal = parseSpeedValue(val);
            if (key === 'walk' || key === 'walking') {
              if (newStats.walkSpeed !== numVal) {
                newStats.walkSpeed = numVal;
                needsUpdate = true;
              }
            } else if (key === 'fly' || key === 'flying') {
              if (newStats.flySpeed !== numVal) {
                newStats.flySpeed = numVal;
                needsUpdate = true;
              }
            } else if (key === 'swim' || key === 'swimming') {
              if (newStats.swimSpeed !== numVal) {
                newStats.swimSpeed = numVal;
                needsUpdate = true;
              }
            } else if (key === 'climb' || key === 'climbing') {
              if (newStats.climbSpeed !== numVal) {
                newStats.climbSpeed = numVal;
                needsUpdate = true;
              }
            } else if (key === 'burrow' || key === 'burrowing') {
              if (newStats.burrowSpeed !== numVal) {
                newStats.burrowSpeed = numVal;
                needsUpdate = true;
              }
            } else if (key === 'hover') {
              const isHover = val === true || val === 'true';
              if (newStats.hover !== isHover) {
                newStats.hover = isHover;
                needsUpdate = true;
              }
            }
          }
        }

        // Also check if 'speed' field exists in currentStats (legacy integer) and map to walkSpeed if walkSpeed is 0
        if (currentStats.speed && (!newStats.walkSpeed || newStats.walkSpeed === 0)) {
          newStats.walkSpeed = currentStats.speed;
          needsUpdate = true;
        }

        // IMPORTANT: If walkSpeed is still 0/undefined and we have a raw 'speed' (legacy int), use that.
        // But monster.speed is usually JSON.

        if (needsUpdate) {
          const id = monster.documentId || monster.id;
          // Sanitize stats payload - remove IDs to avoid conflicts or 400s
          const { id: _id, documentId: _docId, ...cleanedStats } = newStats;

          try {
            await client.collection('monsters').update(id, {
              stats: cleanedStats,
            });
            monsterUpdates++;
          } catch (updateErr: any) {
            console.error(`Failed to update monster ${monster.name} (${id}):`);
            if (updateErr?.response?.data) {
              console.error(JSON.stringify(updateErr.response.data, null, 2));
            } else {
              console.error(updateErr);
            }
          }
        }
      }

      if (response.meta?.pagination && page < response.meta.pagination.pageCount) {
        page++;
      } else {
        hasMore = false;
      }
    }
    console.log(`Monsters updated: ${monsterUpdates}`);

    // --- 2. Migrate Characters ---
    console.log('\n--- Migrating Characters ---');
    page = 1;
    hasMore = true;
    let charUpdates = 0;

    while (hasMore) {
      console.log(`Processing Characters page ${page}...`);
      const response = await client.collection('characters').find({
        pagination: { page, pageSize: PAGE_SIZE },
        populate: ['baseStats'],
      });

      const characters = Array.isArray(response) ? response : response.data || [];
      if (characters.length === 0) {
        hasMore = false;
        break;
      }

      for (const char of characters) {
        const stats = char.baseStats || char.attributes?.baseStats;
        if (!stats) continue;

        let needsUpdate = false;
        const newStats = { ...stats };

        // Map stats.speed -> stats.walkSpeed
        if (stats.speed && (!stats.walkSpeed || stats.walkSpeed === 0)) {
          newStats.walkSpeed = stats.speed;
          needsUpdate = true;
        }

        if (needsUpdate) {
          const id = char.documentId || char.id;
          // Sanitize payload
          const { id: _id, documentId: _docId, ...cleanedStats } = newStats;
          await client.collection('characters').update(id, {
            baseStats: cleanedStats,
          });
          charUpdates++;
          // console.log(`Updated Character ${char.name}: walkSpeed=${newStats.walkSpeed}`);
        }
      }

      if (response.meta?.pagination && page < response.meta.pagination.pageCount) {
        page++;
      } else {
        hasMore = false;
      }
    }
    console.log(`Characters updated: ${charUpdates}`);
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateUnifiedSpeeds();
