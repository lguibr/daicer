/**
 * Storybook stories for StreamingChatArea
 */

import type { Meta, StoryObj } from '@storybook/react';
import StreamingChatArea from './StreamingChatArea';
import type { Message } from '../../types/shared';

const meta: Meta<typeof StreamingChatArea> = {
  title: 'Chat/StreamingChatArea',
  component: StreamingChatArea,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0a0e1a' }],
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StreamingChatArea>;

const mockMessages: Message[] = [
  {
    id: 'msg-1',
    sender: 'DM',
    text: '**The Rusty Tankard Tavern**\n\nYou push open the heavy oak door and step into the warm, smoky interior of the tavern. The scent of roasted meat and spilled ale fills your nostrils. A bard strums a lute in the corner, and the low murmur of conversation fills the air.',
    content:
      '**The Rusty Tankard Tavern**\n\nYou push open the heavy oak door and step into the warm, smoky interior of the tavern. The scent of roasted meat and spilled ale fills your nostrils. A bard strums a lute in the corner, and the low murmur of conversation fills the air.',
    timestamp: Date.now() - 300000,
  },
  {
    id: 'msg-2',
    sender: 'Alice the Brave',
    text: 'I approach the bar and order an ale, keeping my eyes on the shadowy figures in the corner.',
    content: 'I approach the bar and order an ale, keeping my eyes on the shadowy figures in the corner.',
    timestamp: Date.now() - 240000,
  },
  {
    id: 'msg-3',
    sender: 'DM',
    text: 'The bartender, a grizzled dwarf with a magnificent beard, slides a foaming tankard your way. "That\'ll be 2 copper," he grunts. The figures in the corner seem to be watching you, their faces hidden beneath dark hoods.',
    content:
      'The bartender, a grizzled dwarf with a magnificent beard, slides a foaming tankard your way. "That\'ll be 2 copper," he grunts. The figures in the corner seem to be watching you, their faces hidden beneath dark hoods.',
    timestamp: Date.now() - 180000,
    recipientId: 'alice-id',
  },
  {
    id: 'msg-4',
    sender: 'Bob the Wizard',
    text: "I cast Detect Magic to see if there's anything unusual about those hooded figures.",
    content: "I cast Detect Magic to see if there's anything unusual about those hooded figures.",
    timestamp: Date.now() - 120000,
  },
];

const worldDescription = `# The Kingdom of Eldermar

A land of ancient forests and towering mountains, where magic flows through the very stones. The kingdom has known peace for a generation, but dark omens suggest that change is coming.

> "In the shadow of the mountain, where the old gods sleep, a new power awakens."
> *— The Prophecy of Shadows*`;

export const Default: Story = {
  args: {
    messages: mockMessages,
    streamingMessages: new Map(),
    worldDescription,
    isProcessing: false,
    presence: [],
  },
};

export const WithStreaming: Story = {
  args: {
    messages: mockMessages,
    streamingMessages: new Map([
      [
        'msg-streaming',
        'Your Detect Magic spell reveals a faint purple aura surrounding the hooded figures. The aura pulses with an unnatural rhythm...',
      ],
    ]),
    worldDescription,
    isProcessing: false,
    presence: [],
  },
};

export const DMThinking: Story = {
  args: {
    messages: mockMessages,
    streamingMessages: new Map(),
    worldDescription,
    isProcessing: true,
    presence: [
      {
        userId: 'dm-system',
        userName: 'DM',
        type: 'generating',
        timestamp: Date.now(),
        metadata: {
          message: 'DM is crafting the next scene...',
        },
      },
    ],
  },
};

export const ToolExecution: Story = {
  args: {
    messages: mockMessages,
    streamingMessages: new Map(),
    worldDescription,
    isProcessing: false,
    presence: [
      {
        userId: 'dm-system',
        userName: 'DM',
        type: 'tool_executing',
        timestamp: Date.now(),
        metadata: {
          toolName: 'roll_dice',
          message: 'Rolling initiative...',
          progress: 65,
        },
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    messages: [],
    streamingMessages: new Map(),
    worldDescription,
    isProcessing: false,
    presence: [],
  },
};

export const LongConversation: Story = {
  args: {
    messages: [
      ...mockMessages,
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `extra-${i}`,
        sender: i % 2 === 0 ? 'DM' : 'Alice the Brave',
        text: i % 2 === 0 ? `The DM narrates scene ${i + 1} with vivid detail...` : `Alice responds to scene ${i + 1}`,
        content:
          i % 2 === 0 ? `The DM narrates scene ${i + 1} with vivid detail...` : `Alice responds to scene ${i + 1}`,
        timestamp: Date.now() - 60000 * (10 - i),
      })),
    ],
    streamingMessages: new Map(),
    worldDescription,
    isProcessing: false,
    presence: [],
  },
};

export const WithPrivateMessages: Story = {
  args: {
    messages: [
      ...mockMessages,
      {
        id: 'private-1',
        sender: 'DM',
        text: "🔒 You notice a glint of gold in the bartender's pocket. He seems nervous.",
        content: "🔒 You notice a glint of gold in the bartender's pocket. He seems nervous.",
        timestamp: Date.now() - 60000,
        recipientId: 'current-user',
      },
    ],
    streamingMessages: new Map(),
    worldDescription,
    isProcessing: false,
    presence: [],
  },
};

export const MultipleTyping: Story = {
  args: {
    messages: mockMessages,
    streamingMessages: new Map(),
    worldDescription,
    isProcessing: false,
    presence: [
      {
        userId: 'player-1',
        userName: 'Alice',
        type: 'typing',
        timestamp: Date.now(),
      },
      {
        userId: 'player-2',
        userName: 'Bob',
        type: 'typing',
        timestamp: Date.now(),
      },
    ],
  },
};
