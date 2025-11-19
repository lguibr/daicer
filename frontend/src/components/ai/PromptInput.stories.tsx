/**
 * Storybook stories for PromptInput
 * Demonstrates auto-resize, keyboard shortcuts, and status states
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PromptInput, PromptInputTextarea, PromptInputToolbar, PromptInputSubmit } from './PromptInput';

const meta: Meta<typeof PromptInput> = {
  title: 'AI/PromptInput',
  component: PromptInput,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0a0e1a' }],
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PromptInput>;

export const Default: Story = {
  render: () => {
    function PromptDemo() {
      const [input, setInput] = useState('');

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert(`Submitted: "${input}"`);
        setInput('');
      };

      return (
        <div className="bg-midnight-950 p-8">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
            />
            <PromptInputToolbar>
              <div className="flex-1" />
              <PromptInputSubmit disabled={!input.trim()} />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      );
    }

    return <PromptDemo />;
  },
};

export const WithToolbar: Story = {
  render: () => {
    function PromptDemo() {
      const [input, setInput] = useState('');

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert(`Submitted: "${input}"`);
        setInput('');
      };

      return (
        <div className="bg-midnight-950 p-8">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your action..."
            />
            <PromptInputToolbar>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" type="button">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                  Attach
                </Button>
                <Button variant="ghost" size="sm" type="button">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                  Voice
                </Button>
              </div>
              <PromptInputSubmit disabled={!input.trim()} />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      );
    }

    return <PromptDemo />;
  },
};

export const Disabled: Story = {
  render: () => {
    function PromptDemo() {
      const [input, setInput] = useState('');

      return (
        <div className="bg-midnight-950 p-8">
          <PromptInput onSubmit={(e) => e.preventDefault()}>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Combat in progress..."
              disabled
            />
            <PromptInputToolbar>
              <div className="flex-1" />
              <PromptInputSubmit disabled />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      );
    }

    return <PromptDemo />;
  },
};

export const Streaming: Story = {
  render: () => {
    function PromptDemo() {
      const [input, setInput] = useState('');

      return (
        <div className="bg-midnight-950 p-8">
          <PromptInput onSubmit={(e) => e.preventDefault()}>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="DM is responding..."
              disabled
            />
            <PromptInputToolbar>
              <div className="text-sm text-shadow-400">DM is thinking...</div>
              <PromptInputSubmit disabled status="streaming" />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      );
    }

    return <PromptDemo />;
  },
};

export const LongText: Story = {
  render: () => {
    function PromptDemo() {
      const [input, setInput] = useState(
        'I carefully approach the ancient door, examining the runes carved into its surface. Using my knowledge of arcane symbols, I attempt to decipher their meaning while keeping my hand on my sword hilt in case of traps or guardians.'
      );

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert(`Submitted: "${input}"`);
        setInput('');
      };

      return (
        <div className="bg-midnight-950 p-8">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
            />
            <PromptInputToolbar>
              <div className="flex-1" />
              <PromptInputSubmit disabled={!input.trim()} />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      );
    }

    return <PromptDemo />;
  },
  parameters: {
    docs: {
      description: {
        story: 'The textarea auto-expands to accommodate longer text.',
      },
    },
  },
};

export const VeryLongText: Story = {
  render: () => {
    function PromptDemo() {
      const [input, setInput] = useState(
        `I carefully examine the ancient chamber, noting every detail. The walls are covered in intricate carvings depicting what appears to be a great battle between celestial beings and dark forces. 

The ceiling soars high above, disappearing into shadow, and I can hear the faint echo of water dripping somewhere in the distance. 

My torch casts flickering shadows that dance across the stone floor, and I notice faint scuff marks leading toward the northern passage. They look relatively fresh—perhaps made within the last few days.

I signal to my companions to stay alert and begin moving cautiously toward the passage, keeping my weapon ready and my senses sharp for any signs of danger or hidden traps.`
      );

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Message submitted!');
        setInput('');
      };

      return (
        <div className="bg-midnight-950 p-8">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              maxHeight={200}
            />
            <PromptInputToolbar>
              <div className="flex-1" />
              <PromptInputSubmit disabled={!input.trim()} />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      );
    }

    return <PromptDemo />;
  },
  parameters: {
    docs: {
      description: {
        story: 'The textarea stops expanding at maxHeight and becomes scrollable.',
      },
    },
  },
};

export const KeyboardShortcuts: Story = {
  render: () => {
    function PromptDemo() {
      const [input, setInput] = useState('');
      const [log, setLog] = useState<string[]>([]);

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
          setLog((prev) => [...prev, `Submitted: "${input}"`]);
          setInput('');
        }
      };

      return (
        <div className="space-y-4 bg-midnight-950 p-8">
          <div className="rounded-lg border border-aurora-500/30 bg-aurora-900/20 p-4">
            <p className="mb-2 font-semibold text-aurora-200">Try these keyboard shortcuts:</p>
            <ul className="space-y-1 text-sm text-shadow-300">
              <li>
                <kbd className="rounded bg-midnight-700 px-2 py-1 font-mono text-xs">Enter</kbd> - Submit message
              </li>
              <li>
                <kbd className="rounded bg-midnight-700 px-2 py-1 font-mono text-xs">Shift+Enter</kbd> - New line
              </li>
            </ul>
          </div>

          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Try Enter and Shift+Enter..."
            />
            <PromptInputToolbar>
              <div className="flex-1" />
              <PromptInputSubmit disabled={!input.trim()} />
            </PromptInputToolbar>
          </PromptInput>

          {log.length > 0 && (
            <div className="rounded-lg border border-midnight-600/60 bg-midnight-800/60 p-4">
              <p className="mb-2 text-sm font-semibold text-shadow-200">Submission Log:</p>
              <div className="space-y-1">
                {log.map((entry, i) => (
                  <p key={i} className="text-sm text-shadow-400 font-mono">
                    {entry}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return <PromptDemo />;
  },
};

export const StatusStates: Story = {
  render: () => (
    <div className="space-y-6 bg-midnight-950 p-8">
      <div>
        <p className="mb-2 text-sm text-shadow-400">Ready State</p>
        <PromptInput onSubmit={(e) => e.preventDefault()}>
          <PromptInputTextarea value="Ready to send" onChange={() => {}} placeholder="Type..." />
          <PromptInputToolbar>
            <div className="flex-1" />
            <PromptInputSubmit status="ready" />
          </PromptInputToolbar>
        </PromptInput>
      </div>

      <div>
        <p className="mb-2 text-sm text-shadow-400">Streaming State</p>
        <PromptInput onSubmit={(e) => e.preventDefault()}>
          <PromptInputTextarea value="" onChange={() => {}} placeholder="AI is responding..." disabled />
          <PromptInputToolbar>
            <div className="flex-1" />
            <PromptInputSubmit status="streaming" disabled />
          </PromptInputToolbar>
        </PromptInput>
      </div>

      <div>
        <p className="mb-2 text-sm text-shadow-400">Error State</p>
        <PromptInput onSubmit={(e) => e.preventDefault()}>
          <PromptInputTextarea value="Failed to send" onChange={() => {}} placeholder="Type..." />
          <PromptInputToolbar>
            <span className="text-sm text-red-400">Failed to send message</span>
            <PromptInputSubmit status="error" />
          </PromptInputToolbar>
        </PromptInput>
      </div>

      <div>
        <p className="mb-2 text-sm text-shadow-400">Disabled State</p>
        <PromptInput onSubmit={(e) => e.preventDefault()}>
          <PromptInputTextarea value="" onChange={() => {}} placeholder="Combat in progress..." disabled />
          <PromptInputToolbar>
            <div className="flex-1" />
            <PromptInputSubmit disabled />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  ),
};
