import type { GridTile } from '@daicer/shared';

export {};

declare global {
  interface Window {
    __TERRAIN_GRID__: GridTile[][] | (GridTile | null)[][];
  }
}
