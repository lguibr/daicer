/**
 * @file frontend/src/components/game/GameplayScreen.stories.tsx
 * @note Update README.md when adding new variants or significant examples
 */

import type { Meta, StoryObj } from '@storybook/react';
import GameplayScreen from './GameplayScreen';
import type { Player, Room, WorldSettings, CharacterSheet } from '../../types/shared';
import { GamePhase } from '../../types/shared';
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

const mockWorldSettings: WorldSettings = {
  worldType: 'terra',
  worldSize: 'medium',
  theme: 'Mystical Forest',
  setting: 'Ancient glades and hidden ruins',
  tone: 'Hopeful with hints of mystery',
  worldBackground: 'The Verdant Expanse thrives under ancient druidic wards now fading.',
  dmStyle: {
    verbosity: 2,
    detail: 3,
    engagement: 3,
    narrative: 2,
    specialMode: null,
    customDirectives: '',
  },
  dmSystemPrompt: 'Maintain cooperative storytelling with thoughtful pacing.',
  playerCount: 4,
  adventureLength: 'medium',
  difficulty: 'medium',
  startingLevel: 1,
  attributePointBudget: 27,
  language: 'en',
};

const mockRoom: Room = {
  id: 'room-1',
  code: 'ABC123',
  ownerId: 'user-1',
  phase: GamePhase.GAMEPLAY,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  worldDescription: 'A mystical forest',
  settings: mockWorldSettings,
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

const mockPlayers: Player[] = [
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
