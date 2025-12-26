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
      baseSpeed = { ...race.speed };
    }
  }

  // Heavy Armor Penalty
  // If wearing heavy armor and Str < Str Minimum, reduce speed by 10.
  const armor = equipment.find((item) => item.equipment_category?.slug === 'heavy-armor');

  if (armor && armor.str_minimum && attributes.str < armor.str_minimum) {
    baseSpeed.walk = Math.max(0, baseSpeed.walk - 10);
  }

  return baseSpeed;
}
