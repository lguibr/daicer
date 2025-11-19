/**
 * @file frontend/src/components/ui/combobox.stories.tsx
 */

import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { Castle, Compass, Map as MapIcon, Sparkles } from 'lucide-react';

import { Combobox } from './combobox';

const arenaOptions = [
  {
    value: 'sky-citadel',
    label: 'Sky Citadel',
    description: 'Floating bastion with shifting bridges',
    badge: '18×18',
    icon: <Castle className="h-4 w-4" />,
  },
  {
    value: 'crystal-descent',
    label: 'Crystal Descent',
    description: 'Fractured caverns wrapped in aurora light',
    badge: '16×20',
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    value: 'ashen-gulf',
    label: 'Ashen Gulf',
    description: 'Molten shoreline with dangerous ridges',
    badge: '20×12',
    icon: <MapIcon className="h-4 w-4" />,
  },
];

const travelOptions = [
  {
    value: 'north',
    label: 'Northern Passage',
    description: 'Expedite route through the Veilwatch',
    icon: <Compass className="h-4 w-4" />,
  },
  {
    value: 'south',
    label: 'Southern Expanse',
    description: 'Sunlit caravans bordering the ember dunes',
    icon: <Compass className="h-4 w-4" />,
  },
];

const meta = {
  title: 'UI/Combobox',
  component: Combobox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    allowDeselect: {
      control: 'boolean',
    },
    placeholder: {
      control: 'text',
    },
    clearLabel: {
      control: 'text',
    },
  },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    options: arenaOptions,
    placeholder: 'Select arena...',
    searchPlaceholder: 'Search arenas...',
    value: null,
    onValueChange: () => {},
  },
  render: (args) => {
    const [value, setValue] = React.useState<string | null>(null);
    return (
      <div className="w-72">
        <Combobox {...args} value={value} onValueChange={setValue} />
      </div>
    );
  },
};

export const WithoutDeselect: Story = {
  args: {
    options: travelOptions,
    placeholder: 'Choose route...',
    allowDeselect: false,
    searchPlaceholder: 'Filter routes...',
    value: null,
    onValueChange: () => {},
  },
  render: (args) => {
    const [value, setValue] = React.useState<string | null>('north');
    return (
      <div className="w-72">
        <Combobox {...args} value={value} onValueChange={setValue} />
      </div>
    );
  },
};
