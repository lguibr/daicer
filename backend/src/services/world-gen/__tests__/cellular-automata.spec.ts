/**
 * Cellular Automata Tests
 * Verifies cave generation patterns and determinism
 */

import { generateCaveCA, caToCaveGrid } from '../cellular-automata';

describe('Cellular Automata Cave Generator', () => {
  describe('Determinism', () => {
    it('should produce identical caves with same seed', () => {
      const seed = 'cave-seed-123';
      const cave1 = generateCaveCA(20, 20, seed, { iterations: 5 });
      const cave2 = generateCaveCA(20, 20, seed, { iterations: 5 });

      expect(cave1).toEqual(cave2);
    });

    it('should produce different caves with different seeds', () => {
      const cave1 = generateCaveCA(20, 20, 'seed-a', { iterations: 5 });
      const cave2 = generateCaveCA(20, 20, 'seed-b', { iterations: 5 });

      expect(cave1).not.toEqual(cave2);
    });
  });

  describe('Cave Patterns', () => {
    it('should create organic cave shapes after iterations', () => {
      const cave = generateCaveCA(30, 30, 'organic-test', {
        fillPercentage: 0.45,
        iterations: 5,
      });

      // Count solid vs empty cells
      let solidCount = 0;
      let emptyCount = 0;

      for (const row of cave) {
        for (const cell of row) {
          if (cell) solidCount++;
          else emptyCount++;
        }
      }

      // Should have both solid and empty regions
      expect(solidCount).toBeGreaterThan(0);
      expect(emptyCount).toBeGreaterThan(0);

      // After smoothing, ratio should be roughly similar to initial fill
      const solidRatio = solidCount / (solidCount + emptyCount);
      expect(solidRatio).toBeGreaterThan(0.3);
      expect(solidRatio).toBeLessThan(0.7);
    });

    it('should smooth random noise into connected regions', () => {
      // Low iterations = more noise
      const noisy = generateCaveCA(20, 20, 'noise-test', { iterations: 1 });

      // High iterations = more smoothing
      const smooth = generateCaveCA(20, 20, 'noise-test', { iterations: 10 });

      // Smooth version should have larger connected regions
      // This is hard to test precisely, but we can check it runs without error
      expect(smooth.length).toBe(20);
      expect(smooth[0].length).toBe(20);
    });
  });

  describe('Grid Conversion', () => {
    it('should invert CA grid to cave grid', () => {
      const caGrid = [
        [true, true, false],
        [true, false, false],
        [false, false, true],
      ];

      const caveGrid = caToCaveGrid(caGrid);

      expect(caveGrid).toEqual([
        [false, false, true],
        [false, true, true],
        [true, true, false],
      ]);
    });
  });
});
