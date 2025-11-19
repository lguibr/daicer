/**
 * CharacterCreation Storybook Stories
 * Full character creation wizard with all steps
 */

import type { Meta, StoryObj } from '@storybook/react';
import { CharacterCreation } from './CharacterCreation';

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
  id: 'story-room-1',
  code: 'STORY',
  theme: 'High Fantasy',
  dmUserId: 'dm-user-1',
  phase: 'CHARACTER_CREATION' as const,
  players: [],
  world: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const Default: Story = {
  args: {
    room: mockRoom,
  },
};

export const WithExistingPlayers: Story = {
  args: {
    room: {
      ...mockRoom,
      players: [
        {
          id: 'player-1',
          userId: 'user-1',
          name: 'Thorin Oakenshield',
          race: 'dwarf',
          class: 'fighter',
          isReady: true,
          attributes: {
            strength: 16,
            dexterity: 12,
            constitution: 15,
            intelligence: 10,
            wisdom: 11,
            charisma: 8,
          },
          position: { x: 0, y: 0, z: 0 },
          hp: { current: 30, max: 30 },
          ac: 16,
          speed: 25,
          initiative: 1,
          level: 1,
          experiencePoints: 0,
        },
      ],
    },
  },
};
export { default } from './CharacterCreation';
