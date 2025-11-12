/**
 * @file frontend/src/components/combat/TimeTravelPanel.stories.tsx
 * @note Update README.md when adding new variants or significant examples
 */

import type { Meta, StoryObj } from '@storybook/react';
import { TimeTravelPanel } from './TimeTravelPanel';
import type { CombatHistory, CombatState, CombatCharacter } from '../../types/combat';

const createBaseState = (): CombatState => ({
  sessionId: 'test',
  characters: [
    {
      id: 'char-1',
      name: 'Fighter',
      hp: 50,
      maxHp: 50,
    } as unknown as CombatCharacter,
    {
      id: 'char-2',
      name: 'Wizard',
      hp: 30,
      maxHp: 30,
    } as unknown as CombatCharacter,
  ],
  activeCharacterId: null,
  turnOrder: [],
  round: 1,
  isCombatOver: false,
  winner: null,
  log: [],
  diceHistory: [],
  gridWidth: 10,
  gridHeight: 10,
  phase: 'setup',
  pendingOpportunityAttacks: [],
  diceRollerSeed: 42,
  spellPreview: null,
  lastSpellResolution: null,
});

const createHistory = (count: number): CombatHistory[] =>
  Array.from({ length: count }, (_, i) => ({
    timestamp: Date.now() - (count - i) * 5000,
    description: `Turn ${i + 1} action`,
    state: {
      ...createBaseState(),
      round: Math.floor(i / 3) + 1,
      characters: createBaseState().characters.map((c) => ({
        ...c,
        hp: Math.max(0, c.hp - i * 2),
      })),
    },
  }));

const meta = {
  title: 'Combat/TimeTravelPanel',
  component: TimeTravelPanel,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  args: {
    onRestore: () => {},
    onToggle: () => {},
  },
  argTypes: {
    onRestore: { action: 'restore' },
    onToggle: { action: 'toggle' },
  },
} satisfies Meta<typeof TimeTravelPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  args: {
    history: createHistory(5),
    currentIndex: 2,
    isOpen: false,
  },
};

export const OpenEmpty: Story = {
  args: {
    history: [],
    currentIndex: 0,
    isOpen: true,
  },
};

export const OpenWithHistory: Story = {
  args: {
    history: createHistory(5),
    currentIndex: 2,
    isOpen: true,
  },
};

export const AtBeginning: Story = {
  args: {
    history: createHistory(5),
    currentIndex: 0,
    isOpen: true,
  },
};

export const AtEnd: Story = {
  args: {
    history: createHistory(5),
    currentIndex: 4,
    isOpen: true,
  },
};

export const ShortHistory: Story = {
  args: {
    history: [
      {
        timestamp: Date.now() - 10000,
        description: 'Combat started',
        state: createBaseState(),
      },
      {
        timestamp: Date.now() - 5000,
        description: 'Turn 1: Fighter attacks',
        state: createBaseState(),
      },
    ],
    currentIndex: 1,
    isOpen: true,
  },
};

export const LongHistory: Story = {
  args: {
    history: createHistory(15),
    currentIndex: 7,
    isOpen: true,
  },
};

export const VictoryState: Story = {
  args: {
    history: [
      {
        timestamp: Date.now() - 30000,
        description: 'Combat started',
        state: createBaseState(),
      },
      {
        timestamp: Date.now() - 20000,
        description: 'Turn 1: Fighter attacks Goblin',
        state: createBaseState(),
      },
      {
        timestamp: Date.now() - 10000,
        description: 'Turn 2: Wizard casts Fireball',
        state: createBaseState(),
      },
      {
        timestamp: Date.now(),
        description: 'Victory! All enemies defeated',
        state: {
          ...createBaseState(),
          isCombatOver: true,
          winner: 'player',
        },
      },
    ],
    currentIndex: 3,
    isOpen: true,
  },
};

export const MultiplRounds: Story = {
  args: {
    history: [
      {
        timestamp: Date.now() - 50000,
        description: 'Round 1 begins',
        state: { ...createBaseState(), round: 1 },
      },
      {
        timestamp: Date.now() - 40000,
        description: 'Fighter attacks',
        state: { ...createBaseState(), round: 1 },
      },
      {
        timestamp: Date.now() - 30000,
        description: 'Wizard attacks',
        state: { ...createBaseState(), round: 1 },
      },
      {
        timestamp: Date.now() - 20000,
        description: 'Round 2 begins',
        state: { ...createBaseState(), round: 2 },
      },
      {
        timestamp: Date.now() - 10000,
        description: 'Fighter moves',
        state: { ...createBaseState(), round: 2 },
      },
      {
        timestamp: Date.now(),
        description: 'Wizard casts spell',
        state: { ...createBaseState(), round: 2 },
      },
    ],
    currentIndex: 3,
    isOpen: true,
  },
};

export const WithCasualties: Story = {
  args: {
    history: [
      {
        timestamp: Date.now() - 20000,
        description: 'Combat started - 6 fighters',
        state: {
          ...createBaseState(),
          characters: Array.from({ length: 6 }, (_, i) => ({
            id: `char-${i}`,
            name: `Character ${i}`,
            hp: 30,
            maxHp: 30,
          })) as unknown as CombatCharacter[],
        },
      },
      {
        timestamp: Date.now() - 10000,
        description: 'After first round - 4 alive',
        state: {
          ...createBaseState(),
          characters: [
            { id: 'char-0', hp: 20, maxHp: 30 } as unknown as CombatCharacter,
            { id: 'char-1', hp: 15, maxHp: 30 } as unknown as CombatCharacter,
            { id: 'char-2', hp: 0, maxHp: 30 } as unknown as CombatCharacter,
            { id: 'char-3', hp: 25, maxHp: 30 } as unknown as CombatCharacter,
            { id: 'char-4', hp: 10, maxHp: 30 } as unknown as CombatCharacter,
            { id: 'char-5', hp: 0, maxHp: 30 } as unknown as CombatCharacter,
          ],
        },
      },
      {
        timestamp: Date.now(),
        description: 'Current state - 2 alive',
        state: {
          ...createBaseState(),
          characters: [
            { id: 'char-0', hp: 5, maxHp: 30 } as unknown as CombatCharacter,
            { id: 'char-1', hp: 0, maxHp: 30 } as unknown as CombatCharacter,
            { id: 'char-2', hp: 0, maxHp: 30 } as unknown as CombatCharacter,
            { id: 'char-3', hp: 12, maxHp: 30 } as unknown as CombatCharacter,
            { id: 'char-4', hp: 0, maxHp: 30 } as unknown as CombatCharacter,
            { id: 'char-5', hp: 0, maxHp: 30 } as unknown as CombatCharacter,
          ],
        },
      },
    ],
    currentIndex: 2,
    isOpen: true,
  },
};
