import * as THREE from 'three';

import { createDie } from '../dice-loader/createDie';
import type { DieType } from '../dice-loader/types';

/**
 * Extract face normal vectors from a die by analyzing the number planes attached to each face
 */
export function extractFaceNormalsFromDie(dieType: DieType): Map<number, THREE.Vector3> {
  let die: THREE.Group;

  try {
    die = createDie(dieType, '#ffffff');
  } catch (err) {
    console.warn('Failed to save calibration:', err); // In test environment or when canvas is unavailable, return empty map
    return new Map();
  }

  const faceNormals = new Map<number, THREE.Vector3>();

  // Face number mapping (from createDie.ts)
  const FACE_NUMBER_MAP: Partial<Record<DieType, (number | string)[]>> = {
    2: [1, 2],
    4: [1, 2, 3, 4],
    6: [1, 6, 2, 5, 3, 4],
    8: [1, 3, 8, 6, 2, 4, 7, 5],
    10: [0, 2, 8, 6, 4, 9, 7, 1, 3, 5],
    12: [12, 2, 8, 5, 10, 4, 11, 9, 6, 3, 7, 1],
    20: [20, 2, 14, 10, 8, 1, 17, 11, 5, 9, 19, 15, 3, 7, 13, 18, 12, 6, 16, 4],
  };

  const faceNumbers = FACE_NUMBER_MAP[dieType] || [];
  let planeIndex = 0;

  // Traverse to find number planes
  die.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry instanceof THREE.PlaneGeometry) {
      if (planeIndex < faceNumbers.length) {
        // Get the plane's world position and die center
        const planeWorldPos = new THREE.Vector3();
        child.getWorldPosition(planeWorldPos);

        // Normal points from die center (0,0,0) TO plane position (outward)
        const outwardNormal = planeWorldPos.clone().normalize();

        const faceNumber = faceNumbers[planeIndex];
        if (faceNumber !== undefined) {
          faceNormals.set(Number(faceNumber), outwardNormal);
        }
        planeIndex++;
      }
    }
  });

  return faceNormals;
}

/**
 * Calculate the rotation needed to point a given normal vector at the camera
 * Camera is at (0, 0, 7.5) looking at origin, so faces should point toward +Z
 */
export function calculateRotationFromNormal(normal: THREE.Vector3): THREE.Euler {
  // Target direction: face should point TOWARD camera at +Z
  const targetDirection = new THREE.Vector3(0, 0, 1);

  // Create quaternion that rotates from normal to target
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(normal.normalize(), targetDirection);

  // Convert to Euler angles
  const euler = new THREE.Euler();
  euler.setFromQuaternion(quaternion, 'XYZ');

  return euler;
}

/**
 * Calibrate all face rotations for a die type by extracting normals and calculating rotations
 */
export function calibrateDieRotations(dieType: DieType): Record<number, { x: number; y: number; z: number }> {
  const faceNormals = extractFaceNormalsFromDie(dieType);
  const rotations: Record<number, { x: number; y: number; z: number }> = {};

  faceNormals.forEach((normal, faceNumber) => {
    const euler = calculateRotationFromNormal(normal);
    rotations[faceNumber] = {
      x: euler.x,
      y: euler.y,
      z: euler.z,
    };
  });

  return rotations;
}

/**
 * Generate calibrated rotations for ALL die types
 */
export function generateAllCalibrations(): Record<DieType, Record<number, { x: number; y: number; z: number }>> {
  const allDieTypes: DieType[] = [2, 4, 6, 8, 10, 12, 20];

  const calibrations: any = {};

  allDieTypes.forEach((dieType) => {
    calibrations[dieType] = calibrateDieRotations(dieType);
  });

  return calibrations;
}
