import { getStrapiClient } from './utils/strapi-client';

async function auditMonsterSpeeds() {
  const client = getStrapiClient();
  const PAGE_SIZE = 100;
  let page = 1;
  let hasMore = true;

  const movementTypes = new Set<string>();
  const valueExamples: Record<string, Set<string>> = {};
  let totalMonsters = 0;
  let monstersWithSpeed = 0;

  console.log('Starting Monster Speed Audit...');

  try {
    while (hasMore) {
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
        totalMonsters++;
        const speed = monster.speed || monster.attributes?.speed;

        if (speed) {
          monstersWithSpeed++;
          if (typeof speed === 'object') {
            for (const [type, value] of Object.entries(speed)) {
              movementTypes.add(type);

              if (!valueExamples[type]) {
                valueExamples[type] = new Set();
              }
              // Keep first 10 unique examples per type
              if (valueExamples[type].size < 10) {
                valueExamples[type].add(String(value));
              }
            }
          } else {
            console.warn(`Monster ${monster.name} has non-object speed:`, speed);
          }
        }
      }

      // Check if we need to fetch more
      if (response.meta && response.meta.pagination) {
        if (page >= response.meta.pagination.pageCount) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        // If no meta, assume we got everything or it's not paginated in a standard way
        hasMore = false;
      }
    }

    console.log('\n--- Audit Results ---');
    console.log(`Total Monsters Scanned: ${totalMonsters}`);
    console.log(`Monsters with Speed: ${monstersWithSpeed}`);
    console.log(`Unique Movement Types Found: ${Array.from(movementTypes).join(', ')}`);
    console.log('\n--- Value Examples per Type ---');

    for (const type of Array.from(movementTypes)) {
      console.log(`\nType: ${type}`);
      console.log(`Examples: ${Array.from(valueExamples[type] || []).join(', ')}`);
    }
  } catch (error) {
    console.error('Error auditing monster speeds:', error);
  }
}

auditMonsterSpeeds();
