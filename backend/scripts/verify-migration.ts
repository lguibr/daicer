 
/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
import { getStrapiClient } from './utils/strapi-client';

async function verifyMigration() {
  const client = getStrapiClient();
  const PAGE_SIZE = 10;
  let page = 1;
  let hasMore = true;

  let totalMonsters = 0;
  let migratedCount = 0;
  let legacyCount = 0;
  let zeroSpeedCount = 0;

  const notMigratedExamples: any[] = [];

  console.log('Starting Verification...');

  try {
    while (hasMore) {
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
        totalMonsters++;
        const stats = monster.stats || monster.attributes?.stats;
        const legacySpeed = monster.speed || monster.attributes?.speed;

        // Check if any new speed field is set
        const hasMigrated =
          stats &&
          ((stats.walkSpeed && stats.walkSpeed > 0) ||
            (stats.flySpeed && stats.flySpeed > 0) ||
            (stats.swimSpeed && stats.swimSpeed > 0) ||
            (stats.climbSpeed && stats.climbSpeed > 0) ||
            (stats.burrowSpeed && stats.burrowSpeed > 0) ||
            stats.hover === true);

        if (hasMigrated) {
          migratedCount++;
        } else {
          // Check if it has legacy data that SHOULD have been migrated
          let hasLegacyData = false;
          if (legacySpeed) {
            if (typeof legacySpeed === 'object') {
              // Check if it has any relevant keys
              const keys = Object.keys(legacySpeed);
              if (keys.some((k) => ['walk', 'fly', 'swim', 'climb', 'burrow', 'hover'].includes(k))) {
                hasLegacyData = true;
              }
            } else if (legacySpeed !== '0 ft.' && legacySpeed !== 0) {
              hasLegacyData = true;
            }
          }

          if (hasLegacyData) {
            legacyCount++;
            if (notMigratedExamples.length < 5) {
              notMigratedExamples.push({
                name: monster.name,
                legacy: legacySpeed,
                stats: stats,
              });
            }
          } else {
            zeroSpeedCount++;
          }
        }
      }

      if (response.meta?.pagination && page < response.meta.pagination.pageCount) {
        page++;
      } else {
        hasMore = false;
      }
    }

    console.log('\n--- Verification Results ---');
    console.log(`Total Monsters: ${totalMonsters}`);
    console.log(`Fully Migrated: ${migratedCount}`);
    console.log(`Pending Migration (Has legacy data but no stats): ${legacyCount}`);
    console.log(`Zero Speed / No Data: ${zeroSpeedCount}`);

    if (notMigratedExamples.length > 0) {
      console.log('\nExamples of Pending Migration:');
      console.log(JSON.stringify(notMigratedExamples, null, 2));
    }
  } catch (error) {
    console.error('Verification failed:', error);
  }
}

verifyMigration();
