/**
 * @file frontend/src/components/game/PlayerSidebar.stories.tsx
 * @note Update README.md when adding new variants or significant examples
 */

import type { Meta, StoryObj } from '@storybook/react';
import PlayerSidebar from './PlayerSidebar';
import type { Player } from '../../types/shared';

const createPlayer = (overrides: Partial<Player>): Player =>
  ({
    id: 'player-1',
    userId: 'user-1',
    name: 'Player',
    character: {
      name: 'Hero',
      race: 'Human',
      characterClass: 'Fighter',
      level: 1,
      hp: 12,
      maxHp: 12,
      armorClass: 16,
      attributes: {
        Strength: 16,
        Dexterity: 12,
        Constitution: 14,
        Intelligence: 10,
        Wisdom: 10,
        Charisma: 8,
      },
      skills: {},
      alignment: 'Neutral Good',
      background: 'Soldier',
    },
    action: null,
    ...overrides,
  }) as Player;

const meta = {
  title: 'Game/PlayerSidebar',
  component: PlayerSidebar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="h-[600px] w-[300px] bg-midnight-900">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlayerSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SinglePlayer: Story = {
  args: {
    players: [createPlayer({})],
    creatures: [],
  },
};

export const MultiplePlayersNoActions: Story = {
  args: {
    players: [
      createPlayer({
        id: 'p1',
        character: { ...createPlayer({}).character, name: 'Elara', race: 'Elf', characterClass: 'Wizard' } as any,
      }),
      createPlayer({
        id: 'p2',
        character: { ...createPlayer({}).character, name: 'Thrain', race: 'Dwarf', characterClass: 'Fighter' } as any,
      }),
      createPlayer({
        id: 'p3',
        character: { ...createPlayer({}).character, name: 'Luna', race: 'Half-Elf', characterClass: 'Rogue' } as any,
      }),
    ],
    creatures: [],
  },
};

export const WithSubmittedActions: Story = {
  args: {
    players: [
      createPlayer({ id: 'p1', action: 'I cast Magic Missile' }),
      createPlayer({ id: 'p2', action: null }),
      createPlayer({ id: 'p3', action: 'I hide in the shadows' }),
    ],
    creatures: [],
  },
};

export const WithCreatures: Story = {
  args: {
    players: [createPlayer({})],
    creatures: [
      {
        name: 'Goblin Scout',
        hp: 7,
        maxHp: 15,
        attackBonus: 4,
        damage: '1d6+2',
        id: 'c1',
        ac: 12,
        position: { x: 0, y: 0, z: 0 },
        type: 'monster',
      },
      {
        name: 'Dire Wolf',
        hp: 22,
        maxHp: 37,
        attackBonus: 5,
        damage: '2d6+3',
        id: 'c2',
        ac: 14,
        position: { x: 0, y: 0, z: 0 },
        type: 'monster',
      },
    ],
  },
};

export const FullPartyWithEnemies: Story = {
  args: {
    players: [
      createPlayer({
        id: 'p1',
        character: {
          ...createPlayer({}).character,
          name: 'Elara',
          race: 'Elf',
          characterClass: 'Wizard',
          hp: 18,
          maxHp: 24,
          armorClass: 13,
        } as any,
        action: 'I prepare a fireball spell',
      }),
      createPlayer({
        id: 'p2',
        character: {
          ...createPlayer({}).character,
          name: 'Thrain',
          race: 'Dwarf',
          characterClass: 'Fighter',
          hp: 32,
          maxHp: 32,
          armorClass: 18,
        } as any,
        action: null,
      }),
      createPlayer({
        id: 'p3',
        character: {
          ...createPlayer({}).character,
          name: 'Luna',
          race: 'Half-Elf',
          characterClass: 'Rogue',
          hp: 20,
          maxHp: 24,
          armorClass: 15,
        } as any,
        action: 'I scout ahead',
      }),
    ],
    creatures: [
      {
        name: 'Goblin King',
        hp: 45,
        maxHp: 45,
        attackBonus: 6,
        damage: '2d6+3',
        id: 'c3',
        ac: 15,
        position: { x: 0, y: 0, z: 0 },
        type: 'monster',
      },
      {
        name: 'Goblin Warrior',
        hp: 12,
        maxHp: 15,
        attackBonus: 4,
        damage: '1d6+2',
        id: 'c4',
        ac: 13,
        position: { x: 0, y: 0, z: 0 },
        type: 'monster',
      },
      {
        name: 'Goblin Warrior',
        hp: 8,
        maxHp: 15,
        attackBonus: 4,
        damage: '1d6+2',
        id: 'c5',
        ac: 13,
        position: { x: 0, y: 0, z: 0 },
        type: 'monster',
      },
    ],
  },
};

export const WoundedParty: Story = {
  args: {
    players: [
      createPlayer({
        character: { ...createPlayer({}).character, hp: 5, maxHp: 32 } as any,
      }),
      createPlayer({
        id: 'p2',
        character: { ...createPlayer({}).character, name: 'Wounded Wizard', hp: 2, maxHp: 18 } as any,
      }),
    ],
    creatures: [],
  },
};
