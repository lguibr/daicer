import { Chunk, WorldConfig } from '@daicer/engine';
import { ChunkManager } from './chunk-manager';

export class WorldGenerator {
  private config: WorldConfig;

  constructor(config: WorldConfig) {
    this.config = config;
  }

  public async getChunk(chunkX: number, chunkY: number): Promise<Chunk> {
    return ChunkManager.getInstance().getChunk(chunkX, chunkY, this.config);
  }
}
