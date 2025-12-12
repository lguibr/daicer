/**
 * Voronoi and Poisson Disc Sampling Types
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export interface VoronoiRegion {
  seed: Point2D;
  cells: Point2D[];
}
