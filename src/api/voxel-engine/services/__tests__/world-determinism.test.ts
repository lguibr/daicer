import { describe, expect, it } from 'vitest';
import { ChunkBuilder } from '@/api/voxel-engine/services/chunk-builder';
import { TerrainGenerator } from '@/api/voxel-engine/src/terrain-generator';
import { FloraGenerator } from '@/api/voxel-engine/services/generators/flora-generator';
import { Alea } from '@/api/voxel-engine/src/utils/math';
import { BlockType, type WorldConfig } from '@daicer/engine/types';
const config = {
  seed: 'world-regression',
  chunkSize: 32,
  globalScale: 0.02,
  seaLevel: 0,
  elevationScale: 0.5,
  roughness: 0.5,
  detail: 4,
  moistureScale: 0.015,
  temperatureOffset: 0,
  structureChance: 0.1,
  structureSpacing: 3,
  structureSizeAvg: 10,
  roadDensity: 0.1,
  fogRadius: 10,
} satisfies WorldConfig;
describe('Real world generation without database or remote services', () => {
  it.each([16, 32])('is independent of request order and builder reuse (%i)', (size) => {
    const cfg = { ...config, chunkSize: size };
    const coords = [
      [0, 0],
      [1, -1],
      [-2, 3],
    ];
    const expected = coords.map(([x, y]) => new ChunkBuilder(cfg).generateChunk(x, y));
    const shared = new ChunkBuilder(cfg);
    for (const index of [2, 0, 1, 0, 2]) {
      const [x, y] = coords[index];
      expect(shared.generateChunk(x, y)).toEqual(expected[index]);
    }
  });
  it.each([0, 0.5])('keeps zero-octave generation finite for detail %s', (detail) => {
    const cfg = { ...config, detail, structureChance: 0, roadDensity: 0 };
    const chunk = new ChunkBuilder(cfg).generateChunk(0, 0);
    for (const tile of chunk.tiles.flat(2)) {
      expect(tile.elevation).toBe(0);
      expect(Number.isFinite(tile.moisture)).toBe(true);
      expect(Number.isFinite(tile.variant)).toBe(true);
    }
    expect(new TerrainGenerator(cfg).getTileAt(0, 0, 0).elevation).toBe(0);
  });

  it('agrees between point sampling and chunk sampling at every z level', () => {
    const generator = new TerrainGenerator(config);
    const chunk = generator.generate(-1, 1);
    for (let z = -3; z <= 3; z++) expect(generator.getTileAt(-1, 33, z as any)).toEqual(chunk[z + 3][1][31]);
  });
  it.each([16, 32])('places flora using configured dimensions off-origin (%i)', (size) => {
    const cfg = { ...config, chunkSize: size, structureChance: 0, roadDensity: 0 };
    const chunk = new ChunkBuilder(cfg).generateChunk(-1, 1);
    FloraGenerator.generate(chunk.tiles, -1, 1, -size + 1, size + 1, 1, BlockType.TREE_OAK, new Alea('flora'));
    expect(chunk.tiles[4][1][1].block).toBe(BlockType.TREE_OAK);
  });
});
