import { calculateModifier } from './attributes';
import { calculateAC, calculateHP } from './defenses';
import { deriveSpeed } from './capabilities';
import { calculateSkillBonus } from './skills';
import { DerivationContext } from './types';

export * from './attributes';
export * from './defenses';
export * from './capabilities';
export * from './skills';
export * from './types';

export class EntityDeriver {
  static calculateModifier = calculateModifier;

  /**
   * Derives all dependent stats from the context.
   */
  static derive(context: DerivationContext) {
    const ac = calculateAC(context);
    const hp = calculateHP(context);
    const speed = deriveSpeed(context);

    // We can also derive passive perception, etc.
    const passivePerception =
      10 +
      calculateSkillBonus(
        'perception',
        // Need to know if proficient. For now assuming 0 if not passed in context.
        // Ideally context should have 'skills' map.
        0,
        context.attributes,
        context.proficiencyBonus
      );

    return {
      ac,
      hp,
      maxHp: hp,
      speed,
      passivePerception,
    };
  }

  // TODO: Implement 'create' and 'levelUp' workflows as higher level abstractions
  // if they involve more than just stat calculation (e.g. choice validation).
}
