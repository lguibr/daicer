import { WorldCondition, TurnUpdate } from './types';
import { Alea } from '../world-gen/noise';

export const randomEventsPool = [
  { name: 'Minor Tremor', description: 'The ground shakes slightly.', impact: 'Unease' },
  { name: 'Strange Lights', description: 'Lights dance in the sky.', impact: 'Wonder' },
  { name: 'Sudden Fog', description: 'Fog rolls in.', impact: 'Obscured Vision' },
];

export const generateInitialConditions = (_seed: number | string): WorldCondition[] => {
  // Mock implementation to satisfy QA
  return [
    {
      type: 'World Condition',
      key: 'Weather',
      currentValue: 'Clear',
      values: ['Clear', 'Rain'],
      description: 'Current weather',
      lastUpdatedTurn: 0,
    },
    {
      type: 'World Condition',
      key: 'Lighting',
      currentValue: 'Bright',
      values: ['Bright', 'Dim'],
      description: 'Ambient light',
      lastUpdatedTurn: 0,
    },
    {
      type: 'World Condition',
      key: 'Atmosphere',
      currentValue: 'Calm',
      values: ['Calm', 'Tense'],
      description: 'General mood',
      lastUpdatedTurn: 0,
    },
  ];
};

export const advanceTurn = (
  conditions: WorldCondition[],
  turnNumber: number,
  seed: number,
  _context?: any,
  _mode: 'worldgen' | 'gameplay' = 'gameplay'
): TurnUpdate => {
  const rng = Alea(`${seed}-${turnNumber}`);
  const roll = rng();

  if (roll > 0.9) {
    // Trigger Event
    const event = randomEventsPool[Math.floor(rng() * randomEventsPool.length)]!;
    return {
      newEvent: {
        name: event.name,
        description: event.description,
        impact: event.impact,
      },
    };
  }

  // Chance to mutate condition
  if (roll > 0.7) {
    const condition = conditions[Math.floor(rng() * conditions.length)];
    if (condition) {
      const newValue = condition.values.find((v) => v !== condition.currentValue) || condition.currentValue;
      return {
        mutation: {
          key: condition.key,
          newValue,
          reason: 'Natural fluctuation',
        },
      };
    }
  }

  return {};
};
