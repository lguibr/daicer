/** World-scoped generation and persisted overlays. See ../README.md for caller contracts. */
import { Worker } from 'worker_threads';
import path from 'path';
import { createHash } from 'crypto';
import type { Utils } from '@strapi/strapi';
import type { Chunk, WorldConfig, Tile } from '@daicer/engine/types';
import { normalizeWorldConfig, requireWorldId, worldConfigHash } from '@/api/world/utils/world-config';
import { TileHelper } from './utils/tile-helper';

export const GENERATOR_VERSION = 'world-terrain-v2';
const CACHE_LIMIT = 200;
const PAGE_SIZE = 256;

export interface WorldChunk extends Chunk {
  worldId: string;
  configHash: string;
  generatorVersion: string;
  /** Opaque content revision, stable across eviction/reload. Not a turn counter. */
  revision: string;
}

export interface VoxelChangeRecord {
  id: number;
  timestamp: string | number;
  chunkX: number;
  chunkY: number;
  voxelX: number;
  voxelY: number;
  voxelZ: number;
  newType: string;
  metadata?: Record<string, unknown> | null;
}

export interface VoxelEdit {
  worldId: string;
  config: WorldConfig;
  chunkX: number;
  chunkY: number;
  voxelX: number;
  voxelY: number;
  voxelZ: number;
  /** Omit for a metadata-only update. The final world's block is preserved. */
  newType?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

function integer(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) throw new Error(`${label} must be a safe integer`);
}
function timestamp(value: string | number): bigint {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) throw new Error('Unsafe voxel timestamp');
  if (!/^-?\d+$/.test(String(value))) throw new Error('Invalid voxel timestamp');
  return BigInt(value);
}
function ordered(changes: VoxelChangeRecord[]): VoxelChangeRecord[] {
  for (const change of changes) {
    timestamp(change.timestamp);
    integer(change.id, 'Voxel change id');
  }
  return [...changes].sort((a, b) => {
    const ta = timestamp(a.timestamp),
      tb = timestamp(b.timestamp);
    return ta < tb ? -1 : ta > tb ? 1 : a.id - b.id;
  });
}

/** JSON metadata has stable key order so media/database serializers cannot change revisions. */
function jsonValue(value: unknown, depth = 0): Utils.JSONValue {
  if (depth > 64) throw new Error('Metadata nesting exceeds limit');
  if (value === null) return null;
  if (typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.map((entry) => jsonValue(entry, depth + 1));
  if (typeof value === 'object' && value && Object.getPrototypeOf(value) === Object.prototype)
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, jsonValue(value[key], depth + 1)])
    );
  throw new Error('Metadata must contain only JSON values');
}

export class ChunkManager {
  private static instance: ChunkManager;
  private worker?: Worker;
  private sequence = 0;
  private pending = new Map<string, { resolve: (chunk: Chunk) => void; reject: (error: Error) => void }>();
  private cache = new Map<string, WorldChunk>();
  /** Same world/coordinates serialize across config variants, including read-before-write. */
  private operations = new Map<string, Promise<unknown>>();

  private constructor() {}

  public static getInstance(): ChunkManager {
    return (ChunkManager.instance ??= new ChunkManager());
  }

  private generate(x: number, y: number, config: WorldConfig): Promise<Chunk> {
    if (!this.worker) {
      const worker = new Worker(path.resolve(process.cwd(), 'src/api/voxel-engine/services/chunk-worker-loader.js'));
      this.worker = worker;
      worker.on('message', (msg: { id: string; success: boolean; result: Chunk; error?: string }) => {
        const request = this.pending.get(msg.id);
        if (!request) return;
        this.pending.delete(msg.id);
        if (msg.success) request.resolve(msg.result);
        else request.reject(new Error(msg.error || 'Chunk generation failed'));
      });
      const fail = (error: Error) => {
        if (this.worker !== worker) return;
        this.worker = undefined;
        for (const request of this.pending.values()) request.reject(error);
        this.pending.clear();
      };
      worker.on('error', fail);
      worker.on('exit', (code) => fail(new Error(`Chunk worker exited (${code})`)));
    }
    return new Promise((resolve, reject) => {
      const id = String(++this.sequence);
      this.pending.set(id, { resolve, reject });
      try {
        this.worker!.postMessage({ id, chunkX: x, chunkY: y, config });
      } catch (error) {
        this.pending.delete(id);
        reject(error);
      }
    });
  }

