/**
 * @file frontend/src/components/game/ChatArea.stories.tsx
 * @note Update README.md when adding new variants or significant examples
 */

import type { Meta, StoryObj } from '@storybook/react';
import ChatArea from './ChatArea';
import type { Message } from '../../types/shared';

const meta = {
  title: 'Game/ChatArea',
  component: ChatArea,
  args: {
    isProcessing: false,
    messages: [],
    worldDescription: '',
  },
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="h-[600px] bg-midnight-900">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const createMessage = (overrides: Partial<Message>): Message => ({
  id: `msg-${Date.now()}`,
  sender: 'DM',
  text: 'Message content',
  timestamp: Date.now(),
  ...overrides,
});

export const Empty: Story = {
  args: {
    messages: [],
    worldDescription: '',
  },
};

export const WithWorldDescription: Story = {
  args: {
    messages: [],
    worldDescription: `
# The Forgotten Realm

A vast, mystical forest stretches before you. Ancient trees tower overhead, their branches forming a dense canopy that filters the sunlight into dappled patterns on the forest floor. The air is thick with the scent of moss and wildflowers.

In the distance, you can hear the gentle babbling of a stream and the occasional call of exotic birds.
    `.trim(),
  },
};

export const SimpleConversation: Story = {
  args: {
    messages: [
      createMessage({
        id: 'msg-1',
        sender: 'DM',
        text: 'Welcome, adventurers! You find yourselves at the entrance of an ancient dungeon.',
        timestamp: Date.now() - 30000,
      }),
      createMessage({
        id: 'msg-2',
        sender: 'Elara',
        text: 'I cast Light on my staff to illuminate the entrance.',
        timestamp: Date.now() - 20000,
      }),
      createMessage({
        id: 'msg-3',
        sender: 'DM',
        text: 'The entrance glows with magical light, revealing **stone walls covered in mysterious runes**.',
        timestamp: Date.now() - 10000,
      }),
    ],
    worldDescription: '',
  },
};

export const WithPrivateMessages: Story = {
  args: {
    messages: [
      createMessage({
        id: 'msg-1',
        sender: 'DM',
        text: 'The party enters the throne room.',
      }),
      createMessage({
        id: 'msg-2',
        sender: 'DM',
        text: '*As a rogue, you notice a hidden switch behind the tapestry.*',
        recipientId: 'user-1',
      }),
      createMessage({
        id: 'msg-3',
        sender: 'Rogue',
        text: 'I examine the tapestry carefully.',
      }),
    ],
    worldDescription: '',
  },
};

export const CombatNarrative: Story = {
  args: {
    messages: [
      createMessage({
        id: 'msg-1',
        sender: 'DM',
        text: '**Combat begins!** Three goblins emerge from the shadows, weapons drawn.',
      }),
      createMessage({
        id: 'msg-2',
        sender: 'Fighter',
        text: 'I charge the nearest goblin with my sword!',
      }),
      createMessage({
        id: 'msg-3',
        sender: 'DM',
        text: 'You strike true! Your blade cuts through the goblin for **12 damage**. It staggers backward, wounded but still standing.',
      }),
      createMessage({
        id: 'msg-4',
        sender: 'Wizard',
        text: 'I cast Magic Missile at the wounded goblin!',
      }),
      createMessage({
        id: 'msg-5',
        sender: 'DM',
        text: 'Three glowing darts of force streak toward the goblin, each dealing **4 damage**. The goblin collapses, defeated!',
      }),
    ],
    worldDescription: '',
  },
};

export const WithImages: Story = {
  args: {
    messages: [
      createMessage({
        id: 'msg-1',
        sender: 'DM',
        text: 'You enter a grand hall adorned with ancient murals:',
        images: ['iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='],
      }),
    ],
    worldDescription: '',
  },
};

export const RichMarkdown: Story = {
  args: {
    messages: [
      createMessage({
        id: 'msg-1',
        sender: 'DM',
        text: `
# The Ancient Library

You discover a vast library filled with **knowledge from ages past**.

## What you see:
- Rows of towering bookshelves
- Ancient scrolls sealed with *mystical symbols*
- A reading desk with an open tome
- Dust particles dancing in the light

> "Those who seek knowledge must first seek understanding."  
> — Inscription above the door

You may:
1. Search for specific books
2. Examine the open tome
3. Investigate the sealed scrolls
        `.trim(),
      }),
    ],
    worldDescription: '',
  },
};

export const LongConversation: Story = {
  args: {
    messages: Array.from({ length: 20 }, (_, i) =>
      createMessage({
        id: `msg-${i}`,
        sender: i % 3 === 0 ? 'DM' : i % 3 === 1 ? 'Player 1' : 'Player 2',
        text: `Message ${i + 1}: ${i % 3 === 0 ? 'The DM describes the scene...' : 'A player takes an action.'}`,
        timestamp: Date.now() - (20 - i) * 5000,
      })
    ),
    worldDescription: 'A mysterious dungeon complex',
  },
};
