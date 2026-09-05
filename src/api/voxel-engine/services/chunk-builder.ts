/**
 * ⚠️ DOCUMENTATION MANDATE: Update JSDoc & README with ANY change.
 * Keep documentation synchronized with code at all times.
 */
import { Chunk, WorldConfig } from '@daicer/engine/types';
import { TerrainGenerator } from '@/api/voxel-engine/src/terrain-generator';
import { WorldAtlas } from '@daicer/engine/world/world-atlas';
import { CivilizationGenerator } from '@/api/voxel-engine/services/generators/civilization-generator';
import { FloraGenerator } from '@/api/voxel-engine/services/generators/flora-generator';

import { normalizeWorldConfig } from '@/api/world/utils/world-config';
import { TileHelper } from './utils/tile-helper';

export class ChunkBuilder {
  private terrainGen: TerrainGenerator;
  private civGen: CivilizationGenerator;
  private atlas: WorldAtlas;
  private config: WorldConfig;

  constructor(config: WorldConfig) {
    this.config = normalizeWorldConfig(config);
    this.atlas = new WorldAtlas(this.config);
    this.terrainGen = new TerrainGenerator(this.config, this.atlas);
    this.civGen = new CivilizationGenerator(this.config, this.atlas);
  }

  /**
   * Orchestrates the generation of a complete configured-size, seven-layer chunk.
   * Pipeline: Terrain -> Flora -> Civilization (Roads/Structures).
   *
   * @param chunkX - Chunk X coordinate.
   * @param chunkY - Chunk Y coordinate.
   * @returns The fully generated Chunk object.
   */
  public generateChunk(chunkX: number, chunkY: number): Chunk {
    const size = this.config.chunkSize;
    const worldOffsetX = chunkX * size;
    const worldOffsetY = chunkY * size;

    // 1. Terrain (+ Macro overrides from Atlas)
    const tiles = this.terrainGen.generate(chunkX, chunkY);

    // 2. Flora (Trees, Plants, Rocks)
    FloraGenerator.populateChunk(chunkX, chunkY, tiles, size, this.config.seed);

    // 3. Civilization (Roads & Structures)
    // Civilization generator clears vegetation for roads/buildings
    this.civGen.apply(chunkX, chunkY, tiles, worldOffsetX, worldOffsetY);

    // Road and structure painters may assign blocks directly. Final flags are authoritative.
    for (const plane of tiles) for (const row of plane) for (const tile of row) TileHelper.applyBlock(tile, tile.block);

    return {
      x: chunkX,
      y: chunkY,
      tiles,
      size: size,
      minZ: -3,
      maxZ: 3,
      seed: this.config.seed,
    };
  }
}
