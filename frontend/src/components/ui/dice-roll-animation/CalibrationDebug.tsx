import { useEffect, useState } from 'react';

import { calibrateDieRotations } from './calibrateDice';
import type { DieType } from '../dice-loader/types';

/**
 * Debug component to verify calibration is working in browser
 */
export function CalibrationDebug() {
  const [calibrations, setCalibrations] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const dieTypes: DieType[] = [2, 4, 6, 8, 10, 12, 20];
      const results: Record<string, any> = {};

      dieTypes.forEach((dieType) => {
        const rotations = calibrateDieRotations(dieType);
        results[`d${dieType}`] = rotations;
      });

      setCalibrations(results);

      // Check if calibrations are valid (not all zeros)
      const hasValidCalibrations = Object.values(results).some((rotations) =>
 
        Object.values(rotations).some((rot: any) => rot.x !== 0 || rot.y !== 0 || rot.z !== 0)
      );

      if (!hasValidCalibrations) {
        setError('⚠️ Calibration returned all zeros - canvas may not be available');
      }
    } catch (err) {
      setError(`❌ Calibration failed: ${err}`);
    }
  }, []);

  return (
    <div style={{ padding: '1rem', background: '#1e293b', borderRadius: '0.5rem', color: '#e2e8f0' }}>
      <h3 style={{ marginBottom: '1rem', color: '#38bdf8' }}>🔧 Calibration Debug</h3>

      {error && (
        <div
          style={{
            padding: '0.5rem',
            background: '#7f1d1d',
            borderRadius: '0.25rem',
            marginBottom: '1rem',
            color: '#fca5a5',
          }}
        >
          {error}
        </div>
      )}

      {!error && Object.keys(calibrations).length > 0 && (
        <div style={{ color: '#4ade80', marginBottom: '1rem' }}>✅ Calibration working!</div>
      )}

      <details>
        <summary style={{ cursor: 'pointer', color: '#94a3b8', marginBottom: '0.5rem' }}>View Calibration Data</summary>
        <pre
          style={{
            background: '#0f172a',
            padding: '0.5rem',
            borderRadius: '0.25rem',
            overflow: 'auto',
            fontSize: '0.75rem',
            maxHeight: '300px',
          }}
        >
          {JSON.stringify(calibrations, null, 2)}
        </pre>
      </details>
    </div>
  );
}
