/**
 * Generate calibration script to output perfect rotations for all dice
 * Run this in browser console to get accurate rotations
 */

import { generateAllCalibrations } from './calibrateDice';

export function printCalibrations() {
  console.info('=== CALIBRATED DICE ROTATIONS ===');
  console.info('Copy this into calculateTargetRotation.ts:');
  console.info('');

  const calibrations = generateAllCalibrations();

  console.info('const faceRotations: Record<number, Record<number, { x: number; y: number; z: number }>> = {');

  Object.entries(calibrations).forEach(([dieType, rotations]) => {
    console.info(`  ${dieType}: {`);
    Object.entries(rotations).forEach(([faceNum, rotation]: [string, any]) => {
      console.info(
        `    ${faceNum}: { x: ${rotation.x.toFixed(6)}, y: ${rotation.y.toFixed(6)}, z: ${rotation.z.toFixed(6)} },`
      );
    });
    console.info(`  },`);
  });

  console.info('};');
  console.info('');
  console.info('=== END CALIBRATIONS ===');

  return calibrations;
}

// Make available globally for console use
if (typeof window !== 'undefined') {
 
  (window as any).printDiceCalibrations = printCalibrations;
}
