import type { Tile } from '@daicer/engine';

export {};

declare global {
  interface Window {
    __TERRAIN_GRID__: Tile[][] | (Tile | null)[][];
  }
}
