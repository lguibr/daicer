/**
 * Geometry utilities for spatial calculations.
 */

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Calculates Euclidean distance between two 3D points.
 */
export function calculateDistance(p1: Point3D, p2: Point3D): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2) + Math.pow(p2.z - p1.z, 2));
}

/**
 * Checks if a point is within a circular area (Cylinder/Sphere logic simplified).
 */
export function isPointInRadius(origin: Point3D, point: Point3D, radius: number): boolean {
  return calculateDistance(origin, point) <= radius;
}

/**
 * Checks if a point is within a Cone.
 * Simplified 2D check on X/Y plane for MVP, ignoring Z angle for now.
 * @param origin - Tip of the cone.
 * @param direction - Target point defining the center line of the cone.
 * @param point - The point to check.
 * @param range - Length of the cone.
 * @param angleDegrees - Width of the cone (e.g., 53.13 for 5e cones approx, or 90).
 */
export function isPointInCone(
  origin: Point3D,
  direction: Point3D,
  point: Point3D,
  range: number,
  angleDegrees: number = 53.13 // Standard 5e token cone is roughly this or 90
): boolean {
  // 1. Distance Check
  const dist = calculateDistance(origin, point);
  if (dist > range) return false;

  // 2. Angle Check (2D X/Y)
  const dirVector = { x: direction.x - origin.x, y: direction.y - origin.y };
  const targetVector = { x: point.x - origin.x, y: point.y - origin.y };

  const dot = dirVector.x * targetVector.x + dirVector.y * targetVector.y;
  const det = dirVector.x * targetVector.y - dirVector.y * targetVector.x; // Crossproduct Z

  const angleRad = Math.atan2(det, dot);
  const angleDeg = Math.abs(angleRad * (180 / Math.PI));

  return angleDeg <= angleDegrees / 2;
}
