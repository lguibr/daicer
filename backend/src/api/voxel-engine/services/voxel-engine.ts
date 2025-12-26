import { WorldGenerator } from './world-generator-logic';
import { WorldConfig } from './utils/types';

export default () => ({
  async getChunk(x: number, y: number, config: WorldConfig) {
    const generator = new WorldGenerator(config);
    return generator.getChunk(x, y);
  },
});
