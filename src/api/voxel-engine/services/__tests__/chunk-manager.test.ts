import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChunkManager } from '@/api/voxel-engine/services/chunk-manager';
import { BlockType, type WorldConfig } from '@daicer/engine/types';

const transport = vi.hoisted(() => ({ workers: [] as any[], fail: false, hold: false, tasks: [] as any[] }));
vi.mock('worker_threads', () => ({
  Worker: class {
    handlers: Record<string, (message: any) => void> = {};
    constructor() {
      transport.workers.push(this);
    }
    on(event: string, fn: (message: any) => void) {
      this.handlers[event] = fn;
    }
    postMessage(task: any) {
      transport.tasks.push(task);
      if (transport.hold) return;
      queueMicrotask(() => {
        if (transport.fail) return this.handlers.message({ id: task.id, success: false, error: 'generation failed' });
        const size = task.config.chunkSize;
        this.handlers.message({
          id: task.id,
          success: true,
          result: {
            x: task.chunkX,
            y: task.chunkY,
            size,
            minZ: -3,
            maxZ: 3,
            seed: task.config.seed,
            tiles: Array.from({ length: 7 }, (_, z) =>
              Array.from({ length: size }, (_, y) =>
                Array.from({ length: size }, (_, x) => ({
                  x: task.chunkX * size + x,
                  y: task.chunkY * size + y,
                  z: z - 3,
                  block: task.config.seaLevel === 1 ? 'water' : 'grass',
                  biome: 'plains',
                  isWalkable: true,
                  isTransparent: true,
                }))
              )
            ),
          },
        });
      });
    }
  },
}));
const config = {
  seed: 'identical-seed',
  chunkSize: 16,
  globalScale: 0.02,
  seaLevel: 0,
  elevationScale: 0.5,
  roughness: 0.5,
  detail: 4,
  moistureScale: 0.015,
  temperatureOffset: 0,
  structureChance: 0,
  structureSpacing: 3,
  structureSizeAvg: 10,
  roadDensity: 0,
  fogRadius: 10,
} satisfies WorldConfig;

