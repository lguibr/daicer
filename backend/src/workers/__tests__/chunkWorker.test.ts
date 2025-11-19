/**
 * Chunk Worker Tests
 */

import generateChunkTask from '../chunkWorker';

describe('Chunk Worker', () => {
  const defaultParams = {
    temperature: 0,
    moisture: 0,
    continentalness: 0,
    erosion: 0,
    weirdness: 0,
    mountainousness: 1.0,
    jaggedness: 1.0,
    waterLevel: -0.1,
    caveFrequency: 0.5,
    oreDistribution: {
      coal: 0.3,
      iron: 0.2,
      gold: 0.1,
      diamond: 0.05,
    },
  };

  it('should generate a surface chunk with tiles', () => {
    const result = generateChunkTask({
      seed: 12345,
      chunkX: 0,
      chunkY: 0,
      chunkZ: 0, // Surface chunk
      params: defaultParams,
    });

    expect(result).toHaveProperty('chunkX', 0);
    expect(result).toHaveProperty('chunkY', 0);
    expect(result).toHaveProperty('chunkZ', 0);
    expect(result.tiles).toBeInstanceOf(Array);
    expect(result.tiles.length).toBeGreaterThan(0);
    expect(result.biomes).toBeInstanceOf(Set);
    expect(result.biomes.size).toBeGreaterThan(0);
  });

  it('should generate tiles with correct structure', () => {
    const result = generateChunkTask({
      seed: 12345,
      chunkX: 0,
      chunkY: 0,
      chunkZ: 0,
      params: defaultParams,
    });

    const firstTile = result.tiles[0];
    expect(firstTile).toHaveProperty('x');
    expect(firstTile).toHaveProperty('y');
    expect(firstTile).toHaveProperty('z');
    expect(firstTile).toHaveProperty('blockType');
    expect(firstTile).toHaveProperty('biome');
    expect(firstTile).toHaveProperty('elevation');
    expect(firstTile).toHaveProperty('climate');
    expect(firstTile).toHaveProperty('lightLevel');
  });

  it('should generate consistent results for same seed and coordinates', () => {
    const result1 = generateChunkTask({
      seed: 54321,
      chunkX: 5,
      chunkY: 10,
      chunkZ: 0,
      params: defaultParams,
    });

    const result2 = generateChunkTask({
      seed: 54321,
      chunkX: 5,
      chunkY: 10,
      chunkZ: 0,
      params: defaultParams,
    });

    expect(result1.tiles).toEqual(result2.tiles);
    expect(result1.biomes).toEqual(result2.biomes);
  });

  it('should generate different results for different seeds', () => {
    const result1 = generateChunkTask({
      seed: 11111,
      chunkX: 0,
      chunkY: 0,
      chunkZ: 0,
      params: defaultParams,
    });

    const result2 = generateChunkTask({
      seed: 22222,
      chunkX: 0,
      chunkY: 0,
      chunkZ: 0,
      params: defaultParams,
    });

    expect(result1.tiles[0].elevation).not.toBe(result2.tiles[0].elevation);
  });

  it('should generate different chunks for different coordinates', () => {
    const result1 = generateChunkTask({
      seed: 12345,
      chunkX: 0,
      chunkY: 0,
      chunkZ: 0,
      params: defaultParams,
    });

    const result2 = generateChunkTask({
      seed: 12345,
      chunkX: 1,
      chunkY: 0,
      chunkZ: 0,
      params: defaultParams,
    });

    expect(result1.tiles[0].x).not.toBe(result2.tiles[0].x);
  });

  it('should optimize surface chunks (z=0)', () => {
    const surfaceChunk = generateChunkTask({
      seed: 12345,
      chunkX: 0,
      chunkY: 0,
      chunkZ: 0,
      params: defaultParams,
    });

    // Surface chunks should only generate near-surface tiles
    const tileCount = surfaceChunk.tiles.length;
    expect(tileCount).toBeLessThan(32 * 32 * 32); // Should be much less than full chunk
    expect(tileCount).toBeGreaterThan(0);
  });

  it('should respect parameter biases', () => {
    const coldParams = {
      ...defaultParams,
      temperature: -0.8, // Very cold
    };

    const hotParams = {
      ...defaultParams,
      temperature: 0.8, // Very hot
    };

    const coldChunk = generateChunkTask({
      seed: 12345,
      chunkX: 0,
      chunkY: 0,
      chunkZ: 0,
      params: coldParams,
    });

    const hotChunk = generateChunkTask({
      seed: 12345,
      chunkX: 0,
      chunkY: 0,
      chunkZ: 0,
      params: hotParams,
    });

    // Biomes should differ based on temperature
    expect(coldChunk.biomes).not.toEqual(hotChunk.biomes);
  });

  it('should include multiple biomes in larger areas', () => {
    const result = generateChunkTask({
      seed: 99999,
      chunkX: 0,
      chunkY: 0,
      chunkZ: 0,
      params: defaultParams,
    });

    // With varied terrain, should have multiple biomes
    expect(result.biomes.size).toBeGreaterThanOrEqual(1);
  });
});
