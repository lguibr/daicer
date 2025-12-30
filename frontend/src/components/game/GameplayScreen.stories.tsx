/**
 * @file frontend/src/components/game/GameplayScreen.stories.tsx
 * @note Update README.md when adding new variants or significant examples
 */

import type { Meta, StoryObj } from '@storybook/react';
import type { Room, CharacterSheet } from '@daicer/engine';
import { GamePhase } from '@daicer/engine';
import GameplayScreen from './GameplayScreen';
import { NEW_CHARACTER_TEMPLATE } from '../../constants';

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

const mockRoom: Room = {
  documentId: 'room-1',
  roomId: 'TEST',
  id: 'room-1',
  code: 'TEST',
  ownerId: 'user-1',
  settings: null,
  worldDescription: 'A test world',
  phase: GamePhase.GAMEPLAY,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isActive: true,
  structures: [],
};

const mockCharacter: CharacterSheet = {
  ...NEW_CHARACTER_TEMPLATE,
  name: 'Elara',
  race: 'Elf',
  characterClass: 'Wizard',
  alignment: 'Neutral Good',
  appearance: {
    ...NEW_CHARACTER_TEMPLATE.appearance,
    description: 'Graceful elf with luminous tattoos that glow when spellcasting.',
  },
  personality: {
    traits: 'Curious and thoughtful',
    ideals: 'Knowledge and compassion',
    bonds: 'Bound to protect her companions',
    flaws: 'Overthinks critical moments',
  },
  backstory: 'Once an apprentice to a reclusive archmage, Elara seeks lost reliquaries.',
};

// @ts-ignore
const mockPlayers: any[] = [
  {
    id: 'player-1',
    userId: 'user-1',
    name: 'Alice',
    character: {
      ...mockCharacter,
      armorClass: 12,
      hp: 10,
      maxHp: 10,
      attributes: {
        ...mockCharacter.attributes,
        Strength: 8,
        Dexterity: 14,
        Constitution: 12,
        Intelligence: 16,
        Wisdom: 12,
        Charisma: 10,
      },
    },
    action: null,
    isReady: true,
    joinedAt: Date.now(),
  },
];

export const Default: Story = {
  args: {
    room: mockRoom,
    players: mockPlayers,
  },
};
