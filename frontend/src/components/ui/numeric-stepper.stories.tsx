import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import NumericStepper, { type NumericStepperProps } from './NumericStepper';

const meta: Meta<typeof NumericStepper> = {
  title: 'UI/NumericStepper',
  component: NumericStepper,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onChange: { control: false },
    value: { control: { type: 'number' } },
  },
  args: {
    min: 0,
    max: 12,
    step: 1,
  },
};

export default meta;

type Story = StoryObj<typeof NumericStepper>;

function StatefulStepper({ value: initialValue = 0, onChange, ...rest }: NumericStepperProps) {
  const [value, setValue] = useState<number>(initialValue);

  return (
    <NumericStepper
      {...rest}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

export const Basic: Story = {
  render: (args) => <StatefulStepper {...args} />,
  args: {
    value: 4,
    decreaseLabel: 'Decrease count',
    increaseLabel: 'Increase count',
  },
};

export const MobileFriendly: Story = {
  render: (args) => (
    <div className="max-w-xs">
      <StatefulStepper {...args} />
    </div>
  ),
  args: {
    value: 10,
    min: 1,
    max: 20,
    step: 1,
  },
};

export const Constrained: Story = {
  render: (args) => <StatefulStepper {...args} />,
  args: {
    value: 2,
    min: 2,
    max: 5,
    step: 1,
  },
};
