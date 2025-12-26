/**
 * Dice rolling utilities.
 * Future home for complex dice parsing (e.g. "2d6 + 4").
 */

/**
 * Simulates a dice roll.
 * @param sides Number of sides on the die.
 * @param count Number of dice to roll (default 1).
 * @returns sum of the rolls.
 */
export function rollDie(sides: number, count: number = 1): number {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
}

/**
 * Basic d20 roll implementation.
 */
export function d20(): number {
  return rollDie(20);
}