describe('World isolation with mocked worker and in-memory persistence', () => {
  let manager: ChunkManager;
  let rows: any[];
  let findMany: ReturnType<typeof vi.fn>;
  let create: ReturnType<typeof vi.fn>;
  const marker = (world: string, block = 'wall_wood', id = 1) => ({
    id,
    documentId: `edit-${id}`,
    world,
    timestamp: String(id),
    chunkX: 0,
    chunkY: 0,
    voxelX: 1,
    voxelY: 1,
    voxelZ: 0,
    newType: block,
  });
  const read = (world = 'world-a', cfg = config, x = 0, y = 0) => manager.getChunk(x, y, cfg, world);
  const edit = (overrides: Record<string, unknown> = {}) =>
    manager.editVoxel({
      worldId: 'world-a',
      config,
      chunkX: 0,
      chunkY: 0,
      voxelX: 1,
      voxelY: 1,
      voxelZ: 0,
      newType: BlockType.WALL_STONE,
      ...overrides,
    });
  beforeEach(() => {
    (ChunkManager as any).instance = undefined;
    transport.workers.length = 0;
    transport.tasks.length = 0;
    transport.fail = false;
    transport.hold = false;
    rows = [];
    findMany = vi.fn(async ({ filters, start = 0, limit = rows.length }: any) =>
      rows
        .filter(
          (r) => r.world === filters.world?.documentId && r.chunkX === filters.chunkX && r.chunkY === filters.chunkY
        )
        .sort((a, b) =>
          BigInt(a.timestamp) < BigInt(b.timestamp) ? -1 : BigInt(a.timestamp) > BigInt(b.timestamp) ? 1 : a.id - b.id
        )
        .slice(start, start + limit)
    );
    create = vi.fn(async ({ data }: any) => {
      const row = { ...data, id: rows.length + 1, documentId: `edit-${rows.length + 1}` };
      rows.push(row);
      return row;
    });
    vi.stubGlobal('strapi', { documents: vi.fn(() => ({ findMany, create })) });
    manager = ChunkManager.getInstance();
  });
  it('isolates cold, warm, concurrent and eviction/reload reads with identical seeds', async () => {
    rows.push(marker('world-a'));
    const [a, b] = await Promise.all([read('world-a'), read('world-b')]);
    expect(a.tiles[3][1][1].block).toBe('wall_wood');
    expect(b.tiles[3][1][1].block).toBe('grass');
    for (const world of ['world-b', 'world-a', 'world-b'])
      expect((await read(world)).tiles[3][1][1].block).toBe(world === 'world-a' ? 'wall_wood' : 'grass');
    for (let x = 1; x <= 202; x++) await read('world-a', config, x);
    expect((await read('world-a')).tiles[3][1][1].block).toBe('wall_wood');
    expect((await read('world-b')).tiles[3][1][1].block).toBe('grass');
    expect(transport.tasks.filter((t) => t.chunkX === 0)).toHaveLength(4);
    expect(findMany.mock.calls.every(([q]) => q.filters.world.documentId)).toBe(true);
  });
  it('coalesces concurrent misses without exposing incomplete overlays', async () => {
    let release!: (rows: any[]) => void;
    findMany.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        })
    );
    const first = read();
    await vi.waitFor(() => expect(findMany).toHaveBeenCalledTimes(1));
    let finished = false;
    const second = read().then((c) => {
      finished = true;
      return c;
    });
    await Promise.resolve();
    expect(finished).toBe(false);
    release([marker('world-a')]);
    expect((await first).tiles[3][1][1].block).toBe('wall_wood');
    expect((await second).tiles[3][1][1].block).toBe('wall_wood');
    expect(transport.tasks).toHaveLength(1);
  });
  it('keys configuration and returns independent snapshots', async () => {
    const a = await read();
    const b = await read('world-a', { ...config, seaLevel: 1 });
    expect(b.tiles[3][1][1].block).toBe('water');
    expect(b.configHash).not.toBe(a.configHash);
    expect(a.worldId).toBe('world-a');
    expect(a.generatorVersion).toBeTruthy();
    a.tiles[3][1][1].block = 'corruption';
    expect((await read()).tiles[3][1][1].block).toBe('grass');
  });
  it('rejects absent identity and offers a separate pure preview', async () => {
    await expect(manager.getChunk(0, 0, config, undefined as any)).rejects.toThrow(/world/i);
    expect((await manager.getPreviewChunk(0, 0, config)).tiles[3][1][1].block).toBe('grass');
    expect(findMany).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
  it('replays all pages in numeric timestamp and id order', async () => {
    for (let i = 1; i <= 520; i++) rows.push(marker('world-a', 'stone', i));
    rows.push({ ...marker('world-a', 'wall_wood', 521), timestamp: '9007199254740993' });
    rows.push({ ...marker('world-a', 'grass', 522), timestamp: '9007199254740992' });
    rows.push({ ...marker('world-a', 'door', 523), timestamp: '9007199254740993' });
    expect((await read()).tiles[3][1][1]).toMatchObject({ block: 'door', isWalkable: true, isTransparent: true });
    expect(findMany.mock.calls.length).toBeGreaterThan(1);
    expect(findMany.mock.calls[0][0].sort).toEqual([{ timestamp: 'asc' }, { id: 'asc' }]);
  });
  it('preserves the current block for metadata-only edits and isolates other worlds', async () => {
    rows.push(marker('world-a', 'stone'));
    const before = await read();
    await read('world-b');
    await edit({ newType: undefined, metadata: { marker: 'here' } });
    expect(create.mock.calls[0][0].data).toMatchObject({ newType: 'stone', previousType: 'stone', world: 'world-a' });
    const after = await read();
    expect(after.tiles[3][1][1]).toMatchObject({
      block: 'stone',
      metadata: { marker: 'here' },
      isWalkable: false,
      isTransparent: false,
    });
    expect(after.revision).not.toBe(before.revision);
    expect((await read('world-b')).tiles[3][1][1].block).toBe('grass');
  });
  it('rejects metadata that cannot survive JSON persistence', async () => {
    await expect(edit({ metadata: { invalid: Infinity } })).rejects.toThrow(/JSON/);
    await expect(edit({ metadata: { invalid: new Date() } })).rejects.toThrow(/JSON/);
    expect(create).not.toHaveBeenCalled();
  });

  it('keeps content revisions stable after metadata key reordering and cache eviction', async () => {
    rows.push({ ...marker('world-a'), metadata: { z: { b: 2, a: 1 }, a: 3 } });
    const first = await read();
    rows[0].metadata = { a: 3, z: { a: 1, b: 2 } };
    for (let x = 1; x <= 201; x++) await read('world-a', config, x);
    expect((await read()).revision).toBe(first.revision);
  });

  it('does not mutate cached state on failed writes', async () => {
    const before = await read();
    create.mockRejectedValueOnce(new Error('write failed'));
    await expect(edit()).rejects.toThrow('write failed');
    expect(await read()).toEqual(before);
  });
  it('does not cache generated base terrain when replay fails', async () => {
    findMany.mockRejectedValueOnce(new Error('read failed'));
    await expect(read()).rejects.toThrow('read failed');
    rows.push(marker('world-a'));
    expect((await read()).tiles[3][1][1].block).toBe('wall_wood');
    expect(transport.tasks).toHaveLength(2);
  });
  it('serializes concurrent edits and invalidates all world/chunk config variants', async () => {
    await read();
    await read('world-a', { ...config, seaLevel: 1 });
    await read('world-b');
    await Promise.all([edit({ metadata: { one: 1 } }), edit({ newType: undefined, metadata: { two: 2 } })]);
    expect(create.mock.calls[1][0].data.newType).toBe('wall_stone');
    expect((await read('world-a', { ...config, seaLevel: 1 })).tiles[3][1][1]).toMatchObject({
      block: 'wall_stone',
      metadata: { one: 1, two: 2 },
    });
    expect((await read('world-b')).tiles[3][1][1].block).toBe('grass');
  });
  it.each([16, 32])('edits boundaries and maps negative coordinates for size %i', async (size) => {
    const cfg = { ...config, chunkSize: size };
    await edit({ config: cfg, chunkX: -1, chunkY: -1, voxelX: size - 1, voxelY: size - 1, voxelZ: -3 });
    expect(await manager.getTileAt(-1, -1, -3, cfg, 'world-a')).toMatchObject({
      x: -1,
      y: -1,
      z: -3,
      block: 'wall_stone',
      isWalkable: false,
    });
    await edit({ config: cfg, voxelX: size - 1, voxelY: size - 1, voxelZ: 3 });
    expect((await manager.getTileAt(size - 1, size - 1, 3, cfg, 'world-a')).block).toBe('wall_stone');
  });
  it.each([{ worldId: '' }, { chunkX: NaN }, { voxelX: 16 }, { voxelY: -1 }, { voxelZ: 4 }, { voxelZ: 0.5 }])(
    'rejects invalid edits before persistence: %j',
    async (override) => {
      await expect(edit(override)).rejects.toThrow();
      expect(create).not.toHaveBeenCalled();
    }
  );
  it('releases pending operations on worker failure/exit and can retry', async () => {
    transport.fail = true;
    await expect(read()).rejects.toThrow('generation failed');
    transport.fail = false;
    transport.hold = true;
    const pending = read();
    await vi.waitFor(() => expect(transport.tasks).toHaveLength(2));
    const rejected = expect(pending).rejects.toThrow(/exit/i);
    transport.workers[0].handlers.exit(1);
    await rejected;
    transport.hold = false;
    expect((await read()).worldId).toBe('world-a');
    expect(transport.workers).toHaveLength(2);
  });
});
