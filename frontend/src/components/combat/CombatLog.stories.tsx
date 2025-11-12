/**
 * @file frontend/src/components/combat/CombatLog.stories.tsx
 * @note Update README.md when adding new variants or significant examples
 */

import type { Meta, StoryObj } from '@storybook/react';
import { CombatLog } from './CombatLog';
import type { CombatLogEntry, DiceRollResult } from '../../types/combat';

const createDiceRoll = (overrides: Partial<DiceRollResult>): DiceRollResult => ({
  id: 'roll-1',
  timestamp: Date.now(),
  rollType: 'attack',
  diceType: 'd20',
  numberOfDice: 1,
  rawRolls: [15],
  modifier: 5,
  advantageType: 'normal',
  finalResult: 20,
  description: 'Attack roll',
  ...overrides,
});

const createLogEntry = (overrides: Partial<CombatLogEntry>): CombatLogEntry => ({
  id: `log-${Date.now()}`,
  timestamp: Date.now(),
  message: 'Action occurred',
  type: 'attack',
  relatedRolls: [],
  ...overrides,
});

const meta = {
  title: 'Combat/CombatLog',
  component: CombatLog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CombatLog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    log: [],
    diceHistory: [],
  },
};

export const SingleEntry: Story = {
  args: {
    log: [createLogEntry({ message: 'Fighter attacks Goblin' })],
    diceHistory: [],
  },
};

export const MultipleLogs: Story = {
  args: {
    log: [
      createLogEntry({ id: 'log-1', type: 'round', message: '**Round 1** begins!' }),
      createLogEntry({ id: 'log-2', type: 'turn', message: "Fighter's turn" }),
      createLogEntry({ id: 'log-3', type: 'move', message: 'Fighter moves to (5, 5)' }),
      createLogEntry({ id: 'log-4', type: 'attack', message: 'Fighter attacks Goblin and **hits**!' }),
      createLogEntry({ id: 'log-5', type: 'damage', message: 'Goblin takes **12 damage**' }),
    ],
    diceHistory: [],
  },
};

export const WithDiceRolls: Story = {
  args: {
    log: [
      createLogEntry({
        id: 'log-1',
        type: 'attack',
        message: 'Fighter attacks Goblin and **hits**!',
        relatedRolls: ['roll-1', 'roll-2'],
      }),
    ],
    diceHistory: [
      createDiceRoll({ id: 'roll-1', rollType: 'attack', finalResult: 20 }),
      createDiceRoll({
        id: 'roll-2',
        rollType: 'damage',
        diceType: 'd8',
        rawRolls: [6, 3],
        modifier: 3,
        finalResult: 12,
      }),
    ],
  },
};

export const AdvantageRolls: Story = {
  args: {
    log: [
      createLogEntry({
        id: 'log-1',
        message: 'Rogue attacks with advantage',
        relatedRolls: ['roll-adv'],
      }),
    ],
    diceHistory: [
      createDiceRoll({
        id: 'roll-adv',
        advantageType: 'advantage',
        rawRolls: [18, 12],
        finalResult: 23,
      }),
    ],
  },
};

export const DisadvantageRolls: Story = {
  args: {
    log: [
      createLogEntry({
        id: 'log-1',
        message: 'Wizard attacks with disadvantage',
        relatedRolls: ['roll-dis'],
      }),
    ],
    diceHistory: [
      createDiceRoll({
        id: 'roll-dis',
        advantageType: 'disadvantage',
        rawRolls: [15, 8],
        finalResult: 13,
      }),
    ],
  },
};

export const CombatSequence: Story = {
  args: {
    log: [
      createLogEntry({ id: '1', type: 'round', message: '**Round 1** begins!' }),
      createLogEntry({ id: '2', type: 'turn', message: "Fighter's turn (Initiative: 18)" }),
      createLogEntry({ id: '3', type: 'move', message: 'Fighter moves forward (5, 5) → (7, 5)' }),
      createLogEntry({
        id: '4',
        type: 'attack',
        message: 'Fighter attacks **Goblin** and **hits**!',
        relatedRolls: ['roll-1'],
      }),
      createLogEntry({ id: '5', type: 'damage', message: 'Goblin takes **14 damage**', relatedRolls: ['roll-2'] }),
      createLogEntry({ id: '6', type: 'turn', message: "Wizard's turn (Initiative: 15)" }),
      createLogEntry({
        id: '7',
        type: 'attack',
        message: 'Wizard casts Fire Bolt at **Goblin**',
        relatedRolls: ['roll-3'],
      }),
      createLogEntry({ id: '8', type: 'damage', message: 'Goblin takes **10 damage**', relatedRolls: ['roll-4'] }),
      createLogEntry({ id: '9', type: 'victory', message: 'Goblin is defeated!' }),
    ],
    diceHistory: [
      createDiceRoll({ id: 'roll-1', rollType: 'attack', finalResult: 22 }),
      createDiceRoll({ id: 'roll-2', rollType: 'damage', diceType: 'd8', rawRolls: [8, 3], finalResult: 14 }),
      createDiceRoll({ id: 'roll-3', rollType: 'attack', finalResult: 18 }),
      createDiceRoll({ id: 'roll-4', rollType: 'damage', diceType: 'd10', rawRolls: [10], finalResult: 10 }),
    ],
  },
};

export const AllLogTypes: Story = {
  args: {
    log: [
      createLogEntry({ id: '1', type: 'round', message: 'Round 3 begins' }),
      createLogEntry({ id: '2', type: 'turn', message: "Rogue's turn" }),
      createLogEntry({ id: '3', type: 'move', message: 'Rogue dashes forward' }),
      createLogEntry({ id: '4', type: 'attack', message: 'Rogue sneak attacks' }),
      createLogEntry({ id: '5', type: 'damage', message: 'Critical hit for 24 damage!' }),
      createLogEntry({ id: '6', type: 'victory', message: 'Victory! All enemies defeated!' }),
    ],
    diceHistory: [],
  },
};

export const LongCombat: Story = {
  args: {
    log: Array.from({ length: 20 }, (_, i) =>
      createLogEntry({
        id: `log-${i}`,
        type: i % 5 === 0 ? 'round' : i % 2 === 0 ? 'attack' : 'move',
        message: `Action ${i + 1}: Something happened in combat`,
      })
    ),
    diceHistory: [],
  },
};
