/**
 * Common position and grid types
 */

export interface Position {
  x: number;
  y: number;
}

export interface Position3D extends Position {
  z: number;
}

export type Grid<T> = T[][];

export type Seed = string | number;
