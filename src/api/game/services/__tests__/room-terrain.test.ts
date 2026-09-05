import { describe, expect, it, vi } from 'vitest';
import { maskedTerrainChunk, projectRoomTerrain } from '@/api/game/services/room-terrain';

function fixture(chunkSize = 16) {
  const getChunk = vi.fn(async (x, y, config, worldId) => ({
    x, y, size: config.chunkSize, worldId, minZ: -3, maxZ: 3, revision: `${worldId}:${x}:${y}`,
    tiles: Array.from({ length: 7 }, (_, zi) => Array.from({ length: chunkSize }, (_, ly) =>
      Array.from({ length: chunkSize }, (_, lx) => {
        const wall = x * chunkSize + lx === 0 && y * chunkSize + ly === 0;
        return { x: x * chunkSize + lx, y: y * chunkSize + ly, z: zi - 3, block: wall ? 'wall_stone' : 'grass',
          biome: 'plains', isTransparent: !wall, isWalkable: !wall, metadata: { secret: 'private overlay' } };
      }))),
  }));
  return { getChunk, strapi: { service: () => ({ getChunk }) }, world: { documentId: 'w1', seed: 'same', fogRadius: 3, chunkSize } };
}

describe('viewer terrain projection', () => {
  it.each([16, 32])('uses actual %i geometry, wall occlusion and one immutable load per chunk', async (size) => {
    const f = fixture(size), terrain = await projectRoomTerrain(f.strapi, f.world, { x: -1, y: 0, z: 0 });
    expect(terrain.tiles.some((tile) => tile.x === 0 && tile.y === 0)).toBe(true);
    expect(terrain.tiles.some((tile) => tile.x === 1 && tile.y === 0)).toBe(false);
    expect(terrain.tiles.every((tile) => tile.z === 0 && !('metadata' in tile))).toBe(true);
    const calls = f.getChunk.mock.calls;
    expect(new Set(calls.map(([x, y]) => `${x},${y}`)).size).toBe(calls.length);
    expect(calls.every(([, , config, world]) => config.chunkSize === size && world === 'w1')).toBe(true);
    const masked = maskedTerrainChunk(terrain, -1, 0, 'w1', size);
    expect(masked.tiles[3][0][size - 1]).toMatchObject({ x: -1, y: 0, z: 0 });
    expect(masked.tiles[4][0][size - 1]).toBeNull();
    expect(maskedTerrainChunk(terrain, -1, 0, 'other', size).tiles.flat(2).every((tile) => tile === null)).toBe(true);
  });
  it('preserves zero fog radius and rejects missing or mismatched world context', async () => {
    const f = fixture(); f.world.fogRadius = 0;
    const terrain = await projectRoomTerrain(f.strapi, f.world, { x: -1, y: 0, z: 0 });
    expect(terrain.tiles).toHaveLength(1);
    expect(f.getChunk).toHaveBeenCalledTimes(1);
    expect(await projectRoomTerrain(f.strapi, f.world, null)).toBeNull();
    f.getChunk.mockImplementation(async () => ({ worldId: 'foreign' }) as any);
    await expect(projectRoomTerrain(f.strapi, f.world, { x: -1, y: 0, z: 0 })).rejects.toThrow('identity');
  });
  it('propagates overlay read failures and bounds pathological windows', async () => {
    const f = fixture(); f.getChunk.mockRejectedValue(new Error('overlay read failed'));
    await expect(projectRoomTerrain(f.strapi, f.world, { x: 0, y: 0, z: 0 })).rejects.toThrow('overlay read failed');
    await expect(projectRoomTerrain(f.strapi, { ...f.world, chunkSize: 1, fogRadius: 20 }, { x: 0, y: 0, z: 0 })).rejects.toThrow('chunk count');
  });
});
