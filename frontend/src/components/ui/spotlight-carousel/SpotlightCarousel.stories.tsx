import type { Meta, StoryObj } from '@storybook/react';
import { Compass, DoorOpen, ScrollText } from 'lucide-react';

import { DiceLoader } from '../dice-loader';
import { SpotlightCarousel } from './SpotlightCarousel';

const meta: Meta<typeof SpotlightCarousel> = {
  title: 'UI/SpotlightCarousel',
  component: SpotlightCarousel,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    className: { control: false },
    items: { control: false },
    renderItem: { control: false },
  },
};

export default meta;

type Story = StoryObj<typeof SpotlightCarousel>;

const demoItems = [
  {
    id: 'assemble',
    badge: 'I',
    eyebrow: 'Rally the party',
    title: 'Gather your adventurers',
    description: 'Ensure every hero arrives equipped, signed in, and ready for the next chapter of the saga.',
    icon: <Compass className="h-6 w-6" aria-hidden="true" />,
    media: <DiceLoader size="large" diceCount={3} />,
  },
  {
    id: 'sigil',
    badge: 'II',
    eyebrow: 'Secure the sigil',
    title: 'Retrieve the invite code',
    description: 'Consult your Dungeon Master or lobby roster for the six-rune key that unlocks the sanctum of play.',
    icon: <ScrollText className="h-6 w-6" aria-hidden="true" />,
    media: <DiceLoader size="large" diceCount={2} dieType={12} />,
  },
  {
    id: 'veil',
    badge: 'III',
    eyebrow: 'Step through the veil',
    title: 'Enter the sanctum',
    description: 'Submit the sigil, confirm your character, and dive back into the unfolding encounter.',
    icon: <DoorOpen className="h-6 w-6" aria-hidden="true" />,
    media: <DiceLoader size="large" diceCount={1} dieType={20} />,
  },
];

export const Default: Story = {
  args: {
    items: demoItems,
  },
};

export const Stacked: Story = {
  args: {
    items: demoItems,
    layout: 'stacked',
    size: 'lg',
  },
};
