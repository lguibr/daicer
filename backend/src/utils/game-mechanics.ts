/**
 * D20 game mechanics and calculations
 */

/**
 * Calculate attribute modifier from score
 * @param score - Attribute score (1-30)
 * @returns Modifier value
 */
export function getModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Roll a d20 dice
 * @returns Random number 1-20
 */
export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

/**
 * Roll any dice
 * @param sides - Number of sides
 * @returns Random number 1-sides
 */
export function rollDice(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Parse and roll dice notation (e.g., "2d6+3")
 * @param notation - Dice notation string
 * @returns Total roll result
 */
export function parseDiceRoll(notation: string): number {
  const match = notation.match(/(\d+)d(\d+)(?:([+-])(\d+))?/);

  if (!match) {
    throw new Error(`Invalid dice notation: ${notation}`);
  }

  const count = parseInt(match[1]!, 10);
  const sides = parseInt(match[2]!, 10);
  const operator = match[3];
  const modifier = match[4] ? parseInt(match[4], 10) : 0;

  let total = 0;
  for (let i = 0; i < count; i += 1) {
    total += rollDice(sides);
  }

  if (operator === '+') {
    total += modifier;
  } else if (operator === '-') {
    total -= modifier;
  }

  return total;
}

/**
 * Calculate attack roll
 * @param attackBonus - Base attack bonus
 * @param modifier - Attribute modifier
 * @returns Roll result and total
 */
export function rollAttack(attackBonus: number, modifier: number): { roll: number; total: number } {
  const roll = rollD20();
  return {
    roll,
    total: roll + attackBonus + modifier,
  };
}

/**
 * Calculate skill check
 * @param modifier - Skill modifier
 * @returns Roll result and total
 */
export function rollSkillCheck(modifier: number): { roll: number; total: number } {
  const roll = rollD20();
  return {
    roll,
    total: roll + modifier,
  };
}
