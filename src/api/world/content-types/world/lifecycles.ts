import { normalizeWorldConfig, requireWorldId } from '@/api/world/utils/world-config';

export default {
  /** Optional cache warming uses the same world configuration as gameplay. No numeric-id fallback. */
  async afterCreate(event) {
    const { result } = event;
    try {
      requireWorldId(result.documentId);
      const config = normalizeWorldConfig(result);
      const radius = result.startingRadius ?? 4;
      if (!Number.isInteger(radius) || radius < 0 || radius > 16)
        throw new Error('Starting radius must be an integer between 0 and 16');
      const voxelService = strapi.service('api::voxel-engine.voxel-engine');
      for (let y = radius === 0 ? 0 : -radius; y <= radius; y++) {
        for (let x = radius === 0 ? 0 : -radius; x <= radius; x++) {
          await voxelService.getChunk(x, y, config, result.documentId);
        }
      }
      strapi.log.info('[World] Starting area cache warmed');
    } catch (error) {
      // Warming is optional. Invalid context or failed overlays must never become cached base terrain.
      strapi.log.error('[World] Starting area cache warming failed', error);
    }
  },
};
