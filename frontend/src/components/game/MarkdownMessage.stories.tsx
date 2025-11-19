/**
 * @file frontend/src/components/game/MarkdownMessage.stories.tsx
 * @note Update README.md when adding new variants or significant examples
 */

import type { Meta, StoryObj } from '@storybook/react';
import MarkdownMessage from './MarkdownMessage';

const meta = {
  title: 'Game/MarkdownMessage',
  component: MarkdownMessage,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="bg-zinc-800 p-4 rounded">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MarkdownMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PlainText: Story = {
  args: {
    content: 'You enter a dark room. The air is cold and musty.',
  },
};

export const WithBold: Story = {
  args: {
    content: 'You find a **legendary sword** glowing with power!',
  },
};

export const WithHeaders: Story = {
  args: {
    content: `
# The Dragon's Lair

## Description
You stand before a massive cavern entrance.

### What you notice
Ancient claw marks score the walls.
    `.trim(),
  },
};

export const WithLists: Story = {
  args: {
    content: `
Your inventory:
- Longsword (+1)
- Shield of Faith
- 3 Health Potions
- Rope (50 ft)

Quest objectives:
1. Find the lost artifact
2. Defeat the guardian
3. Return to the village
    `.trim(),
  },
};

export const WithQuotes: Story = {
  args: {
    content: `
The old wizard speaks:

> "Beware the shadows that move in the night.  
> They hunger for more than just light."

His warning echoes in your mind.
    `.trim(),
  },
};

export const CombatDescription: Story = {
  args: {
    content: `
The goblin swings its rusty blade at you!

**Attack Roll:** 15 + 4 = **19** (Hit!)  
**Damage:** 1d6 + 2 = **7 slashing damage**

You feel the blade bite into your shoulder!
    `.trim(),
  },
};

export const ComplexNarrative: Story = {
  args: {
    content: `
# The Enchanted Forest

As you venture deeper into the woods, you notice:

## Immediate Surroundings
- **Bioluminescent mushrooms** casting an eerie glow
- A *gentle mist* rolling along the ground
- Strange **runes** carved into tree bark

## Sounds
You hear:
1. Distant howling
2. Rustling leaves
3. An otherworldly melody

> The forest seems alive with ancient magic...

---

*What do you do?*
    `.trim(),
  },
};

export const WithCode: Story = {
  args: {
    content: 'The scroll contains a spell: `Fireball` dealing 8d6 fire damage.',
  },
};

export const Table: Story = {
  args: {
    content: `
| Character | HP | AC | Status |
|-----------|----|----|---------|
| Fighter | 35/50 | 18 | Healthy |
| Wizard | 12/24 | 13 | Wounded |
| Rogue | 28/28 | 15 | Healthy |
    `.trim(),
  },
};
