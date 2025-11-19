/**
 * Generate calibration script to output perfect rotations for all dice
 * Run this in browser console to get accurate rotations
 */

import { generateAllCalibrations } from './calibrateDice';

export function printCalibrations() {
  console.log('=== CALIBRATED DICE ROTATIONS ===');
  console.log('Copy this into calculateTargetRotation.ts:');
  console.log('');

  const calibrations = generateAllCalibrations();

  console.log('const faceRotations: Record<number, Record<number, { x: number; y: number; z: number }>> = {');

  Object.entries(calibrations).forEach(([dieType, rotations]) => {
    console.log(`  ${dieType}: {`);
    Object.entries(rotations).forEach(([faceNum, rotation]: [string, any]) => {
      console.log(
        `    ${faceNum}: { x: ${rotation.x.toFixed(6)}, y: ${rotation.y.toFixed(6)}, z: ${rotation.z.toFixed(6)} },`
      );
    });
    console.log(`  },`);
  });

  console.log('};');
  console.log('');
  console.log('=== END CALIBRATIONS ===');

  return calibrations;
}

// Make available globally for console use
if (typeof window !== 'undefined') {
  (window as any).printDiceCalibrations = printCalibrations;
}
