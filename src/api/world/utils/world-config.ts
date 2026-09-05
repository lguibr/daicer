import { createHash } from 'crypto';
import type { WorldConfig } from '@daicer/engine/types';

/** Defaults match the persisted World schema; never infer dimensions from a room. */
const DEFAULTS: WorldConfig = {
  seed: 'default',
  chunkSize: 32,
  detail: 4,
  fogRadius: 10,
  globalScale: 0.02,
  seaLevel: 0,
  elevationScale: 0.5,
  roughness: 0.5,
  moistureScale: 0.015,
  temperatureOffset: 0,
  roadDensity: 0.1,
  structureChance: 0.1,
  structureSpacing: 3,
  structureSizeAvg: 10,
};

/** Select only generation fields in stable order and preserve explicit zero values. */
export function normalizeWorldConfig(source: Partial<WorldConfig>): WorldConfig {
  if (!source || typeof source !== 'object') throw new Error('World configuration is required');
  const config = Object.fromEntries(
    Object.entries(DEFAULTS).map(([key, fallback]) => [key, source[key as keyof WorldConfig] ?? fallback])
  ) as WorldConfig;
  if (typeof config.seed !== 'string' || !config.seed.trim()) throw new Error('World seed must be a nonempty string');
  for (const [key, value] of Object.entries(config)) {
    if (key !== 'seed' && (typeof value !== 'number' || !Number.isFinite(value)))
      throw new Error(`World ${key} must be finite`);
  }
  if (!Number.isInteger(config.chunkSize) || config.chunkSize < 1 || config.chunkSize > 64)
    throw new Error('World chunkSize must be an integer between 1 and 64');
  if (config.detail < 0 || config.detail > 16) throw new Error('World detail must be between 0 and 16');
  for (const key of [
    'globalScale',
    'elevationScale',
    'moistureScale',
    'structureSpacing',
    'structureSizeAvg',
    'fogRadius',
  ] as const)
    if (config[key] < 0) throw new Error(`World ${key} must be nonnegative`);
  for (const key of ['roughness', 'roadDensity', 'structureChance'] as const)
    if (config[key] < 0 || config[key] > 1) throw new Error(`World ${key} must be between 0 and 1`);
  return config;
}

/** Includes every normalized configuration field, excluding unrelated document data. */
export function worldConfigHash(config: WorldConfig): string {
  return createHash('sha256')
    .update(JSON.stringify(normalizeWorldConfig(config)))
    .digest('hex');
}

/** Room ids, join codes and numeric database ids must be resolved by the application. */
export function requireWorldId(worldId: string): void {
  if (typeof worldId !== 'string' || !worldId.trim()) throw new Error('World documentId is required');
}
