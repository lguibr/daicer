import * as THREE from 'three';

import type { DieType } from '../dice-loader/types';
import { calibrateDieRotations } from './calibrateDice';

// Cache calibrated rotations on first use
let calibratedRotations: Record<DieType, Record<number, { x: number; y: number; z: number }>> | null = null;

function getCalibratedRotations(): Record<DieType, Record<number, { x: number; y: number; z: number }>> {
  if (!calibratedRotations) {
    const dieTypes: DieType[] = [2, 4, 6, 8, 10, 12, 20];
    calibratedRotations = {} as Record<DieType, Record<number, { x: number; y: number; z: number }>>;

    dieTypes.forEach((dieType) => {
      calibratedRotations![dieType] = calibrateDieRotations(dieType);
    });
  }

  return calibratedRotations;
}

/**
 * Get the target rotation needed to face a specific number DIRECTLY towards the camera.
 * Uses calibrated rotations calculated from actual die geometry for perfect orientation.
 */
export function getTargetRotationForFace(dieType: DieType, targetNumber: number): { x: number; y: number; z: number } {
  const calibrations = getCalibratedRotations();
  const typeRotations = calibrations[dieType];

  if (!typeRotations) {
    return { x: 0, y: 0, z: 0 };
  }

  const rotation = typeRotations[targetNumber];
  if (!rotation) {
    return { x: 0, y: 0, z: 0 };
  }

  return rotation;
}

/**
 * Validates if a rotation correctly orients a face towards the camera.
 * Camera is at (0, 0, 7.5), so faces should point toward +Z direction.
 * Returns true if the face is pointing towards the camera (positive Z direction).
 */
export function validateFaceOrientation(
  rotation: { x: number; y: number; z: number },
  threshold: number = 0.9
): boolean {
  // Create a vector pointing outward from the face (initially pointing at camera: 0, 0, 1)
  const faceNormal = new THREE.Vector3(0, 0, 1);

  // Apply the rotation
  const euler = new THREE.Euler(rotation.x, rotation.y, rotation.z, 'XYZ');
  faceNormal.applyEuler(euler);

  // Check if the normal is pointing towards the camera (positive Z)
  // A value close to +1 means it's pointing perfectly at the camera
  return faceNormal.z > threshold;
}

/**
 * Gets the camera direction vector.
 * Camera at (0, 0, 7.5) looking at origin means it looks down -Z,
 * so objects face the camera by pointing their normals toward +Z.
 */
export function getCameraDirection(): THREE.Vector3 {
  return new THREE.Vector3(0, 0, 1);
}
