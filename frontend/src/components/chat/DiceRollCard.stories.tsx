/**
 * Storybook stories for DiceRollCard
 */

import type { Meta, StoryObj } from '@storybook/react';
import DiceRollCard from './DiceRollCard';

const meta: Meta<typeof DiceRollCard> = {
  title: 'Chat/DiceRollCard',
  component: DiceRollCard,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0a0e1a' }],
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DiceRollCard>;

export const AttackRoll: Story = {
  args: {
    roll: {
      dice: '1d20+5',
      result: 23,
      breakdown: '[18] + 5',
      purpose: 'Attack Roll',
    },
    animate: false,
  },
};

export const AttackRollAnimated: Story = {
  args: {
    roll: {
      dice: '1d20+5',
      result: 23,
      breakdown: '[18] + 5',
      purpose: 'Attack Roll',
    },
    animate: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Watch the 3D dice spin and land on the exact rolled number with color indicating result quality!',
      },
    },
  },
};

export const CriticalHit: Story = {
  args: {
    roll: {
      dice: '1d20+5',
      result: 25,
      breakdown: '[20] + 5',
      purpose: 'Attack Roll - CRITICAL HIT!',
    },
    animate: true,
  },
  parameters: {
    docs: {
      description: {
        story: '✨ Natural 20! Die turns bright green and sparkles appear.',
      },
    },
  },
};

export const CriticalFail: Story = {
  args: {
    roll: {
      dice: '1d20+5',
      result: 6,
      breakdown: '[1] + 5',
      purpose: 'Attack Roll - CRITICAL FAIL!',
    },
    animate: true,
  },
  parameters: {
    docs: {
      description: {
        story: '💀 Natural 1... the die turns dark red showing the disastrous result.',
      },
    },
  },
};

export const MultipleDice: Story = {
  args: {
    roll: {
      dice: '3d6',
      result: 13,
      breakdown: '[4, 5, 4]',
      purpose: 'Fireball Damage',
    },
    animate: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple d6 dice rolling simultaneously, each showing its rolled value with appropriate color.',
      },
    },
  },
};

export const DamageRoll: Story = {
  args: {
    roll: {
      dice: '2d8+4',
      result: 16,
      breakdown: '[5, 7] + 4',
      purpose: 'Longsword Damage',
    },
    animate: true,
  },
  parameters: {
    docs: {
      description: {
        story: '2d8 damage dice with modifier - each die shows its actual rolled value.',
      },
    },
  },
};

export const LowDamageRoll: Story = {
  args: {
    roll: {
      dice: '2d8+3',
      result: 7,
      breakdown: '[2, 2] + 3',
      purpose: 'Dagger Damage',
    },
    animate: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Low rolls turn red/dark red showing poor damage output.',
      },
    },
  },
};

export const HighDamageRoll: Story = {
  args: {
    roll: {
      dice: '2d8+3',
      result: 19,
      breakdown: '[8, 8] + 3',
      purpose: 'Greatsword Damage',
    },
    animate: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Maximum rolls turn bright green celebrating the excellent damage!',
      },
    },
  },
};

export const D12Damage: Story = {
  args: {
    roll: {
      dice: '1d12+5',
      result: 17,
      breakdown: '[12] + 5',
      purpose: 'Greataxe Critical',
    },
    animate: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'D12 showing maximum roll in vibrant green.',
      },
    },
  },
};

export const D4Healing: Story = {
  args: {
    roll: {
      dice: '1d4+2',
      result: 6,
      breakdown: '[4] + 2',
      purpose: 'Cure Wounds',
    },
    animate: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'D4 healing spell - small but mighty!',
      },
    },
  },
};

export const InitiativeRoll: Story = {
  args: {
    roll: {
      dice: '1d20+2',
      result: 19,
      breakdown: '[17] + 2',
      purpose: 'Initiative',
    },
    animate: true,
  },
};

export const MultipleRolls: Story = {
  render: () => (
    <div className="space-y-4">
      <DiceRollCard
        roll={{
          dice: '1d20+5',
          result: 25,
          breakdown: '[20] + 5',
          purpose: 'Attack Roll - CRITICAL!',
        }}
        animate={false}
      />
      <DiceRollCard
        roll={{
          dice: '2d8+4',
          result: 16,
          breakdown: '[5, 7] + 4',
          purpose: 'Damage Roll',
        }}
        animate={false}
      />
      <DiceRollCard
        roll={{
          dice: '1d20+3',
          result: 17,
          breakdown: '[14] + 3',
          purpose: 'Saving Throw',
        }}
        animate={false}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A sequence of rolls during combat - attack, damage, and saving throw.',
      },
    },
  },
};

export const AnimatedCombatSequence: Story = {
  render: () => (
    <div className="space-y-6">
      <DiceRollCard
        roll={{
          dice: '1d20+5',
          result: 18,
          breakdown: '[13] + 5',
          purpose: 'Attack Roll',
        }}
        animate
      />
      <DiceRollCard
        roll={{
          dice: '2d6+3',
          result: 12,
          breakdown: '[5, 4] + 3',
          purpose: 'Damage',
        }}
        animate
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Watch both dice rolls animate showing exact values with color-coded results!',
      },
    },
  },
};
