/**
 * @file frontend/src/components/combat/CharacterCard.stories.tsx
 * @note Update README.md when adding new variants or significant examples
 */

import type { Meta, StoryObj } from '@storybook/react';
import { CharacterCard } from './CharacterCard';
import type { CombatCharacter } from '../../types/combat';

const baseCharacter: CombatCharacter = {
  id: 'char-1',
  name: 'Warrior',
  hp: 35,
  maxHp: 50,
  tempHp: 0,
  armorClass: 16,
  position: { x: 2, y: 3 },
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
};

const meta = {
  title: 'Combat/CharacterCard',
  component: CharacterCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onClick: () => {},
  },
  argTypes: {
    onClick: { action: 'clicked' },
  },
} satisfies Meta<typeof CharacterCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Player: Story = {
  args: {
    character: baseCharacter,
    isActive: false,
    isSelected: false,
  },
};

export const Enemy: Story = {
  args: {
    character: {
      ...baseCharacter,
      name: 'Goblin',
      isPlayer: false,
      hp: 15,
      maxHp: 20,
    },
    isActive: false,
    isSelected: false,
  },
};

export const Active: Story = {
  args: {
    character: baseCharacter,
    isActive: true,
    isSelected: false,
  },
};

export const Selected: Story = {
  args: {
    character: baseCharacter,
    isActive: false,
    isSelected: true,
  },
};

export const ActiveAndSelected: Story = {
  args: {
    character: baseCharacter,
    isActive: true,
    isSelected: true,
  },
};

export const HealthyHP: Story = {
  args: {
    character: {
      ...baseCharacter,
      hp: 45,
      maxHp: 50,
    },
    isActive: false,
    isSelected: false,
  },
};

export const ModerateHP: Story = {
  args: {
    character: {
      ...baseCharacter,
      hp: 25,
      maxHp: 50,
    },
    isActive: false,
    isSelected: false,
  },
};

export const LowHP: Story = {
  args: {
    character: {
      ...baseCharacter,
      hp: 10,
      maxHp: 50,
    },
    isActive: false,
    isSelected: false,
  },
};

export const Unconscious: Story = {
  args: {
    character: {
      ...baseCharacter,
      hp: 0,
      maxHp: 50,
    },
    isActive: false,
    isSelected: false,
  },
};

export const WithTempHP: Story = {
  args: {
    character: {
      ...baseCharacter,
      tempHp: 10,
    },
    isActive: false,
    isSelected: false,
  },
};

export const HasMoved: Story = {
  args: {
    character: {
      ...baseCharacter,
      hasMoved: true,
    },
    isActive: true,
    isSelected: false,
  },
};

export const HasActed: Story = {
  args: {
    character: {
      ...baseCharacter,
      hasActed: true,
    },
    isActive: true,
    isSelected: false,
  },
};

export const TurnComplete: Story = {
  args: {
    character: {
      ...baseCharacter,
      hasMoved: true,
      hasActed: true,
    },
    isActive: true,
    isSelected: false,
  },
};

export const WithConditions: Story = {
  args: {
    character: {
      ...baseCharacter,
      conditions: [{ type: 'poisoned' }, { type: 'frightened', level: 2 }, { type: 'restrained' }],
    },
    isActive: false,
    isSelected: false,
  },
};

export const MultipleSituations: Story = {
  args: {
    character: baseCharacter,
    isActive: false,
    isSelected: false,
  },
  render: () => (
    <div className="grid grid-cols-2 gap-4 p-4">
      <CharacterCard
        character={{ ...baseCharacter, name: 'Healthy Fighter' }}
        isActive={false}
        isSelected={false}
        onClick={() => {}}
      />
      <CharacterCard
        character={{ ...baseCharacter, name: 'Active Wizard', hp: 20 }}
        isActive
        isSelected={false}
        onClick={() => {}}
      />
      <CharacterCard
        character={{
          ...baseCharacter,
          name: 'Goblin Scout',
          isPlayer: false,
          hp: 8,
          maxHp: 15,
        }}
        isActive={false}
        isSelected
        onClick={() => {}}
      />
      <CharacterCard
        character={{
          ...baseCharacter,
          name: 'Rogue',
          hp: 5,
          conditions: [{ type: 'poisoned' }],
        }}
        isActive={false}
        isSelected={false}
        onClick={() => {}}
      />
    </div>
  ),
};
