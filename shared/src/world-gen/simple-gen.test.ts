import { describe, it, expect } from '@jest/globals';
import { createUnifiedTerrainGenerator, createSimpleChunkGenerator, DEFAULT_GENERATION_PARAMS } from './simple-gen';

describe('Unified Terrain Generator', () => {
  const seed = 'test-seed-123';
  const generator = createUnifiedTerrainGenerator(seed, {
    ...DEFAULT_GENERATION_PARAMS,
    bspSize: 64, // reduce size for test speed
  });

  it('should generate a ChunkDTO with correct structure', () => {
    const chunkSize = 16;
    const chunk = generator(0, 0, chunkSize);

    expect(chunk).toBeDefined();
    expect(chunk.size).toBe(chunkSize);
    expect(chunk.chunkX).toBe(0);
    expect(chunk.chunkY).toBe(0);
    expect(chunk.grid).toBeDefined();
    expect(chunk.grid.length).toBe(7); // 7 floors

    // Check dimensionality
    const surface = chunk.grid[3];
    expect(surface.length).toBe(chunkSize);
    expect(surface[0].length).toBe(chunkSize);

    // Check content
    const tile = surface[0][0];
    expect(tile.b).toBeDefined();
    expect(tile.t).toBeDefined();
    expect(typeof tile.b).toBe('string');
    expect(typeof tile.t).toBe('string');
  });

  it('should generate consistent results for same seed', () => {
    const gen1 = createUnifiedTerrainGenerator(seed, DEFAULT_GENERATION_PARAMS);
    const gen2 = createUnifiedTerrainGenerator(seed, DEFAULT_GENERATION_PARAMS);

    const chunk1 = gen1(0, 0, 16);
    const chunk2 = gen2(0, 0, 16);

    expect(JSON.stringify(chunk1.grid)).toEqual(JSON.stringify(chunk2.grid));
  });
});

describe('Legacy Simple Generator (Compat)', () => {
  const seed = 'test-seed-legacy';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const legacyGen = createSimpleChunkGenerator(seed, DEFAULT_GENERATION_PARAMS);

  it('should return 3D string array', () => {
    const grid = legacyGen(0, 0, 16, 16);

    expect(grid).toBeDefined();
    expect(grid.length).toBe(7); // 7 floors
    expect(grid[3].length).toBe(16);
    expect(grid[3][0].length).toBe(16); // 16x16

    // Check that it's strings
    expect(typeof grid[3][0][0]).toBe('string');
  });
});
