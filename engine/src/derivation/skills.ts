import { calculateModifier, Attributes, AbilityScore } from './attributes';

export const SKILL_ABILITY_MAP: Record<string, AbilityScore> = {
  acrobatics: 'dex',
  animal_handling: 'wis',
  arcana: 'int',
  athletics: 'str',
  deception: 'cha',
  history: 'int',
  insight: 'wis',
  intimidation: 'cha',
  investigation: 'int',
  medicine: 'wis',
  nature: 'int',
  perception: 'wis',
  performance: 'cha',
  persuasion: 'cha',
  religion: 'int',
  sleight_of_hand: 'dex',
  stealth: 'dex',
  survival: 'wis',
};

/**
 * Calculates the total bonus for a skill.
 *
 * Formula: Attribute Mod + (Proficiency Bonus * Multiplier)
 * Multiplier: 0 (None), 1 (Proficient), 2 (Expertise), 0.5 (Jack of All Trades - future)
 *
 * @param skillSlug - standard slug (e.g. 'perception')
 * @param proficiencyMultiplier - 0, 1, or 2
 * @param attributes - Character attributes
 * @param proficiencyBonus - Character's PB
 */
export function calculateSkillBonus(
  skillSlug: string,
  proficiencyMultiplier: number,
  attributes: Attributes,
  proficiencyBonus: number
): number {
  // Normalize slug
  const normalizedSlug = skillSlug.toLowerCase().replace(/-/g, '_');
  const ability = SKILL_ABILITY_MAP[normalizedSlug];

  if (!ability) {
    // Fallback or error? defaulting to 0 mod if unknown.
    return 0 + Math.floor(proficiencyBonus * proficiencyMultiplier);
  }

  const mod = calculateModifier(attributes[ability]);
  const profBonus = Math.floor(proficiencyBonus * proficiencyMultiplier);

  return mod + profBonus;
}
