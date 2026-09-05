/** A world-bound adapter for voxel physics; pure previews use the explicit preview service. */
import type { WorldConfig } from '@daicer/engine/types';
import { ChunkManager } from './chunk-manager';
import { normalizeWorldConfig, requireWorldId } from '@/api/world/utils/world-config';

export class WorldGenerator {
  private readonly config: WorldConfig;
  constructor(
    config: WorldConfig,
    private readonly worldId: string
  ) {
    requireWorldId(worldId);
    this.config = normalizeWorldConfig(config);
  }
  get chunkSize(): number {
    return this.config.chunkSize;
  }
  getChunk(x: number, y: number) {
    return ChunkManager.getInstance().getChunk(x, y, this.config, this.worldId);
  }
}
