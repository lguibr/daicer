import type { Meta, StoryObj } from '@storybook/react';

import { DiceLoader } from './dice-loader';

const meta: Meta<typeof DiceLoader> = {
  title: 'UI/DiceLoader',
  component: DiceLoader,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    dieType: {
      control: 'select',
      options: [2, 4, 6, 8, 10, 12, 20],
    },
    color: { control: 'color' },
    showAxes: { control: 'boolean' },
    message: { control: 'text' },
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

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
      <DiceLoader {...args} size="small" />
      <DiceLoader {...args} size="medium" />
      <DiceLoader {...args} size="large" />
    </div>
  ),
  args: {
    dieType: 20,
  },
};

export const DebugAxes: Story = {
  args: {
    dieType: 12,
    size: 'medium',
    showAxes: true,
  },
};
