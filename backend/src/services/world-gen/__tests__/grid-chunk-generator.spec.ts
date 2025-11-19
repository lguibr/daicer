/**
 * Grid Chunk Generator Tests
 * Verifies chunk generation determinism and consistency
 */

import { generateGridChunk, generateStartingArea } from '../grid-chunk-generator';

describe('Grid Chunk Generator', () => {
  describe('Determinism', () => {
    it('should generate identical chunks with same seed', () => {
      const params = {
        seed: 'chunk-seed-123',
        waterLevel: -0.1,
        mountainousness: 1.0,
        caveFrequency: 0.5,
      };

      const chunk1 = generateGridChunk(0, 0, 0, params);
      const chunk2 = generateGridChunk(0, 0, 0, params);

      expect(chunk1.tiles).toEqual(chunk2.tiles);
      expect(chunk1.features.length).toBe(chunk2.features.length);
      expect(chunk1.biomes).toEqual(chunk2.biomes);
    });

    it('should generate different chunks for different positions', () => {
      const params = {
        seed: 'position-test',
        waterLevel: -0.1,
        mountainousness: 1.0,
        caveFrequency: 0.5,
      };

      const chunk1 = generateGridChunk(0, 0, 0, params);
      const chunk2 = generateGridChunk(1, 0, 0, params);

      expect(chunk1.tiles).not.toEqual(chunk2.tiles);
    });
  });

  describe('Chunk Structure', () => {
    it('should generate correct number of tiles', () => {
      const chunk = generateGridChunk(0, 0, 0, {
        seed: 'tile-count-test',
      });

      expect(chunk.tiles.length).toBe(64); // 8x8 tiles
    });

    it('should set correct tile coordinates', () => {
      const chunk = generateGridChunk(5, 3, 0, {
        seed: 'coords-test',
      });

      // Chunk at (5, 3) should have tiles starting at world coords (40, 24)
      const firstTile = chunk.tiles[0];
      expect(firstTile.x).toBe(40); // 5 * 8
      expect(firstTile.y).toBe(24); // 3 * 8
    });

    it('should assign biomes to tiles', () => {
      const chunk = generateGridChunk(0, 0, 0, {
        seed: 'biome-test',
      });

      // All tiles should have a biome
      for (const tile of chunk.tiles) {
        expect(tile.biome).toBeTruthy();
        expect(typeof tile.biome).toBe('string');
      }

      // Chunk should track unique biomes
      expect(chunk.biomes.length).toBeGreaterThan(0);
    });
  });

  describe('Feature Generation', () => {
    it('should generate features on surface chunks (z=0)', () => {
      const chunk = generateGridChunk(0, 0, 0, {
        seed: 'feature-test-surface',
      });

      // Surface chunks may or may not have features (depends on biome)
      expect(Array.isArray(chunk.features)).toBe(true);
    });

    it('should not generate surface features on underground chunks', () => {
      const chunk = generateGridChunk(0, 0, -3, {
        seed: 'feature-test-underground',
      });

      // Underground chunks (z < 0) should not have surface features
      const surfaceFeatures = chunk.features.filter((f) => f.type === 'tree' || f.type === 'decoration');
      expect(surfaceFeatures.length).toBe(0);
    });
  });

  describe('Starting Area Generation', () => {
    it('should generate 32x32 chunks (1024 total)', () => {
      const chunks = generateStartingArea('starting-area-test', {
        seed: 'starting-area-test',
      });

      expect(chunks.length).toBe(1024); // 32 * 32
    });

    it('should mark all chunks as starting area', () => {
      const chunks = generateStartingArea('starting-flag-test', {
        seed: 'starting-flag-test',
      });

      for (const chunk of chunks) {
        expect(chunk.isStartingArea).toBe(true);
      }
    });

    it('should generate only z=0 (surface) for starting area', () => {
      const chunks = generateStartingArea('surface-only-test', {
        seed: 'surface-only-test',
      });

      for (const chunk of chunks) {
        expect(chunk.z).toBe(0);
      }
    });
  });
});
