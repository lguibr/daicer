import { DerivationContext } from './types';

/**
 * Derives movement speeds.
 *
 * Logic:
 * - Base speed from Race
 * - Modifiers can be added (e.g. Monk Unarmored Movement, Mobile feat) - Placeholder for now.
 * - Heavy Armor penalty (if str < str_minimum)
 */
export function deriveSpeed(context: DerivationContext): { walk: number; [key: string]: number } {
  const { race, attributes, equipment } = context;

  let baseSpeed: { walk: number; [key: string]: number } = { walk: 30 };

  if (race?.speed) {
    if (typeof race.speed === 'number') {
      baseSpeed = { walk: race.speed };
    } else {
      // Assuming race.speed object already uses new keys? Or do we need to map?
      // Race schema is "integer" currently (Step 375). So it hits the 'number' block.
      // If race had object speed, it would need to match SpeedSchema.
      // But let's assume it maps directly if object.
      baseSpeed = { ...race.speed } as { walk: number; [key: string]: number };
    }
  }

  // Heavy Armor Penalty
  const armor = equipment.find((item) => item.equipment_category?.slug === 'heavy-armor');

  if (armor && armor.str_minimum && attributes.str < armor.str_minimum) {
    baseSpeed.walk = Math.max(0, baseSpeed.walk - 10);
  }

  return baseSpeed;
}
