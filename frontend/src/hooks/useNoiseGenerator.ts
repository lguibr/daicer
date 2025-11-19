/**
 * Noise Visualizer Hook
 * Manages simplex noise generation state and parameters
 */

import { useState, useCallback, useMemo } from 'react';
import { SimplexNoise } from '@daicer/shared/world-gen/noise';

export type NoiseType = 'simplex' | 'octave' | 'ridge' | 'turbulence' | 'domainWarp';

export interface NoiseParams {
  octaves: number;
  persistence: number;
  lacunarity: number;
  scale: number;
  warpStrength: number;
}

export function useNoiseGenerator(initialSeed: string = 'noise-seed') {
  const [seed, setSeed] = useState(initialSeed);
  const [noiseType, setNoiseType] = useState<NoiseType>('octave');
  const [params, setParams] = useState<NoiseParams>({
    octaves: 4,
    persistence: 0.5,
    lacunarity: 2.0,
    scale: 0.02,
    warpStrength: 0.5,
  });
  const [gridSize, setGridSize] = useState({ width: 128, height: 128 });

  const noise = useMemo(() => new SimplexNoise(seed), [seed]);

  const generateNoise = useCallback(() => {
    const { width, height } = gridSize;
    const grid: number[][] = [];

    const startTime = performance.now();

    for (let y = 0; y < height; y++) {
      const row: number[] = [];
      for (let x = 0; x < width; x++) {
        const scaledX = x * params.scale;
        const scaledY = y * params.scale;

        let value: number;
        switch (noiseType) {
          case 'simplex':
            value = noise.noise(scaledX, scaledY);
            break;
          case 'octave':
            value = noise.octaveNoise(scaledX, scaledY, params.octaves, params.persistence, params.lacunarity);
            break;
          case 'ridge':
            value = noise.ridgeNoise(scaledX, scaledY, params.octaves);
            break;
          case 'turbulence':
            value = noise.turbulence(scaledX, scaledY, params.octaves);
            break;
          case 'domainWarp':
            value = noise.domainWarpedNoise(scaledX, scaledY, params.warpStrength, params.octaves);
            break;
        }

        row.push(value);
      }
      grid.push(row);
    }

    const endTime = performance.now();
    const generationTime = endTime - startTime;

    return { grid, generationTime };
  }, [noise, noiseType, params, gridSize]);

  return {
    seed,
    setSeed,
    noiseType,
    setNoiseType,
    params,
    setParams,
    gridSize,
    setGridSize,
    generateNoise,
  };
}