  private validateChunk(x: number, y: number, config: WorldConfig): void {
    integer(x, 'Chunk x');
    integer(y, 'Chunk y');
    // Ensure every world cell in the requested chunk remains exactly representable.
    integer(x * config.chunkSize, 'World x');
    integer(y * config.chunkSize, 'World y');
    integer(x * config.chunkSize + config.chunkSize - 1, 'World x');
    integer(y * config.chunkSize + config.chunkSize - 1, 'World y');
  }

  private serialize<T>(worldId: string, x: number, y: number, operation: () => Promise<T>): Promise<T> {
    const key = JSON.stringify([worldId, x, y]);
    const previous = this.operations.get(key) ?? Promise.resolve();
    const next = previous.then(operation, operation);
    const settled = next.then(
      () => undefined,
      () => undefined
    );
    this.operations.set(key, settled);
    void settled.then(() => {
      if (this.operations.get(key) === settled) this.operations.delete(key);
    });
    return next;
  }

  private cacheKey(worldId: string, x: number, y: number, config: WorldConfig): string {
    return JSON.stringify([worldId, GENERATOR_VERSION, worldConfigHash(config), x, y]);
  }

  private async changes(worldId: string, x: number, y: number): Promise<VoxelChangeRecord[]> {
    const result: VoxelChangeRecord[] = [];
    for (let start = 0; ; start += PAGE_SIZE) {
      const page = (await strapi.documents('api::voxel-change.voxel-change').findMany({
        filters: { world: { documentId: worldId }, chunkX: x, chunkY: y },
        sort: [{ timestamp: 'asc' }, { id: 'asc' }],
        start,
        limit: PAGE_SIZE,
      })) as unknown as VoxelChangeRecord[];
      result.push(...page);
      if (page.length < PAGE_SIZE) return ordered(result);
    }
  }

  /** Reject malformed stored coordinates rather than silently losing persisted edits. */
  public applyVoxelChanges(chunk: Chunk, changes: VoxelChangeRecord[]): Chunk {
    for (const change of ordered(changes)) {
      if (change.chunkX !== chunk.x || change.chunkY !== chunk.y)
        throw new Error('Voxel change belongs to a different chunk');
      const tile = this.localTile(chunk, change.voxelX, change.voxelY, change.voxelZ);
      if (typeof change.newType !== 'string' || !change.newType.trim()) throw new Error('Invalid persisted block type');
      TileHelper.applyBlock(tile, change.newType);
      if (change.metadata) {
        const metadata = jsonValue({ ...tile.metadata, ...change.metadata });
        tile.metadata = metadata as Record<string, unknown>;
      }
    }
    return chunk;
  }

  private localTile(chunk: Chunk, x: number, y: number, z: number): Tile {
    integer(x, 'Voxel x');
    integer(y, 'Voxel y');
    integer(z, 'Voxel z');
    if (x < 0 || x >= chunk.size || y < 0 || y >= chunk.size || z < chunk.minZ || z > chunk.maxZ)
      throw new Error('Voxel coordinates outside chunk bounds');
    const tile = chunk.tiles[z - chunk.minZ]?.[y]?.[x];
    if (!tile) throw new Error('Incomplete chunk tile data');
    return tile;
  }

  private async load(x: number, y: number, config: WorldConfig, worldId: string): Promise<WorldChunk> {
    const key = this.cacheKey(worldId, x, y, config);
    const cached = this.cache.get(key);
    if (cached) {
      this.cache.delete(key);
      this.cache.set(key, cached);
      return cached;
    }
    const chunk = await this.generate(x, y, config);
    if (chunk.x !== x || chunk.y !== y || chunk.size !== config.chunkSize || chunk.minZ !== -3 || chunk.maxZ !== 3)
      throw new Error('Generated chunk does not match request');
    this.applyVoxelChanges(chunk, await this.changes(worldId, x, y));
    const identity = { worldId, configHash: worldConfigHash(config), generatorVersion: GENERATOR_VERSION };
    const result: WorldChunk = {
      ...chunk,
      ...identity,
      revision: createHash('sha256')
        .update(JSON.stringify([identity, x, y, chunk.tiles]))
        .digest('hex'),
    };
    this.cache.set(key, result);
    if (this.cache.size > CACHE_LIMIT) this.cache.delete(this.cache.keys().next().value!);
    return result;
  }

