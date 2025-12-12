/**
 * CharacterCreation Storybook Stories
 * Full character creation wizard with all steps
 */

import type { Meta, StoryObj } from '@storybook/react';
import CharacterCreation from './CharacterCreation';

import { GamePhase } from '../../types/shared';

const meta = {
  title: 'Forms/CharacterCreation',
  component: CharacterCreation,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CharacterCreation>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock room data
const mockRoom = {
  documentId: 'room-1',
  roomId: 'TEST',
  id: 'room-1',
  code: 'TEST',
  theme: 'High Fantasy',
  dmUserId: 'dm-user-1',
  phase: GamePhase.CHARACTER_CREATION,
  players: [],
  world: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ownerId: 'user-1',
  settings: null,
  worldDescription: 'Test World',
  isActive: true,
};

export const Default: Story = {
  args: {
    room: {
      ...mockRoom,
    },
  },
};

export const WithExistingPlayers: Story = {
  args: {
    room: {
      ...mockRoom,
    },
    players: [
      {
        id: 'player-1',
        userId: 'user-1',
        name: 'Thorin Oakenshield',
        isReady: true,
        position: { x: 0, y: 0, z: 0 },
        character: {
          name: 'Thorin Oakenshield',
          race: 'dwarf',
          characterClass: 'fighter',
          alignment: 'Lawful Good',
          attributes: {
            Strength: 16,
            Dexterity: 12,
            Constitution: 15,
            Intelligence: 10,
            Wisdom: 11,
            Charisma: 8,
          },
          hp: 30,
          maxHp: 30,
          armorClass: 16,
          speed: 25,
          initiative: 1,
          level: 1,
          experiencePoints: 0,
        },
      } as any, // Cast to any to avoid full Player shape requirement
    ],
  },
};
