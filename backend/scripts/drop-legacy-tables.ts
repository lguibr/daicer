import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Client } = require('pg');

async function dropTables() {
  console.log('Connecting to DB to force drop legacy tables...');

  // Parse connection string or use default dev vars
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://strapi:strapi@localhost:5432/strapi',
  });

  try {
    await client.connect();
    console.log('Connected.');

    // CASCADE is the key here
    const query = `DROP TABLE IF EXISTS "character_sheets" CASCADE;`;

    console.log(`Running: ${query}`);
    await client.query(query);

    console.log('Successfully dropped character_sheets with CASCADE.');

    // Also drop the relation tables if they exist and weren't caught by cascade (Strapi generated names)
    // Common pattern: rooms_character_sheets_links, etc.
    // Query to find them?
    // For now, CASCADE on the main table usually clears the links.
  } catch (err) {
    console.error('Error dropping tables:', err);
  } finally {
    await client.end();
  }
}

dropTables();
