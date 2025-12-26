import { Chunk, WorldConfig } from '@daicer/engine';
import { TerrainGenerator } from '@daicer/engine';
import { CivilizationGenerator } from './generators/civilization-generator';

export class ChunkBuilder {
  private config: WorldConfig;
  private terrainGen: TerrainGenerator;
  private civGen: CivilizationGenerator;

  constructor(config: WorldConfig) {
    this.config = config;
    this.terrainGen = new TerrainGenerator(config);
    this.civGen = new CivilizationGenerator(config);
  }

  public generateChunk(chunkX: number, chunkY: number): Chunk {
    const size = this.config.chunkSize;
    const worldOffsetX = chunkX * size;
    const worldOffsetY = chunkY * size;

    // 1. Terrain
    const tiles = this.terrainGen.generate(chunkX, chunkY);

    // 2. Civilization (Roads & Structures)
    this.civGen.apply(chunkX, chunkY, tiles, worldOffsetX, worldOffsetY);

    return { x: chunkX, y: chunkY, tiles };
  }
}
