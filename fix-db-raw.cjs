const { Client } = require('pg');

const configs = [
  { database: 'daicer', user: 'lg', host: '127.0.0.1' },
  { database: 'daicer', user: 'postgres', host: '127.0.0.1' },
  { database: 'daicer', user: 'daicer', password: 'password', host: '127.0.0.1' },
  { database: 'strapi', user: 'strapi', password: 'strapi', host: '127.0.0.1' },
];

async function run() {
  for (const config of configs) {
    console.log(`Trying ${config.user}@${config.host}/${config.database}...`);
    const client = new Client(config);
    try {
      await client.connect();
      console.log('Connected!');
      await client.query('ALTER TABLE races DROP COLUMN speed;');
      console.log('SUCCESS: Dropped speed column.');
      await client.end();
      process.exit(0);
    } catch (e) {
      console.log('Failed:', e.message);
      try {
        await client.end();
      } catch {}
    }
  }
  console.log('All attempts failed.');
  process.exit(1);
}

run();
