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
  const [dicePart, bonusPart] = clean.split('+');
  const [countStr, sidesStr] = dicePart.split('d');

  const count = countStr ? parseInt(countStr, 10) : 1;
  const sides = parseInt(sidesStr, 10);
  const bonus = bonusPart ? parseInt(bonusPart, 10) : 0;

  if (isNaN(count) || isNaN(sides)) {
    throw new Error(`Invalid dice string: ${str}`);
  }

  return { count, sides, bonus };
}

/**
 * Rolls dice based on a definition.
 */
export function roll(def: DiceRollDefinition): DiceResult {
  let total = 0;
  const rolls: number[] = [];

  for (let i = 0; i < def.count; i++) {
    const r = Math.floor(Math.random() * def.sides) + 1;
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
