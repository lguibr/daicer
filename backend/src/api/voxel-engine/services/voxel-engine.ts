import { WorldGenerator } from './world-generator-logic';
import { WorldConfig } from '@daicer/engine';

export default ({ strapi }) => ({
  async getChunk(x: number, y: number, config: WorldConfig) {
    const generator = new WorldGenerator(config);
    return generator.getChunk(x, y);
  },
});
