/**
 * Historical Entropy Wrapper
 * Generates entropy events for 50-year historical periods during world generation
 */

import { advanceTurn, generateInitialConditions } from './engine';
import type { WorldCondition, TurnUpdate } from './types';

export interface HistoricalPeriodEntropy {
  periodNumber: number;
  startYear: number;
  endYear: number;
  events: TurnUpdate[];
  finalConditions: WorldCondition[];
}

/**
 * Generate entropy events for a single 500-year historical period
 * @param roomSeed - Base seed from room configuration
 * @param periodNumber - Which 500-year period (0-indexed)
 * @param previousConditions - Conditions from previous period, or null for period 0
 * @returns Entropy data for this period
 */
export function generateHistoricalPeriod(
  roomSeed: string,
  periodNumber: number,
  previousConditions: WorldCondition[] | null
): HistoricalPeriodEntropy {
  // Convert room seed to number
  const baseSeed = hashString(roomSeed);

  // Initialize conditions for period 0, or use previous period's final state
  let conditions: WorldCondition[];
  if (periodNumber === 0 || previousConditions === null) {
    conditions = generateInitialConditions(baseSeed);
  } else {
    conditions = previousConditions.map((c) => ({ ...c, lastUpdatedTurn: periodNumber }));
  }

  const events: TurnUpdate[] = [];
  const startYear = periodNumber * 500;
  const endYear = startYear + 500;

  // Generate 1-3 entropy events per 500-year period
  const eventCount = 1 + Math.floor(Math.random() * 3);

  for (let i = 0; i < eventCount; i++) {
    // Use period number and event index as the "turn" for deterministic seeding
    const turnNumber = periodNumber * 100 + i;
    const event = advanceTurn(conditions, turnNumber, baseSeed, undefined, 'worldgen');

    if (Object.keys(event).length > 0) {
      events.push(event);

      // Apply mutations to conditions
      if (event.mutation) {
        const condition = conditions.find((c) => c.key === event.mutation?.key);
        if (condition) {
          condition.currentValue = event.mutation.newValue;
          condition.lastUpdatedTurn = periodNumber;
        }
      }
    }
  }

  return {
    periodNumber,
    startYear,
    endYear,
    events,
    finalConditions: conditions,
  };
}

/**
 * Simple string hash function for deterministic seeding
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
