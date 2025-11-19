/**
 * Dice rolling system for D&D 5e combat
 * Provides deterministic dice rolls with full history tracking for time-travel
 */

export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';
export type RollType = 'initiative' | 'attack' | 'damage' | 'saving_throw' | 'ability_check';
export type AdvantageType = 'normal' | 'advantage' | 'disadvantage';

export interface DiceRollResult {
  id: string;
  timestamp: number;
  rollType: RollType;
  diceType: DiceType;
  numberOfDice: number;
  rawRolls: number[];
  modifier: number;
  advantageType: AdvantageType;
  finalResult: number;
  description: string;
  contextId?: string;
}

export interface DiceRollerOptions {
  seed?: number;
  enableHistory?: boolean;
}

/**
 * Seeded pseudo-random number generator for deterministic dice rolls
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  next(): number {
    // LCG algorithm for deterministic randomness
    // eslint-disable-next-line no-bitwise
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  setSeed(seed: number): void {
    this.seed = seed;
  }

  getSeed(): number {
    return this.seed;
  }
}

// eslint-disable-next-line max-classes-per-file
export class DiceRoller {
  private rng: SeededRandom;

  private history: DiceRollResult[] = [];

  private enableHistory: boolean;

  private rollCounter = 0;

  constructor(options: DiceRollerOptions = {}) {
    this.rng = new SeededRandom(options.seed);
    this.enableHistory = options.enableHistory ?? true;
  }

  /**
   * Roll a single die
   */
  private rollDie(sides: number): number {
    return Math.floor(this.rng.next() * sides) + 1;
  }

  /**
   * Parse dice notation (e.g., "2d6" -> { number: 2, type: 'd6' })
   */
  private parseDiceNotation(notation: string): { numberOfDice: number; diceType: DiceType } {
    const match = notation.match(/^(\d+)(d\d+)$/i);
    if (!match || !match[1] || !match[2]) {
      throw new Error(`Invalid dice notation: ${notation}`);
    }
    return {
      numberOfDice: parseInt(match[1], 10),
      diceType: match[2].toLowerCase() as DiceType,
    };
  }

  /**
   * Get the number of sides for a dice type
   */
  private getSides(diceType: DiceType): number {
    const sidesMap: Record<DiceType, number> = {
      d4: 4,
      d6: 6,
      d8: 8,
      d10: 10,
      d12: 12,
      d20: 20,
      d100: 100,
    };
    return sidesMap[diceType];
  }

  /**
   * Core roll method
   */
  roll(
    diceNotation: string,
    options: {
      rollType?: RollType;
      modifier?: number;
      advantageType?: AdvantageType;
      description?: string;
      contextId?: string;
    } = {}
  ): DiceRollResult {
    const { numberOfDice, diceType } = this.parseDiceNotation(diceNotation);
    const sides = this.getSides(diceType);
    const modifier = options.modifier ?? 0;
    const advantageType = options.advantageType ?? 'normal';
    const rollType = options.rollType ?? 'ability_check';

    let rawRolls: number[] = [];

    // Handle advantage/disadvantage for d20 rolls
    if (diceType === 'd20' && numberOfDice === 1 && advantageType !== 'normal') {
      const roll1 = this.rollDie(sides);
      const roll2 = this.rollDie(sides);
      rawRolls = [roll1, roll2];
    } else {
      // Normal roll
      rawRolls = Array.from({ length: numberOfDice }, () => this.rollDie(sides));
    }

    // Calculate final result
    let finalResult: number;
    if (diceType === 'd20' && numberOfDice === 1 && advantageType !== 'normal') {
      // Advantage: take max, Disadvantage: take min
      const selectedRoll = advantageType === 'advantage' ? Math.max(...rawRolls) : Math.min(...rawRolls);
      finalResult = selectedRoll + modifier;
    } else {
      // Sum all dice and add modifier
      finalResult = rawRolls.reduce((sum, roll) => sum + roll, 0) + modifier;
    }

    const result: DiceRollResult = {
      // eslint-disable-next-line no-plusplus
      id: `roll-${this.rollCounter++}-${Date.now()}`,
      timestamp: Date.now(),
      rollType,
      diceType,
      numberOfDice,
      rawRolls,
      modifier,
      advantageType,
      finalResult,
      description: options.description ?? `${diceNotation}${modifier !== 0 ? ` + ${modifier}` : ''}`,
      contextId: options.contextId,
    };

    if (this.enableHistory) {
      this.history.push(result);
    }

    return result;
  }

  /**
   * Roll with advantage (for d20 rolls)
   */
  rollWithAdvantage(
    options: Omit<Parameters<typeof this.roll>[1], 'advantageType'> = {},
    diceNotation: string = '1d20'
  ): DiceRollResult {
    return this.roll(diceNotation, { ...options, advantageType: 'advantage' });
  }

  /**
   * Roll with disadvantage (for d20 rolls)
   */
  rollWithDisadvantage(
    options: Omit<Parameters<typeof this.roll>[1], 'advantageType'> = {},
    diceNotation: string = '1d20'
  ): DiceRollResult {
    return this.roll(diceNotation, { ...options, advantageType: 'disadvantage' });
  }

  /**
   * Roll for initiative
   */
  rollInitiative(modifier?: number, description?: string): DiceRollResult {
    return this.roll('1d20', {
      rollType: 'initiative',
      modifier: modifier ?? 0,
      description: description ?? `Initiative roll (1d20 + ${modifier ?? 0})`,
    });
  }

  /**
   * Roll attack (d20)
   */
  rollAttack(
    modifier?: number,
    advantageType?: AdvantageType,
    description?: string,
    contextId?: string
  ): DiceRollResult {
    return this.roll('1d20', {
      rollType: 'attack',
      modifier: modifier ?? 0,
      advantageType: advantageType ?? 'normal',
      description: description ?? `Attack roll (1d20 + ${modifier ?? 0})`,
      contextId,
    });
  }

  /**
   * Roll damage
   */
  rollDamage(diceNotation: string, modifier?: number, description?: string, contextId?: string): DiceRollResult {
    return this.roll(diceNotation, {
      rollType: 'damage',
      modifier: modifier ?? 0,
      description: description ?? `Damage roll (${diceNotation} + ${modifier ?? 0})`,
      contextId,
    });
  }

  /**
   * Roll saving throw
   */
  rollSavingThrow(modifier?: number, advantageType?: AdvantageType, description?: string): DiceRollResult {
    return this.roll('1d20', {
      rollType: 'saving_throw',
      modifier: modifier ?? 0,
      advantageType: advantageType ?? 'normal',
      description: description ?? `Saving throw (1d20 + ${modifier ?? 0})`,
    });
  }

  /**
   * Get roll history
   */
  getHistory(): DiceRollResult[] {
    return [...this.history];
  }

  /**
   * Get rolls for specific context
   */
  getRollsByContext(contextId: string): DiceRollResult[] {
    return this.history.filter((r) => r.contextId === contextId);
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Set seed for deterministic rolls (useful for testing)
   */
  setSeed(seed: number): void {
    this.rng.setSeed(seed);
  }

  /**
   * Get current seed
   */
  getSeed(): number {
    return this.rng.getSeed();
  }

  /**
   * Format a roll result for display
   */
  static formatRoll(roll: DiceRollResult): string {
    let advantageText = '';
    if (roll.advantageType === 'advantage') {
      advantageText = ' (Advantage)';
    } else if (roll.advantageType === 'disadvantage') {
      advantageText = ' (Disadvantage)';
    }

    let rawRollsText = '';
    if (roll.rawRolls.length > 1 && roll.diceType === 'd20') {
      rawRollsText = ` [${roll.rawRolls.join(', ')}]`;
    } else if (roll.rawRolls.length > 1) {
      rawRollsText = ` [${roll.rawRolls.join(' + ')}]`;
    } else {
      rawRollsText = ` [${roll.rawRolls[0]}]`;
    }

    const modifierText = roll.modifier !== 0 ? ` + ${roll.modifier}` : '';

    return `${roll.description}${advantageText}: ${rawRollsText}${modifierText} = **${roll.finalResult}**`;
  }
}

/**
 * Global dice roller instance (can be replaced for testing)
 */
export const globalDiceRoller = new DiceRoller();
