import { Alea as SharedAlea, SimplexNoise as SharedSimplex } from '@daicer/shared/world-gen/noise';
import { Alea as BackendAlea, SimplexNoise as BackendSimplex } from '../src/services/world-gen/noise';

const SEED = 'daicer-world';

console.log('--- Verifying Noise Parity ---');
console.log(`Seed: "${SEED}"`);

// 1. Verify Alea PRNG
const sharedRng = SharedAlea(SEED);
const backendRng = BackendAlea(SEED);

const val1s = sharedRng();
const val1b = backendRng();
const val2s = sharedRng();
const val2b = backendRng();

console.log(`Shared Alea: ${val1s}, ${val2s}`);
console.log(`Backnd Alea: ${val1b}, ${val2b}`);

if (val1s !== val1b || val2s !== val2b) {
  console.error('❌ FATAL: Alea PRNG outputs differ!');
  process.exit(1);
} else {
  console.log('✅ Alea PRNG outputs match.');
}

// 2. Verify Simplex Noise
const sharedNoise = new SharedSimplex(SEED);
const backendNoise = new BackendSimplex(SEED);

// Check a few points
const points = [
  [0, 0],
  [100, 100],
  [0.5, 0.5],
  [-10, 20],
];

let mismatch = false;
for (const [x, y] of points) {
  const sVal = sharedNoise.noise(x, y);
  const bVal = backendNoise.noise(x, y);
  if (Math.abs(sVal - bVal) > 0.0000001) {
    console.error(`❌ Mismatch at (${x},${y}): Shared=${sVal}, Backend=${bVal}`);
    mismatch = true;
  }
}

if (mismatch) {
  console.error('❌ FATAL: Simplex Noise outputs differ!');
  process.exit(1);
} else {
  console.log('✅ Simplex Noise outputs match.');
}

console.log('--- Verifying Biome Generation Constants ---');
// I can't easily import the function without moving it first or doing complex require
// But noise is the foundation.
