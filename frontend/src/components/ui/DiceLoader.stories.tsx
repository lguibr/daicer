import type { Meta, StoryObj } from '@storybook/react';

import { DiceLoader } from './dice-loader';

const meta: Meta<typeof DiceLoader> = {
  title: 'Dice/Loader',
  component: DiceLoader,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1a1a1a' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    dieType: {
      control: 'select',
      options: [2, 4, 6, 8, 10, 12, 20, '20-ai'],
    },
    visualStyle: {
      control: 'select',
      options: ['standard', 'acrylic', 'metallic', 'glowing', 'stone'],
    },
    color: { control: 'color' },
    showAxes: { control: 'boolean' },
    message: { control: 'text' },
    diceCount: { control: 'number', min: 1, max: 6 },
  },
};

export default meta;

type Story = StoryObj<typeof DiceLoader>;

export const Default: Story = {
  args: {
    size: 'medium',
    message: undefined,
  },
};

export const Interactive: Story = {
  args: {
    size: 'medium',
    dieType: 20,
    visualStyle: 'acrylic',
    color: '#38bdf8',
    diceCount: 1,
  },
};

export const WithMessage: Story = {
  args: {
    size: 'medium',
    message: 'Rolling the dice of destiny...',
    diceCount: 3,
  },
};

export const MultipleDiceRandomStyles: Story = {
  args: {
    size: 'medium',
    diceCount: 5,
  },
};

export const SingleDie: Story = {
  args: {
    size: 'large',
    dieType: 20,
    visualStyle: 'glowing',
    color: '#4ade80',
    diceCount: 1,
  },
};

export const SmallSize: Story = {
  args: {
    size: 'small',
    diceCount: 3,
  },
};

export const MediumSize: Story = {
  args: {
    size: 'medium',
    diceCount: 3,
  },
};

export const LargeSize: Story = {
  args: {
    size: 'large',
    diceCount: 3,
  },
};

export const DebugAxes: Story = {
  args: {
    dieType: 12,
    visualStyle: 'standard',
    size: 'medium',
    showAxes: true,
    diceCount: 1,
  },
};
