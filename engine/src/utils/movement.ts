import { Speed } from '@daicer/shared';

export interface SpeedCapabilities {
  walk: number;
  fly?: number;
  swim?: number;
  climb?: number;
  burrow?: number;
  hover?: boolean;
}

/**
 * Normalizes a Speed value (number or object) into a fully explicit Speed capabilities object.
 * @param speed - The raw speed value (number | object)
 * @returns Normalized object with walk, fly, swim, etc.
 */
export const getMovementModes = (speed: Speed | undefined | null): SpeedCapabilities => {
  if (speed === undefined || speed === null) {
    return { walk: 0 };
  }

  if (typeof speed === 'number') {
    return { walk: speed };
  }

  return {
    walk: speed.walk ?? 0,
    fly: speed.fly,
    swim: speed.swim,
    climb: speed.climb,
    burrow: speed.burrow,
    hover: speed.hover,
  };
};

/**
 * Checks if an entity has a specific movement capability.
 */
export const canMove = (speed: Speed | undefined | null, mode: keyof SpeedCapabilities): boolean => {
  const modes = getMovementModes(speed);

  if (mode === 'walk') return (modes.walk ?? 0) > 0;

  const val = modes[mode];
  if (typeof val === 'boolean') return val;
  return (val ?? 0) > 0;
};
