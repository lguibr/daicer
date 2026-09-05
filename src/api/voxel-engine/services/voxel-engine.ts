/** World-aware terrain service. See ../README.md for caller migration and preview semantics. */
import type { WorldConfig } from '@daicer/engine/types';
import { ChunkManager, type VoxelEdit } from './chunk-manager';

export default () => ({
  /** The application resolves and authorizes worldId before this call. */
  getChunk(x: number, y: number, config: WorldConfig, worldId: string) {
    return ChunkManager.getInstance().getChunk(x, y, config, worldId);
  },
  /** Editor-only pure generation; never overlays gameplay persistence. */
  getPreviewChunk(x: number, y: number, config: WorldConfig) {
    return ChunkManager.getInstance().getPreviewChunk(x, y, config);
  },
  getTileAt(x: number, y: number, z: number, config: WorldConfig, worldId: string) {
    return ChunkManager.getInstance().getTileAt(x, y, z, config, worldId);
  },
  editVoxel(request: VoxelEdit) {
    return ChunkManager.getInstance().editVoxel(request);
  },
});
