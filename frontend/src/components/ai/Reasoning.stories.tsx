/**
 * Storybook stories for Reasoning component
 * Demonstrates auto-open/close behavior and duration tracking
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Reasoning } from './Reasoning';
import { Message, MessageContent, MessageHeader, MessageSender, MessageAvatar } from './Message';

const meta: Meta<typeof Reasoning> = {
  title: 'AI/Reasoning',
  component: Reasoning,
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
type Story = StoryObj<typeof Reasoning>;

const reasoningText = `Let me break down this problem step by step:

1. **Understanding the Request**: The player wants to cast Fireball on the goblin horde. This is a 3rd level spell with a range of 150 feet and a 20-foot radius sphere of effect.

2. **Checking Prerequisites**: 
   - Player has a 3rd level spell slot available
   - Target location is within range
   - No friendly creatures in the blast radius

3. **Calculating Outcomes**:
   - Base damage: 8d6 fire damage
   - Each goblin makes a Dexterity saving throw (DC 15)
   - Failed save: full damage
   - Successful save: half damage

4. **Environmental Effects**:
   - The wooden crates nearby will catch fire
   - Smoke will fill the room, creating difficult terrain
   - The tapestries on the walls are at risk`;

export const Default: Story = {
  render: () => (
    <div className="bg-midnight-950 p-8">
      <Reasoning>{reasoningText}</Reasoning>
    </div>
  ),
};

export const Collapsed: Story = {
  render: () => (
    <div className="bg-midnight-950 p-8">
      <Reasoning defaultOpen={false}>{reasoningText}</Reasoning>
      <p className="mt-4 text-sm text-shadow-400">Click to expand and see the reasoning</p>
    </div>
  ),
};

export const Expanded: Story = {
  render: () => (
    <div className="bg-midnight-950 p-8">
      <Reasoning defaultOpen>{reasoningText}</Reasoning>
    </div>
  ),
};

export const Streaming: Story = {
  render: () => (
    <div className="bg-midnight-950 p-8">
      <Reasoning isStreaming>
        Let me analyze this situation... The ancient door appears to be protected by powerful
      </Reasoning>
    </div>
  ),
};

export const WithDuration: Story = {
  render: () => (
    <div className="bg-midnight-950 p-8">
      <Reasoning duration={3.2}>{reasoningText}</Reasoning>
    </div>
  ),
};

export const InMessage: Story = {
  render: () => (
    <div className="bg-midnight-950 p-8">
      <Message from="DM">
        <MessageHeader>
          <div className="flex items-center gap-3">
            <MessageAvatar name="DM" />
            <MessageSender isDM>Dungeon Master</MessageSender>
          </div>
        </MessageHeader>
        <MessageContent>
          <Reasoning>{reasoningText}</Reasoning>
          <p className="mt-3 text-shadow-50">The Fireball explodes among the goblins! Roll 8d6 fire damage.</p>
        </MessageContent>
      </Message>
    </div>
  ),
};

export const AutoOpenClose: Story = {
  render: () => {
    function AutoDemo() {
      const [isStreaming, setIsStreaming] = useState(false);
      const [text, setText] = useState('');

      const startStreaming = () => {
        setIsStreaming(true);
        setText('');

        const words = reasoningText.split(' ');
        let index = 0;

        const interval = setInterval(() => {
          if (index < words.length) {
            setText((prev) => prev + (prev ? ' ' : '') + words[index]);
            index++;
          } else {
            setIsStreaming(false);
            clearInterval(interval);
          }
        }, 50);
      };

      return (
        <div className="space-y-4 bg-midnight-950 p-8">
          <div className="rounded-lg border border-aurora-500/30 bg-aurora-900/20 p-4">
            <p className="mb-3 text-sm text-aurora-200">Watch the reasoning panel:</p>
            <ul className="space-y-1 text-sm text-shadow-300">
              <li>✓ Auto-opens when streaming starts</li>
              <li>✓ Shows thinking indicator</li>
              <li>✓ Tracks duration in real-time</li>
              <li>✓ Auto-closes 1 second after streaming stops</li>
            </ul>
          </div>

          <Button onClick={startStreaming} disabled={isStreaming}>
            {isStreaming ? 'Streaming...' : 'Start Streaming Reasoning'}
          </Button>

          <Reasoning isStreaming={isStreaming}>{text || 'Waiting to start...'}</Reasoning>
        </div>
      );
    }

    return <AutoDemo />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Click the button to see the auto-open/close behavior in action.',
      },
    },
  },
};

export const ControlledState: Story = {
  render: () => {
    function ControlledDemo() {
      const [open, setOpen] = useState(true);

      return (
        <div className="space-y-4 bg-midnight-950 p-8">
          <div className="flex items-center gap-2">
            <Button onClick={() => setOpen(!open)} size="sm">
              {open ? 'Close' : 'Open'}
            </Button>
            <span className="text-sm text-shadow-400">State: {open ? 'Open' : 'Closed'}</span>
          </div>

          <Reasoning open={open} onOpenChange={setOpen}>
            {reasoningText}
          </Reasoning>
        </div>
      );
    }

    return <ControlledDemo />;
  },
};

export const ShortReasoning: Story = {
  render: () => (
    <div className="bg-midnight-950 p-8">
      <Reasoning>
        <p>Player has line of sight to target.</p>
        <p>Spell slot available.</p>
        <p>Casting is possible.</p>
      </Reasoning>
    </div>
  ),
};

export const LongReasoning: Story = {
  render: () => (
    <div className="bg-midnight-950 p-8">
      <Reasoning defaultOpen>
        {`# Combat Analysis

## Current Situation
The party faces a group of 8 goblins in a 30x30 foot room with various obstacles.

## Party Positioning
- Alice (Fighter): Front line, engaging 2 goblins
- Bob (Wizard): Back line, 25 feet from nearest enemy
- Carol (Cleric): Middle, supporting Alice

## Enemy Positioning
- 2 goblins engaged with Alice
- 3 goblins moving to flank
- 3 goblins with bows at range

## Tactical Considerations

### Fireball Placement Options
1. **Center of room**: Catches 6 goblins, risk to Alice (Dex save DC 15)
2. **Flanking group**: Catches 3 goblins, no friendly fire
3. **Ranged group**: Catches 3 goblins, destroys cover

### Recommended Action
Place Fireball on flanking group for these reasons:
- Eliminates immediate threat to Alice
- No risk to party members
- Preserves ranged enemies for Alice to engage next turn
- Creates opening for Carol to heal if needed

### Expected Outcome
- 3 goblins take 8d6 fire damage (avg 28)
- Likely kills all 3 (goblins have 7 HP each)
- Remaining 5 goblins will reassess tactics
- Party gains initiative advantage`}
      </Reasoning>
    </div>
  ),
};

export const MultipleReasoning: Story = {
  render: () => (
    <div className="space-y-4 bg-midnight-950 p-8">
      <Message from="DM">
        <MessageHeader>
          <div className="flex items-center gap-3">
            <MessageAvatar name="DM" />
            <MessageSender isDM>Dungeon Master</MessageSender>
          </div>
        </MessageHeader>
        <MessageContent>
          <Reasoning defaultOpen={false}>
            <p>
              <strong>Ability Check Analysis:</strong>
            </p>
            <p>Player rolled 14 + 5 (proficiency) = 19</p>
            <p>DC for picking the lock: 15</p>
            <p>Result: Success</p>
          </Reasoning>

          <p className="my-3 text-shadow-50">
            With a satisfying *click*, the lock opens. Inside the chest, you find...
          </p>

          <Reasoning defaultOpen={false}>
            <p>
              <strong>Treasure Generation:</strong>
            </p>
            <p>Chest type: Ancient Noble's Cache</p>
            <p>Rolling on treasure table: d100 = 73</p>
            <p>Result: 200gp + 1 magical item + 3 gems</p>
            <p>Magical item roll: Cloak of Elvenkind</p>
          </Reasoning>

          <p className="mt-3 text-shadow-50">
            ...200 gold pieces, a shimmering Cloak of Elvenkind, and three sparkling emeralds!
          </p>
        </MessageContent>
      </Message>
    </div>
  ),
};
