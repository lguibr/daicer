/**
 * @file frontend/src/components/combat/CombatGrid.stories.tsx
 * @note Update README.md when adding new variants or significant examples
 */

import type { Meta, StoryObj } from '@storybook/react';
import { CombatGrid } from './CombatGrid';
import type { CombatCharacter } from '../../types/combat';

const createCharacter = (overrides: Partial<CombatCharacter>): CombatCharacter => ({
  id: 'char-1',
  name: 'Warrior',
  hp: 50,
  maxHp: 50,
  tempHp: 0,
  armorClass: 16,
  position: { x: 5, y: 5 },
  initiative: 15,
  avatar: 'warrior',
  isPlayer: true,
  strength: 16,
  dexterity: 14,
  constitution: 14,
  intelligence: 10,
  wisdom: 12,
  charisma: 8,
  proficiencyBonus: 2,
  speed: 30,
  reach: 1,
  hasMoved: false,
  hasActed: false,
  hasReaction: true,
  hasBonusAction: true,
  movementRemaining: 30,
  conditions: [],
  ...overrides,
});

const meta = {
  title: 'Combat/CombatGrid',
  component: CombatGrid,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onSquareClick: () => {},
    onCharacterClick: () => {},
  },
  argTypes: {
    onSquareClick: { action: 'square-clicked' },
    onCharacterClick: { action: 'character-clicked' },
  },
} satisfies Meta<typeof CombatGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    characters: [],
    gridWidth: 10,
    gridHeight: 10,
    activeCharacterId: null,
    selectedCharacterId: null,
    reachableSquares: [],
  },
};

export const SingleCharacter: Story = {
  args: {
    characters: [createCharacter({ name: 'Fighter' })],
    gridWidth: 10,
    gridHeight: 10,
    activeCharacterId: 'char-1',
    selectedCharacterId: null,
    reachableSquares: [],
  },
};

export const WithMovement: Story = {
  args: {
    characters: [createCharacter({ name: 'Fighter' })],
    gridWidth: 10,
    gridHeight: 10,
    activeCharacterId: 'char-1',
    selectedCharacterId: null,
    reachableSquares: [
      { x: 4, y: 5 },
      { x: 6, y: 5 },
      { x: 5, y: 4 },
      { x: 5, y: 6 },
      { x: 4, y: 4 },
      { x: 6, y: 4 },
      { x: 4, y: 6 },
      { x: 6, y: 6 },
    ],
  },
};

export const MultipleCharacters: Story = {
  args: {
    characters: [
      createCharacter({ id: 'char-1', name: 'Fighter', position: { x: 2, y: 2 }, isPlayer: true }),
      createCharacter({ id: 'char-2', name: 'Wizard', position: { x: 7, y: 2 }, isPlayer: true }),
      createCharacter({ id: 'char-3', name: 'Goblin', position: { x: 5, y: 7 }, isPlayer: false }),
      createCharacter({ id: 'char-4', name: 'Orc', position: { x: 8, y: 8 }, isPlayer: false }),
    ],
    gridWidth: 10,
    gridHeight: 10,
    activeCharacterId: 'char-1',
    selectedCharacterId: null,
    reachableSquares: [],
  },
};

export const SmallGrid: Story = {
  args: {
    characters: [
      createCharacter({ id: 'char-1', name: 'Fighter', position: { x: 1, y: 1 } }),
      createCharacter({ id: 'char-2', name: 'Goblin', position: { x: 3, y: 3 }, isPlayer: false }),
    ],
    gridWidth: 5,
    gridHeight: 5,
    activeCharacterId: 'char-1',
    selectedCharacterId: null,
    reachableSquares: [
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
  },
};

export const LargeGrid: Story = {
  args: {
    characters: [
      createCharacter({ id: 'char-1', name: 'Fighter', position: { x: 5, y: 5 } }),
      createCharacter({ id: 'char-2', name: 'Archer', position: { x: 10, y: 5 }, isPlayer: true }),
      createCharacter({ id: 'char-3', name: 'Goblin', position: { x: 7, y: 7 }, isPlayer: false }),
    ],
    gridWidth: 15,
    gridHeight: 15,
    activeCharacterId: 'char-1',
    selectedCharacterId: null,
    reachableSquares: [],
  },
};

export const CombatScenario: Story = {
  args: {
    characters: [
      createCharacter({ id: 'char-1', name: 'Fighter', position: { x: 2, y: 5 }, hp: 40, maxHp: 50 }),
      createCharacter({ id: 'char-2', name: 'Wizard', position: { x: 1, y: 5 }, hp: 20, maxHp: 30 }),
      createCharacter({ id: 'char-3', name: 'Goblin 1', position: { x: 7, y: 4 }, isPlayer: false, hp: 12, maxHp: 15 }),
      createCharacter({ id: 'char-4', name: 'Goblin 2', position: { x: 7, y: 6 }, isPlayer: false, hp: 15, maxHp: 15 }),
      createCharacter({ id: 'char-5', name: 'Orc', position: { x: 8, y: 5 }, isPlayer: false, hp: 25, maxHp: 35 }),
    ],
    gridWidth: 10,
    gridHeight: 10,
    activeCharacterId: 'char-1',
    selectedCharacterId: 'char-3',
    reachableSquares: [
      { x: 3, y: 5 },
      { x: 4, y: 5 },
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 2, y: 4 },
      { x: 2, y: 6 },
    ],
  },
};

export const DeadCharacters: Story = {
  args: {
    characters: [
      createCharacter({ id: 'char-1', name: 'Fighter', position: { x: 3, y: 3 }, hp: 35 }),
      createCharacter({ id: 'char-2', name: 'Wizard', position: { x: 2, y: 3 }, hp: 0 }),
      createCharacter({ id: 'char-3', name: 'Goblin', position: { x: 5, y: 5 }, isPlayer: false, hp: 10 }),
      createCharacter({ id: 'char-4', name: 'Orc', position: { x: 6, y: 6 }, isPlayer: false, hp: 0 }),
    ],
    gridWidth: 8,
    gridHeight: 8,
    activeCharacterId: 'char-1',
    selectedCharacterId: null,
    reachableSquares: [],
  },
};
