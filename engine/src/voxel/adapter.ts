import { WorldGenerator } from './procgen';
import { WorldConfig, Chunk } from './types';

export const DEFAULT_GENERATION_PARAMS: WorldConfig = {
  seed: 'default-seed',
  chunkSize: 16,
  globalScale: 0.01,
  seaLevel: 0,
  elevationScale: 1,
  roughness: 0.5,
  detail: 4,
  moistureScale: 1,
  temperatureOffset: 0,
  structureChance: 0.1,
  structureSpacing: 10,
  structureSizeAvg: 10,
  roadDensity: 0.5,
  fogRadius: 10,
};

export function createUnifiedTerrainGenerator(seed: string, params: WorldConfig) {
  const config = { ...params, seed };
  const worldGen = new WorldGenerator(config);

  return (x: number, y: number, _size?: number): Chunk => {
    // Note: size arg is ignored as WorldGenerator uses config.chunkSize
    return worldGen.getChunk(x, y);
  };
}
