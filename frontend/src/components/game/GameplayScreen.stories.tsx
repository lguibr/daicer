/**
 * @file frontend/src/components/game/GameplayScreen.stories.tsx
 * @note Update README.md when adding new variants or significant examples
 */

import type { Meta, StoryObj } from '@storybook/react';
import GameplayScreen from './GameplayScreen';

const meta = {
  title: 'Game/GameplayScreen',
  component: GameplayScreen,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GameplayScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

// Note: This component requires useAuth and useSocket hooks
// These stories demonstrate the component structure but may not be fully functional
// in isolation. For full functionality, use the actual app with proper context.

const mockRoom = {
  id: 'room-1',
  code: 'ABC123',
  ownerId: 'user-1',
  phase: 'GAMEPLAY' as const,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  worldDescription: 'A mystical forest',
  settings: {
    language: 'en',
    difficulty: 'medium',
  },
};

const mockPlayers = [
  {
    id: 'player-1',
    userId: 'user-1',
    name: 'Alice',
    character: {
      name: 'Elara',
      race: 'Elf',
      characterClass: 'Wizard',
      level: 1,
      hp: 10,
      maxHp: 10,
      armorClass: 12,
      attributes: {
        Strength: 8,
        Dexterity: 14,
        Constitution: 12,
        Intelligence: 16,
        Wisdom: 12,
        Charisma: 10,
      },
      skills: {},
      alignment: 'Neutral Good',
      background: 'Sage',
    },
    action: null,
  },
] as unknown as Player[];

export const Default: Story = {
  args: {
    room: mockRoom,
    players: mockPlayers,
  },
};
