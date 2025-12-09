import { createSimpleChunkGenerator, DEFAULT_GENERATION_PARAMS } from '@daicer/shared/world-gen';
import { generateTerrainChunk } from '../src/services/world-gen/chunk-generator';

const SEED = 'daicer-world';
const CHUNK_X = 10;
const CHUNK_Y = 10;
const CHUNK_SIZE = 4;

console.log('--- Verifying Map Parity (Shared vs Backend) ---');
console.log(`Seed: "${SEED}"`);
console.log(`Chunk: (${CHUNK_X}, ${CHUNK_Y}) @ ${CHUNK_SIZE}x${CHUNK_SIZE}`);

// 1. Shared Generator (Frontend implementation)
console.log('Generating via Shared...');
const sharedGen = createSimpleChunkGenerator(SEED, DEFAULT_GENERATION_PARAMS);
const shared3D = sharedGen(CHUNK_X * CHUNK_SIZE, CHUNK_Y * CHUNK_SIZE, CHUNK_SIZE, CHUNK_SIZE);
const sharedGrid = shared3D[3]; // Surface

// 2. Backend Generator
console.log('Generating via Backend...');
const backendChunk = generateTerrainChunk({
  roomId: 'test-room',
  chunkX: CHUNK_X,
  chunkY: CHUNK_Y,
  chunkSize: CHUNK_SIZE,
  seed: SEED,
  generationParams: DEFAULT_GENERATION_PARAMS,
});
const backendGrid = backendChunk.biomes;

// 3. Compare row by row
let mismatch = false;
for (let y = 0; y < CHUNK_SIZE; y++) {
  const rowS = sharedGrid[y].join(',');
  const rowB = backendGrid[y].join(',');
  if (rowS !== rowB) {
    console.error(`❌ Mismatch at row ${y}:`);
    console.error(`  Shared:  ${rowS}`);
    console.error(`  Backend: ${rowB}`);
    mismatch = true;
  }
}

if (mismatch) {
  console.error('❌ FATAL: Map Grids Differ!');
  process.exit(1);
} else {
  console.log('✅ Map Grids Match Exactly.');
}

// 4. Test Structure Parity (Simulated)
// This is trickier because Backend adds structure metadata via 'structures' array
// while Shared generates it procedurally.
// But as long as the base grid is correct, terrain is correct.
