/**
 * Grid Chunk Generation Tests
 * Verifies that chunk generation works correctly and matches expected format
 */

import { generateGridChunk } from '../../services/world-gen/grid-chunk-generator';

describe('Grid Chunk Generation', () => {
  const testSeed = 'test-seed-123';
  const defaultParams = {
    seed: testSeed,
    waterLevel: -0.1,
    mountainousness: 1.0,
    caveFrequency: 0.5,
  };

  describe('generateGridChunk', () => {
    it('should generate a valid chunk with tiles', () => {
      const chunk = generateGridChunk(0, 0, 0, defaultParams);

      expect(chunk).toBeDefined();
      expect(chunk.tiles).toBeDefined();
      expect(Array.isArray(chunk.tiles)).toBe(true);
      expect(chunk.tiles.length).toBe(64); // 8x8 chunk = 64 tiles
    });

    it('should generate deterministic chunks with same seed', () => {
      const chunk1 = generateGridChunk(0, 0, 0, defaultParams);
      const chunk2 = generateGridChunk(0, 0, 0, defaultParams);

      expect(chunk1.tiles).toEqual(chunk2.tiles);
      expect(chunk1.biomes).toEqual(chunk2.biomes);
    });

    it('should generate different chunks with different seeds', () => {
      const chunk1 = generateGridChunk(0, 0, 0, { ...defaultParams, seed: 'seed1' });
      const chunk2 = generateGridChunk(0, 0, 0, { ...defaultParams, seed: 'seed2' });

      expect(chunk1.tiles).not.toEqual(chunk2.tiles);
    });

    it('should generate different chunks at different coordinates', () => {
      const chunk1 = generateGridChunk(0, 0, 0, defaultParams);
      const chunk2 = generateGridChunk(1, 0, 0, defaultParams);

      expect(chunk1.tiles).not.toEqual(chunk2.tiles);
    });

    it('should include features array', () => {
      const chunk = generateGridChunk(0, 0, 0, defaultParams);

      expect(chunk.features).toBeDefined();
      expect(Array.isArray(chunk.features)).toBe(true);
    });

    it('should include biomes array', () => {
      const chunk = generateGridChunk(0, 0, 0, defaultParams);

      expect(chunk.biomes).toBeDefined();
      expect(Array.isArray(chunk.biomes)).toBe(true);
      expect(chunk.biomes.length).toBeGreaterThan(0);
    });

    it('should generate tiles with correct structure', () => {
      const chunk = generateGridChunk(0, 0, 0, defaultParams);

      const sampleTile = chunk.tiles[0];
      expect(sampleTile).toBeDefined();
      expect(sampleTile).toHaveProperty('x');
      expect(sampleTile).toHaveProperty('y');
      expect(sampleTile).toHaveProperty('blockType');
      expect(sampleTile).toHaveProperty('biome');
    });

    it('should handle different z-levels', () => {
      const surface = generateGridChunk(0, 0, 0, defaultParams);
      const underground = generateGridChunk(0, 0, -1, defaultParams);

      expect(surface.tiles).toBeDefined();
      expect(underground.tiles).toBeDefined();
      // Underground should have different tile types
      expect(surface.tiles).not.toEqual(underground.tiles);
    });

    it('should generate chunks for large coordinates', () => {
      const chunk = generateGridChunk(100, 100, 0, defaultParams);

      expect(chunk.tiles).toBeDefined();
      expect(chunk.tiles.length).toBe(64);
    });

    it('should generate chunks for negative coordinates', () => {
      const chunk = generateGridChunk(-10, -10, 0, defaultParams);

      expect(chunk.tiles).toBeDefined();
      expect(chunk.tiles.length).toBe(64);
    });
  });
});
