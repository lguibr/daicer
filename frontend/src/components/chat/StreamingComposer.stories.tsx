/**
 * Storybook stories for StreamingComposer
 */

import type { Meta, StoryObj } from '@storybook/react';

// @ts-expect-error - Storybook types mismatch with new addon versions
import { action } from '@storybook/addon-actions';
import StreamingComposer from './StreamingComposer';

const meta: Meta<typeof StreamingComposer> = {
  title: 'Chat/StreamingComposer',
  component: StreamingComposer,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0a0e1a' }],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onSubmit: { action: 'submitted' },
  },
};

export default meta;
type Story = StoryObj<typeof StreamingComposer>;

export const Default: Story = {
  args: {
    roomId: 'room-123',
    userName: 'Alice the Brave',
    onSubmit: action('onSubmit'),
    disabled: false,
    placeholder: 'Describe your action...',
    isProcessing: false,
  },
};

export const WithPlaceholder: Story = {
  args: {
    roomId: 'room-123',
    userName: 'Alice the Brave',
    onSubmit: action('onSubmit'),
    disabled: false,
    placeholder: 'What do you do? (Enter to send, Shift+Enter for new line)',
    isProcessing: false,
  },
};

export const Disabled: Story = {
  args: {
    roomId: 'room-123',
    userName: 'Alice the Brave',
    onSubmit: action('onSubmit'),
    disabled: true,
    placeholder: 'Combat in progress...',
    isProcessing: false,
  },
};

export const Processing: Story = {
  args: {
    roomId: 'room-123',
    userName: 'Alice the Brave',
    onSubmit: action('onSubmit'),
    disabled: true,
    placeholder: 'DM is processing...',
    isProcessing: true,
  },
};

export const WithDraft: Story = {
  args: {
    roomId: 'room-with-draft',
    userName: 'Bob the Wizard',
    onSubmit: action('onSubmit'),
    disabled: false,
    placeholder: 'Continue your thought...',
    isProcessing: false,
  },
  play: async () => {
    // Simulate a draft being saved
    localStorage.setItem('composer-draft-room-with-draft', 'I cast Fireball at the...');
  },
};

export const Focused: Story = {
  args: {
    roomId: 'room-123',
    userName: 'Alice the Brave',
    onSubmit: action('onSubmit'),
    disabled: false,
    placeholder: 'Type your action...',
    isProcessing: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'The composer shows a beautiful aurora glow when focused.',
      },
    },
  },
};

export const LongText: Story = {
  args: {
    roomId: 'room-123',
    userName: 'Alice the Brave',
    onSubmit: action('onSubmit'),
    disabled: false,
    placeholder: 'Type your action...',
    isProcessing: false,
  },
  play: async ({ canvasElement }) => {
    const textarea = canvasElement.querySelector('textarea');
    if (textarea) {
      textarea.value = `I carefully approach the hooded figures, my hand resting on my sword hilt. As I draw near, I speak in a calm but firm voice: "Greetings, travelers. I notice you've been watching us. Is there something we can help you with?"

I maintain a non-threatening posture but remain ready to draw my weapon if needed.`;
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }
  },
};
