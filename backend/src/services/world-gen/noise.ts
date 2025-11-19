/**
 * Noise generation wrapper using fast-simplex-noise
 * Provides type-safe, high-performance noise generation for world generation
 */

import { makeNoise2D, makeNoise3D, makeNoise4D } from 'fast-simplex-noise';

/**
 * Alea PRNG (Pseudo-Random Number Generator)
 * Based on Johannes Baagøe's algorithm
 * Provides deterministic random numbers from a seed
 */
export function Alea(...args: (string | number)[]): () => number {
  let s0 = 0;
  let s1 = 0;
  let s2 = 0;
  let c = 1;

  const mash = (): ((data: string | number) => number) => {
    let n = 0xefc8249d;
    return (data: string | number) => {
      const str = String(data);
      for (let i = 0; i < str.length; i += 1) {
        n += str.charCodeAt(i);
        // eslint-disable-next-line no-bitwise
        let h = 0.02519603282416938 * n;
        // eslint-disable-next-line no-bitwise
        n = h >>> 0;
        h -= n;
        h *= n;
        // eslint-disable-next-line no-bitwise
        n = h >>> 0;
        h -= n;
        n += h * 0x100000000;
      }
      // eslint-disable-next-line no-bitwise
      return (n >>> 0) * 2.3283064365386963e-10;
    };
  };

  const masher = mash();
  s0 = masher(' ');
  s1 = masher(' ');
  s2 = masher(' ');

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] !== undefined) {
      s0 -= masher(args[i] as string | number);
      if (s0 < 0) s0 += 1;
      s1 -= masher(args[i] as string | number);
      if (s1 < 0) s1 += 1;
      s2 -= masher(args[i] as string | number);
      if (s2 < 0) s2 += 1;
    }
  }

  return () => {
    const t = 2091639 * s0 + c * 2.3283064365386963e-10;
    s0 = s1;
    s1 = s2;
    // eslint-disable-next-line no-bitwise
    c = t | 0;
    s2 = t - c;
    return s2;
  };
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

  constructor(seed: string | number = 0) {
    this.rng = Alea(seed);

    // Initialize noise generators with seeded random function
    this.noise2D = makeNoise2D(this.rng);
    this.noise3D = makeNoise3D(this.rng);
    this.noise4D = makeNoise4D(this.rng);
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
 * @returns WorldNoise instance
 */
export function createWorldNoise(seed: string | number): WorldNoise {
  return new SimplexNoise(seed);
}
