/**
 * Dice Engine for Deterministic Resolution.
 */

export interface DiceRollDefinition {
  count: number;
  sides: number;
  bonus: number;
  type?: string; // "slashing", "fire", etc.
}

export interface DiceResult {
  total: number;
  rolls: number[];
  bonus: number;
  definition: DiceRollDefinition;
  isCritical?: boolean; // For d20
  isCriticalFail?: boolean; // For d20
}

/**
 * Parses a dice string like "2d6 + 4" or "1d20".
 */
export function parseDiceString(str: string): DiceRollDefinition {
  const clean = str.replace(/\s/g, '').toLowerCase();
  const split = clean.split('+');
  const dicePart = split[0] ?? '';
  const bonusPart = split[1];
  const parts = dicePart.split('d');
  const countStr = parts[0] ?? '1';
  const sidesStr = parts[1] ?? '0';

  const count = parseInt(countStr, 10);
  const sides = parseInt(sidesStr, 10);
  const bonus = bonusPart ? parseInt(bonusPart, 10) : 0;

  if (isNaN(count) || isNaN(sides)) {
    throw new Error(`Invalid dice string: ${str}`);
  }

  return { count, sides, bonus };
}

/**
 * Rolls dice based on a definition.
 * @param def Dice definition
 * @param rng Optional random number generator (returns 0-1). Defaults to Math.random.
 */
export function roll(def: DiceRollDefinition, rng?: () => number): DiceResult {
  let total = 0;
  const rolls: number[] = [];
  const generator = rng || Math.random;

  for (let i = 0; i < def.count; i++) {
    const r = Math.floor(generator() * def.sides) + 1;
    rolls.push(r);
    total += r;
  }

  total += def.bonus;

  return {
    total,
    rolls,
    bonus: def.bonus,
    definition: def,
    isCritical: def.sides === 20 && rolls[0] === 20,
    isCriticalFail: def.sides === 20 && rolls[0] === 1,
  };
}

/**
 * Legacy/Simple helper
 */
export function rollDie(sides: number, count: number = 1): number {
  return roll({ sides, count, bonus: 0 }).total;
}

export function d20(): number {
  return rollDie(20);
}
