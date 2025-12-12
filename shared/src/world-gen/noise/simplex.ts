/**
 * Simplex Noise Generator
 * Provides type-safe, high-performance noise generation for world generation
 * Framework-agnostic implementation with optional debug callbacks
 */

import { makeNoise2D, makeNoise3D, makeNoise4D } from 'fast-simplex-noise';
import { Alea } from './alea';

export interface SimplexNoiseOptions {
  /** Optional callback for debug messages */
  onDebug?: (message: string) => void;
}

/**
 * SimplexNoise wrapper using fast-simplex-noise
 * Returns values in range [-1, 1]
 */
export class SimplexNoise {
  private noise2D: ReturnType<typeof makeNoise2D>;

  private noise3D: ReturnType<typeof makeNoise3D>;

  private noise4D: ReturnType<typeof makeNoise4D>;

  private rng: () => number;

  private options?: SimplexNoiseOptions;

  constructor(seed: string | number = 0, options?: SimplexNoiseOptions) {
    this.rng = Alea(seed);
    this.options = options;

    // Initialize noise generators with seeded random function
    this.noise2D = makeNoise2D(this.rng);
    this.noise3D = makeNoise3D(this.rng);
    this.noise4D = makeNoise4D(this.rng);

    this.options?.onDebug?.(`SimplexNoise initialized with seed: ${seed}`);
  }

  /**
   * 2D noise
   */
  noise(x: number, y: number): number {
    return this.noise2D(x, y);
  }

  /**
   * 3D noise
   */
  noise3(x: number, y: number, z: number): number {
    return this.noise3D(x, y, z);
  }

  /**
   * 4D noise
   */
  noise4(x: number, y: number, z: number, w: number): number {
    return this.noise4D(x, y, z, w);
  }

  /**
   * Octave noise - combines multiple noise layers (Fractal Brownian Motion)
   */
  octaveNoise(x: number, y: number, octaves: number = 4, persistence: number = 0.5, lacunarity: number = 2.0): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i += 1) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  /**
   * 3D octave noise - for volumetric generation
   */
  octaveNoise3(
    x: number,
    y: number,
    z: number,
    octaves: number = 4,
    persistence: number = 0.5,
    lacunarity: number = 2.0
  ): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i += 1) {
      total += this.noise3D(x * frequency, y * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  /**
   * Domain warping - feed noise output back into input for organic distortion
   */
  domainWarpedNoise(x: number, y: number, warpStrength: number = 0.5, octaves: number = 4): number {
    const warpX = this.octaveNoise(x, y, octaves) * warpStrength;
    const warpY = this.octaveNoise(x + 100, y + 100, octaves) * warpStrength;

    return this.octaveNoise(x + warpX, y + warpY, octaves);
  }

  /**
   * Ridge noise - absolute value creates mountain ridges
   */
  ridgeNoise(x: number, y: number, octaves: number = 4): number {
    return 1 - Math.abs(this.octaveNoise(x, y, octaves));
  }

  /**
   * Turbulence - sum of absolute octaves
   */
  turbulence(x: number, y: number, octaves: number = 4): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i += 1) {
      total += Math.abs(this.noise2D(x * frequency, y * frequency)) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2.0;
    }

    return total / maxValue;
  }
}

/**
 * Type alias for WorldNoise (SimplexNoise with extended features)
 */
export type WorldNoise = SimplexNoise;

/**
 * Factory function to create WorldNoise instance
 * @param seed - Random seed for deterministic generation
 * @param options - Optional configuration
 * @returns WorldNoise instance
 */
export function createWorldNoise(seed: string | number, options?: SimplexNoiseOptions): WorldNoise {
  return new SimplexNoise(seed, options);
}
