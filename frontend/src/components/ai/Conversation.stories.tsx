/**
 * Storybook stories for Conversation container
 * Demonstrates auto-scroll behavior and stick-to-bottom functionality
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Conversation, ConversationContent, ConversationScrollButton } from './Conversation';

const meta: Meta<typeof Conversation> = {
  title: 'AI/Conversation',
  component: Conversation,
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
type Story = StoryObj<typeof Conversation>;

// Mock message component for demonstrations
function MockMessage({ sender, children }: { sender: string; children: React.ReactNode }) {
  return (
    <div className="mx-4 my-3 rounded-2xl border border-midnight-600/60 bg-midnight-700/80 p-4 shadow-lg">
      <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-aurora-200">{sender}</div>
      <div className="text-shadow-100">{children}</div>
    </div>
  );
}

const generateMessages = (count: number) =>
  Array.from({ length: count }, (_, i) => (
    <MockMessage key={i} sender={i % 2 === 0 ? 'DM' : 'Player'}>
      This is message #{i + 1}.{' '}
      {i % 3 === 0
        ? 'A longer message with more content to demonstrate text wrapping and layout behavior in the conversation container.'
        : ''}
    </MockMessage>
  ));

export const Default: Story = {
  render: () => (
    <div className="h-screen bg-midnight-950 p-8">
      <Conversation>
        <ConversationContent>
          <div className="space-y-4 p-4">
            <MockMessage sender="DM">Welcome to the conversation! This is the Dungeon Master speaking.</MockMessage>
            <MockMessage sender="Alice">I approach the mysterious door cautiously.</MockMessage>
            <MockMessage sender="DM">
              The door is made of ancient oak, covered in strange runes that pulse with a faint blue light.
            </MockMessage>
            <MockMessage sender="Bob">I cast Detect Magic to examine the runes.</MockMessage>
            <MockMessage sender="DM">
              Your spell reveals powerful abjuration magic protecting the door. You'll need a key or the correct
              password.
            </MockMessage>
          </div>
        </ConversationContent>
      </Conversation>
    </div>
  ),
};

export const LongConversation: Story = {
  render: () => (
    <div className="h-screen bg-midnight-950 p-8">
      <Conversation>
        <ConversationContent>
          <div className="space-y-4 p-4">{generateMessages(30)}</div>
        </ConversationContent>
      </Conversation>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Scroll up to see the "New messages" button appear. The conversation auto-scrolls when at bottom.',
      },
    },
  },
};

export const WithScrollButton: Story = {
  render: () => (
    <div className="h-screen bg-midnight-950 p-8">
      <Conversation>
        <ConversationContent>
          <div className="space-y-4 p-4">{generateMessages(50)}</div>
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'The scroll button is always visible in this story. Click it to jump to the bottom.',
      },
    },
  },
};

export const EmptyState: Story = {
  render: () => (
    <div className="h-screen bg-midnight-950 p-8">
      <Conversation>
        <ConversationContent>
          <div className="flex h-full items-center justify-center p-4">
            <div className="text-center">
              <p className="text-lg text-shadow-400">No messages yet</p>
              <p className="mt-2 text-sm text-shadow-500">Start the conversation below</p>
            </div>
          </div>
        </ConversationContent>
      </Conversation>
    </div>
  ),
};

export const StreamingMessage: Story = {
  render: () => {
    function StreamingDemo() {
      const [messages, setMessages] = React.useState(['Welcome to the adventure!', 'What do you do?']);

      React.useEffect(() => {
        const interval = setInterval(() => {
          setMessages((prev) => [...prev, `New message at ${new Date().toLocaleTimeString()}`]);
        }, 2000);

        return () => clearInterval(interval);
      }, []);

      return (
        <div className="h-screen bg-midnight-950 p-8">
          <Conversation>
            <ConversationContent>
              <div className="space-y-4 p-4">
                {messages.map((msg, i) => (
                  <MockMessage key={i} sender={i % 2 === 0 ? 'DM' : 'Player'}>
                    {msg}
                  </MockMessage>
                ))}
              </div>
            </ConversationContent>
          </Conversation>
        </div>
      );
    }

    return <StreamingDemo />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Messages arrive every 2 seconds. The conversation auto-scrolls to show new content when at bottom.',
      },
    },
  },
};

export const KeyboardNavigation: Story = {
  render: () => (
    <div className="h-screen bg-midnight-950 p-8">
      <Conversation>
        <ConversationContent>
          <div className="space-y-4 p-4">
            <div className="rounded-lg border border-aurora-500/30 bg-aurora-900/20 p-4 text-sm">
              <p className="mb-2 font-semibold text-aurora-200">Keyboard shortcuts:</p>
              <ul className="space-y-1 text-shadow-300">
                <li>
                  <kbd className="rounded bg-midnight-700 px-2 py-1 font-mono text-xs">Home</kbd> - Scroll to top
                </li>
                <li>
                  <kbd className="rounded bg-midnight-700 px-2 py-1 font-mono text-xs">End</kbd> - Scroll to bottom
                </li>
                <li>
                  <kbd className="rounded bg-midnight-700 px-2 py-1 font-mono text-xs">Page Up</kbd> - Scroll up one
                  page
                </li>
                <li>
                  <kbd className="rounded bg-midnight-700 px-2 py-1 font-mono text-xs">Page Down</kbd> - Scroll down one
                  page
                </li>
              </ul>
            </div>
            {generateMessages(40)}
          </div>
        </ConversationContent>
      </Conversation>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Click inside the conversation area and use keyboard shortcuts to navigate.',
      },
    },
  },
};