  /** Persisted reads require the application's authorized World.documentId and world configuration. */
  public async getChunk(x: number, y: number, config: WorldConfig, worldId: string): Promise<WorldChunk> {
    requireWorldId(worldId);
    const normalized = normalizeWorldConfig(config);
    this.validateChunk(x, y, normalized);
    return this.serialize(worldId, x, y, async () => structuredClone(await this.load(x, y, normalized, worldId)));
  }

  /** Pure editor preview: no persisted overlays, database access or shared world cache. */
  public async getPreviewChunk(x: number, y: number, config: WorldConfig): Promise<Chunk> {
    const normalized = normalizeWorldConfig(config);
    this.validateChunk(x, y, normalized);
    return this.generate(x, y, normalized);
  }

  /** Final terrain lookup for collision/visibility consumers; negative coordinates use floor division. */
  public async getTileAt(x: number, y: number, z: number, config: WorldConfig, worldId: string): Promise<Tile> {
    integer(x, 'World x');
    integer(y, 'World y');
    integer(z, 'World z');
    if (z < -3 || z > 3) throw new Error('World z outside supported bounds');
    const normalized = normalizeWorldConfig(config);
    const cx = Math.floor(x / normalized.chunkSize),
      cy = Math.floor(y / normalized.chunkSize);
    const chunk = await this.getChunk(cx, cy, normalized, worldId);
    return this.localTile(chunk, x - cx * chunk.size, y - cy * chunk.size, z);
  }

  /** Persist a validated edit, then invalidate only this world's matching chunk variants. */
  public async editVoxel(input: VoxelEdit): Promise<void> {
    requireWorldId(input?.worldId);
    const request = structuredClone(input);
    const { worldId, chunkX, chunkY, voxelX, voxelY, voxelZ, newType, reason, metadata } = request;
    const config = normalizeWorldConfig(request.config);
    this.validateChunk(chunkX, chunkY, config);
    integer(voxelX, 'Voxel x');
    integer(voxelY, 'Voxel y');
    integer(voxelZ, 'Voxel z');
    if (
      voxelX < 0 ||
      voxelX >= config.chunkSize ||
      voxelY < 0 ||
      voxelY >= config.chunkSize ||
      voxelZ < -3 ||
      voxelZ > 3
    )
      throw new Error('Voxel coordinates outside chunk bounds');
    if (newType !== undefined && (typeof newType !== 'string' || !newType.trim()))
      throw new Error('Invalid block type');
    if (metadata !== undefined && (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)))
      throw new Error('Metadata must be an object');
    const persistedMetadata = metadata === undefined ? null : jsonValue(metadata);
    await this.serialize(worldId, chunkX, chunkY, async () => {
      const chunk = await this.load(chunkX, chunkY, config, worldId);
      const tile = this.localTile(chunk, voxelX, voxelY, voxelZ);
      const history = await this.changes(worldId, chunkX, chunkY);
      const last = history.length ? timestamp(history[history.length - 1].timestamp) : -1n;
      const now = BigInt(Date.now());
      await strapi.documents('api::voxel-change.voxel-change').create({
        data: {
          world: worldId,
          chunkX,
          chunkY,
          voxelX,
          voxelY,
          voxelZ,
          newType: newType ?? tile.block,
          previousType: tile.block,
          reason,
          timestamp: String(now > last ? now : last + 1n),
          metadata: persistedMetadata,
        },
      });
      for (const [key, entry] of this.cache) {
        if (entry.worldId === worldId && entry.x === chunkX && entry.y === chunkY) this.cache.delete(key);
      }
    });
  }
}
