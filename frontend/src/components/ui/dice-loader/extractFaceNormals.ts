import * as THREE from 'three';

import { createDie } from './createDie';
import type { DieType } from './types';

export interface FaceNormalData {
  faceNumber: number | string;
  normal: THREE.Vector3;
  center: THREE.Vector3;
}

/**
 * Extracts face normals from a die geometry by analyzing the number planes
 * attached to each face. Returns a map of face numbers to their normal vectors.
 */
export function extractFaceNormals(dieType: DieType): Map<number | string, FaceNormalData> {
  const die = createDie(dieType, '#ffffff');
  const faceMap = new Map<number | string, FaceNormalData>();

  // Traverse the die group to find number planes
  die.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry instanceof THREE.PlaneGeometry) {
      // This is a number plane - extract its data
      const material = child.material as THREE.MeshBasicMaterial;

      // Get the texture which contains the face number
      if (material.map) {
        // The plane's position relative to the die is its center
        const worldPosition = new THREE.Vector3();
        child.getWorldPosition(worldPosition);

        // The plane's normal direction (it faces outward)
        const localNormal = new THREE.Vector3(0, 0, 1); // Plane default normal
        const worldNormal = localNormal.clone().applyQuaternion(child.quaternion);

        // Try to determine which number this is by checking the texture
        // For now, we'll use the traversal order which matches FACE_NUMBER_MAP
        const faceData: FaceNormalData = {
          faceNumber: 0, // Will be set by caller based on order
          normal: worldNormal.normalize(),
          center: worldPosition,
        };

        // Store with a temporary key - will be remapped by the caller
        faceMap.set(faceMap.size, faceData);
      }
    }
  });

  return faceMap;
}

/**
 * Gets the face normal map with proper face numbers for a die type.
 * This uses the known FACE_NUMBER_MAP ordering to assign correct numbers.
 */
export function getFaceNormalMap(dieType: DieType): Map<number | string, THREE.Vector3> {
  const FACE_NUMBER_MAP: Record<DieType, (number | string)[]> = {
    2: [1, 2],
    4: [1, 2, 3, 4],
    6: [1, 6, 2, 5, 3, 4],
    8: [1, 3, 8, 6, 2, 4, 7, 5],
    10: [0, 2, 8, 6, 4, 9, 7, 1, 3, 5],
    12: [12, 2, 8, 5, 10, 4, 11, 9, 6, 3, 7, 1],
    20: [20, 2, 14, 10, 8, 1, 17, 11, 5, 9, 19, 15, 3, 7, 13, 18, 12, 6, 16, 4],
    '20-ai': [20, 2, 14, 10, 8, 1, 17, 11, 5, 9, 19, 15, 3, 7, 13, 18, 12, 6, 16, 4],
  };

  const rawData = extractFaceNormals(dieType);
  const faceNumbers = FACE_NUMBER_MAP[dieType] || [];
  const normalMap = new Map<number | string, THREE.Vector3>();

  // Map the extracted normals to their correct face numbers
  Array.from(rawData.values()).forEach((data, index) => {
    const faceNumber = faceNumbers[index];
    if (faceNumber !== undefined) {
      normalMap.set(faceNumber, data.normal.clone());
    }
  });

  return normalMap;
}

/**
 * Calculates the rotation needed to align a face normal with the camera direction.
 * Camera looks down -Z axis, so target normal should be (0, 0, -1).
 */
export function calculateRotationToFaceCamera(
  normal: THREE.Vector3,
  targetDirection: THREE.Vector3 = new THREE.Vector3(0, 0, -1)
): THREE.Euler {
  // Create a quaternion that rotates from the face normal to the target direction
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(normal.clone().normalize(), targetDirection.clone().normalize());

  // Convert to Euler angles
  const euler = new THREE.Euler();
  euler.setFromQuaternion(quaternion, 'XYZ');

  return euler;
}
