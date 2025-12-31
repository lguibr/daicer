import { EntityAction, EntityStats } from '@daicer/engine';

interface Weapon {
  name: string;
  damageDice: string; // "1d8"
  damageType: string; // "slashing"
  properties: string[]; // ["Finesse", "Light"]
  range?: string; // "20/60"
}

interface GenerateWeaponActionInput {
  weapon: Weapon;
  stats: EntityStats;
  proficiencyBonus: number;
  isProficient: boolean;
}

export function generateWeaponAction(input: GenerateWeaponActionInput): EntityAction {
  const { weapon, stats, proficiencyBonus, isProficient } = input;

  // 1. Determine Modifier (Str vs Dex)
  const isFinesse = weapon.properties.includes('Finesse') || weapon.properties.includes('finesse');
  const isRanged =
    weapon.properties.includes('Ranged') ||
    weapon.properties.includes('ranged') ||
    (weapon.range && !weapon.range.includes('5'));

  // Default: Melee uses Str, Ranged uses Dex. Finesse can use either.
  let modScore = stats.strength;

  if (isRanged) {
    modScore = stats.dexterity;
  } else if (isFinesse) {
    modScore = Math.max(stats.strength, stats.dexterity);
  }

  const modBonus = Math.floor((modScore - 10) / 2);

  // 2. Calculate To Hit
  const toHit = modBonus + (isProficient ? proficiencyBonus : 0);

  // 3. Calculate Damage
  // We assume single damage type for clean generator

  return {
    name: weapon.name,
    type: isRanged ? 'ranged' : 'melee',
    toHit: toHit,
    range: weapon.range || '5',
    damage: [{ dice: weapon.damageDice, bonus: modBonus, type: weapon.damageType }],
    description: `Attack with ${weapon.name}. ${isProficient ? 'Proficient' : 'Not Proficient'}.`,
  };
}

export const ActionGenerator = {
  generateWeaponAction,
};
