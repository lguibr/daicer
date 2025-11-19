import type { Meta, StoryObj } from '@storybook/react';
import { RandomItem } from './RandomItem';

const meta = {
  title: 'UI/RandomItem',
  component: RandomItem,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RandomItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic usage with translation keys. Randomizes once on mount.
 */
export const WithTranslationKeys: Story = {
  args: {
    itemKeys: [
      'diceLoader.messages.summoning',
      'diceLoader.messages.rattling',
      'diceLoader.messages.focusing',
      'diceLoader.messages.calibrating',
    ],
  },
};

/**
 * Using pre-translated strings. Perfect for non-i18n text.
 */
export const WithStrings: Story = {
  args: {
    items: [
      'The dungeon echoes with ancient whispers...',
      'A chill runs down your spine...',
      'You sense danger nearby...',
      'Something stirs in the darkness...',
    ],
  },
};

/**
 * Using React components for rich content.
 */
export const WithComponents: Story = {
  args: {
    items: [
      <div className="rounded-lg bg-green-500/20 border border-green-500 p-4 text-green-100">✓ Critical hit!</div>,
      <div className="rounded-lg bg-blue-500/20 border border-blue-500 p-4 text-blue-100">💫 Massive damage!</div>,
      <div className="rounded-lg bg-purple-500/20 border border-purple-500 p-4 text-purple-100">
        ⚔️ Devastating blow!
      </div>,
    ],
  },
};

/**
 * Mixed content with different elements.
 */
export const MixedContent: Story = {
  args: {
    items: [
      'Simple text message',
      <strong>Bold announcement!</strong>,
      <span className="text-cyan-400 italic">Magical whisper...</span>,
      <div className="flex gap-2 items-center">
        <span className="text-2xl">🎲</span>
        <span>The dice have spoken!</span>
      </div>,
    ],
  },
};

/**
 * Game status messages using translation keys.
 */
export const GameplayMessages: Story = {
  args: {
    itemKeys: [
      'gameplay.adventureBegins',
      'gameplay.yourTurn',
      'gameplay.actionSubmitted',
      'gameplay.waitingForOthers',
    ],
  },
};

/**
 * Common status messages.
 */
export const CommonMessages: Story = {
  args: {
    itemKeys: ['common.loading', 'common.error', 'common.retry'],
  },
};
