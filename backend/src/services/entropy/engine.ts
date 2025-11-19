/**
 * Entropy Engine
 * Generates and advances world conditions and random events
 */

import type { WorldCondition, RandomEvent, TurnUpdate } from './types';

// --- DATABASE OF PREDEFINED CONTENT ---

type ConditionTemplate = Omit<WorldCondition, 'lastUpdatedTurn' | 'currentValue' | 'type'>;
type EventTemplate = Omit<RandomEvent, 'turnTriggered' | 'type'>;

export const worldConditionsPool: ConditionTemplate[] = [
  {
    key: 'Aetheric Tides',
    values: ['Ebb', 'Flow', 'Neap', 'King'],
    description: 'The invisible flow of magical energy in the region. Affects spellcasting potency and stability.',
    ordered: true,
  },
  {
    key: 'Planar Alignment',
    values: ['Stable', 'Whispering', 'Intruding', 'Overlapping'],
    description:
      'The proximity of other planes of existence to the material world, potentially causing strange phenomena.',
    ordered: true,
  },
  {
    key: 'Political Climate',
    values: ['Peaceful', 'Tense', 'Skirmishes', 'Open War'],
    description: 'The state of relations between the major factions or kingdoms.',
    ordered: true,
  },
  {
    key: 'Divine Favor',
    values: ['Favored', 'Neutral', 'Ignored', 'Forsaken'],
    description: 'The perceived disposition of the gods towards the mortals of the land.',
    ordered: false,
  },
  {
    key: 'Sky Sentinel',
    values: ['Clear Skies', 'Twin Moons', 'Raining Stars', 'Ominous Comet'],
    description: 'A significant celestial body or event visible in the sky, often interpreted as an omen.',
    ordered: false,
  },
  {
    key: 'Wilderness Aggression',
    values: ['Docile', 'Wary', 'Hostile', 'Frenzied'],
    description: 'The general behavior of wild beasts and monsters in the region.',
    ordered: true,
  },
  {
    key: 'Trade & Commerce',
    values: ['Booming', 'Stagnant', 'Recession', 'Embargoed'],
    description: 'The flow of goods and wealth within the local area.',
    ordered: true,
  },
];

export const randomEventsPool: EventTemplate[] = [
  {
    name: 'Ghostly Procession',
    description:
      'A silent, translucent caravan of figures from a bygone era is seen travelling an old road at midnight.',
    impact: 'Locals are spooked. May reveal a forgotten location or a quest hook related to the past.',
  },
  {
    name: 'Sudden Blight',
    description:
      'A small, localized area of plant life suddenly withers and dies, turning black as if touched by necrotic energy.',
    impact: "A vital crop may be threatened, or it could be the sign of a monster's nearby lair.",
  },
  {
    name: "Merchant's Misfortune",
    description:
      'A well-known travelling merchant has their wagon wheel break on the main road, spilling their exotic goods.',
    impact: 'An opportunity for trade, a potential ambush target, or a chance to earn a reward for helping.',
  },
  {
    name: 'Prophetic Dream',
    description:
      'One of the party members receives a vivid, cryptic dream from an unknown entity, showing a glimpse of a possible future.',
    impact: 'Provides a clue, a warning, or a red herring for the party to interpret.',
  },
  {
    name: 'Wild Magic Surge',
    description:
      'For a brief period, all spells cast in the area have a small chance of triggering an additional, unforeseen effect.',
    impact: 'Spellcasting becomes unpredictable and potentially dangerous or hilarious for a short time.',
  },
];

// --- ENGINE LOGIC ---

/**
 * Seeded random number generator for deterministic entropy
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    // Simple LCG algorithm for deterministic randomness
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }
}

/**
 * Shuffle array using seeded random
 */
function shuffle<T>(array: T[], random: SeededRandom): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = random.nextInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate initial world conditions
 */
export function generateInitialConditions(seed: number): WorldCondition[] {
  const random = new SeededRandom(seed);
  const selectedConditions = shuffle([...worldConditionsPool], random).slice(0, 5);

  return selectedConditions.map((condition) => ({
    ...condition,
    type: 'World Condition' as const,
    currentValue: condition.values[random.nextInt(condition.values.length)],
    lastUpdatedTurn: 0,
  }));
}

/**
 * Duration-based probabilities for entropy changes
 */
const durationProbabilities: { [key: string]: number } = {
  '1 Hour': 0.05, // 5% chance of change
  '8 Hours': 0.2, // 20%
  '1 Day': 0.4, // 40%
  '1 Week': 0.8, // 80%
};

/**
 * Advance entropy based on turn progression
 * @param currentConditions - Current world conditions
 * @param currentTurn - Current turn number
 * @param seed - Seed for deterministic randomness
 * @param duration - Optional time duration (defaults to turn-based probability)
 * @param mode - 'worldgen' for 50-year historical periods or 'gameplay' for turn-based
 */
export function advanceTurn(
  currentConditions: WorldCondition[],
  currentTurn: number,
  seed: number,
  duration?: string,
  mode: 'worldgen' | 'gameplay' = 'gameplay'
): TurnUpdate {
  const random = new SeededRandom(seed + currentTurn);

  // Determine probability based on mode, duration, or turn number
  let probability = 0.1; // Default 10% per turn for gameplay

  if (mode === 'worldgen') {
    // For world generation, much higher probability of change per 50-year period
    probability = 0.9; // 90% chance something happens in 50 years
  } else if (duration && durationProbabilities[duration]) {
    probability = durationProbabilities[duration];
  }

  // Roll to see IF a change occurs
  if (random.next() > probability) {
    return {}; // No change
  }

  // A change occurred! Decide WHAT kind of change
  // 75% chance of mutation, 25% chance of new event
  const changeTypeRoll = random.next();

  if (changeTypeRoll < 0.75) {
    // --- MUTATION ---
    const conditionToMutate = currentConditions[random.nextInt(currentConditions.length)];
    const possibleNewValues = conditionToMutate.values.filter((v) => v !== conditionToMutate.currentValue);

    if (possibleNewValues.length === 0) return {}; // Failsafe if only one value exists

    const newValue = possibleNewValues[random.nextInt(possibleNewValues.length)];

    return {
      mutation: {
        key: conditionToMutate.key,
        newValue,
        reason: 'The winds of fate have shifted.',
      },
    };
  }
  // --- NEW EVENT ---
  const newEvent = randomEventsPool[random.nextInt(randomEventsPool.length)];
  return {
    newEvent,
  };
}
