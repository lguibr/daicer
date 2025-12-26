import { strapi } from '@strapi/client';

async function main() {
  console.log('Testing Voxel Preview GraphQL Endpoint...');

  // 1. Get Auth Token
  let jwt = '';
  try {
    const authRes = await fetch('http://localhost:1337/api/auth/local/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'Password123!',
      }),
    });
    const authData = await authRes.json();
    if (authData.jwt) {
      jwt = authData.jwt;
      console.log('Got JWT Token via Register');
    } else {
      console.log(
        'Register failed (or user exists), attempting without token (or implement login). Auth response:',
        authData
      );
    }
  } catch (e) {
    console.warn('Auth flow failed', e);
  }

  // Define the query
  const query = `
    query VoxelPreview($chunks: [ChunkRequestInput]!, $config: WorldConfigInput!) {
      voxelPreview(chunks: $chunks, config: $config)
    }
  `;

  // Define variables
  const variables = {
    chunks: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
    config: {
      seed: 'test-seed',
      chunkSize: 32,
      globalScale: 0.01,
      seaLevel: 0,
      elevationScale: 1,
      roughness: 0.5,
      detail: 4,
      moistureScale: 1,
      temperatureOffset: 0,
      structureChance: 0.1,
      structureSpacing: 10,
      structureSizeAvg: 10,
      roadDensity: 0.5,
      fogRadius: 10,
    },
  };

  try {
    // We use a raw fetch here because @strapi/client is mostly for REST collections
    // But we can use the baseURL from it or just standard fetch
    const response = await fetch('http://localhost:1337/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();

    if (result.errors) {
      console.error('GraphQL Errors:', result.errors);
      process.exit(1);
    }

    const chunks = result.data?.voxelPreview;
    console.log(`Successfully fetched ${chunks?.length} chunks.`);

    if (chunks && chunks.length > 0) {
      const firstChunk = chunks[0];
      console.log('First Chunk Preview:', {
        position: firstChunk.position,
        biome: firstChunk.biome,
        tilesCount: firstChunk.tiles?.length,
      });
    }
  } catch (error) {
    console.error('Test Failed:', error);
    process.exit(1);
  }
}

main();
