/**
 * scripts/verify-entities-client.ts
 *
 * Uses @strapi/client to fetch and list entities from the running Strapi instance.
 * usage: npx ts-node scripts/verify-entities-client.ts
 */

const strapiFactory = require('@strapi/client').strapi;

async function main() {
  const baseURL = process.env.VITE_API_URL || 'http://localhost:1337';
  const token = process.env.STRAPI_API_TOKEN;

  if (!token) {
    console.warn('Warning: STRAPI_API_TOKEN not found in .env. Requests might fail if auth is required.');
  }

  // console.log(`Connecting to Strapi at ${baseURL}...`);

  const strapi = strapiFactory({
    baseURL: baseURL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  console.log('Strapi Client Methods:', Object.keys(strapi));

  try {
    // 1. Fetch Rooms via Proxy property access
    // Note: 'rooms' is the plural collection name
    const rooms = await strapi.rooms.find({
      populate: ['character_sheets', 'character_sheets.position'],
      sort: 'createdAt:desc',
      pagination: { limit: 1 },
    });

    const roomList = Array.isArray(rooms) ? rooms : (rooms as any).data;

    if (!roomList || roomList.length === 0) {
      console.log('No rooms found.');
      return;
    }

    const room = roomList[0];
    console.log(`\nChecking latest Room: ${room.id} (DocumentId: ${room.documentId})`);

    // 2. List Entities
    const sheets = room.character_sheets;
    if (!sheets || sheets.length === 0) {
      console.log('No entities found in this room.');
    } else {
      console.log(`Found ${sheets.length} entities:`);
      sheets.forEach((sheet: any) => {
        const pos = sheet.position || { x: '?', y: '?', z: '?' };
        console.log(` - [${sheet.type}] ${sheet.name}: (${pos.x}, ${pos.y}, ${pos.z})`);
      });
    }
  } catch (error) {
    console.error('Error querying Strapi:', error);
  }
}

main();
