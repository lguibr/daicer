/**
 * Storybook stories for Response renderer
 * Demonstrates streaming markdown with auto-completion and incomplete handling
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Response } from './Response';
import { Message, MessageContent, MessageHeader, MessageSender, MessageAvatar } from './Message';

const meta: Meta<typeof Response> = {
  title: 'AI/Response',
  component: Response,
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
type Story = StoryObj<typeof Response>;

export const PlainText: Story = {
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
          <Response>You enter a dimly lit tavern. The smell of ale and roasted meat fills the air.</Response>
        </MessageContent>
      </Message>
    </div>
  ),
};

export const FormattedMarkdown: Story = {
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
          <Response>
            {`**The Ancient Chamber**

You stand before a *massive* stone door covered in runes. The runes glow with an ~~ominous~~ eerie blue light.

> "In shadow we dwell, in darkness we thrive."

Three options present themselves:

1. Attempt to decipher the runes
2. Force the door open
3. Search for an alternate entrance

The choice is yours, adventurer.`}
          </Response>
        </MessageContent>
      </Message>
    </div>
  ),
};

export const IncompleteBold: Story = {
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
          <Response parseIncompleteMarkdown>The dragon roars and unleashes a **mighty bre</Response>
        </MessageContent>
      </Message>
      <p className="text-xs text-shadow-400">↑ Incomplete bold is auto-completed during streaming</p>
    </div>
  ),
};

export const IncompleteItalic: Story = {
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
          <Response parseIncompleteMarkdown>You hear a *whisper in the dark</Response>
        </MessageContent>
      </Message>
      <p className="text-xs text-shadow-400">↑ Incomplete italic is auto-completed</p>
    </div>
  ),
};

export const IncompleteCode: Story = {
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
          <Response parseIncompleteMarkdown>The scroll reads: `Aperio Por</Response>
        </MessageContent>
      </Message>
      <p className="text-xs text-shadow-400">↑ Incomplete code is auto-completed</p>
    </div>
  ),
};

export const IncompleteLink: Story = {
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
          <Response parseIncompleteMarkdown>The ancient tome mentions [The Lost City of</Response>
        </MessageContent>
      </Message>
      <p className="text-xs text-shadow-400">↑ Incomplete link is hidden until complete</p>
    </div>
  ),
};

export const CodeBlock: Story = {
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
          <Response>
            {`You decipher the ancient spell:

\`\`\`python
def cast_fireball(target, damage_dice="8d6"):
    roll = dice.roll(damage_dice)
    target.take_damage(roll, damage_type="fire")
    return roll
\`\`\`

The spell requires concentration and uses a 3rd level slot.`}
          </Response>
        </MessageContent>
      </Message>
    </div>
  ),
};

export const WithLists: Story = {
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
          <Response>
            {`**Quest Items Found:**

* Ancient Amulet (+2 AC)
* Scroll of Fireball
* 50 gold pieces
* Mysterious Key

**Active Quests:**

1. Find the Lost Sword of Kings
2. Rescue the Princess from the Tower
3. Defeat the Dragon of Mount Doom`}
          </Response>
        </MessageContent>
      </Message>
    </div>
  ),
};

export const WithTable: Story = {
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
          <Response>
            {`**Initiative Order:**

| Character | Initiative | HP |
|-----------|------------|-----|
| Alice | 18 | 45/45 |
| Bob | 15 | 38/38 |
| Goblin | 12 | 7/7 |
| Orc | 8 | 15/15 |`}
          </Response>
        </MessageContent>
      </Message>
    </div>
  ),
};

export const WithBlockquote: Story = {
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
          <Response>
            {`As you open the ancient tome, glowing text appears:

> "When the moon is full and the stars align,
> The gateway shall open, the realms combine.
> Three keys are needed, three trials to pass,
> Only the worthy shall come to pass."

The prophecy speaks of an ancient ritual.`}
          </Response>
        </MessageContent>
      </Message>
    </div>
  ),
};

export const StreamingDemo: Story = {
  render: () => {
    function StreamingText() {
      const [text, setText] = React.useState('The ancient dragon ');
      const fullText =
        'The ancient dragon **slowly opens one massive eye**, its pupil *glowing like molten gold*. A deep rumble emanates from its chest as it begins to speak...';

      React.useEffect(() => {
        if (text.length < fullText.length) {
          const timer = setTimeout(() => {
            setText(fullText.slice(0, text.length + 1));
          }, 50);
          return () => clearTimeout(timer);
        }
        return () => {};
      }, [text]);

      return (
        <div className="bg-midnight-950 p-8">
          <Message from="DM">
            <MessageHeader>
              <div className="flex items-center gap-3">
                <MessageAvatar name="DM" />
                <MessageSender isDM>Dungeon Master</MessageSender>
              </div>
            </MessageHeader>
            <MessageContent>
              <Response parseIncompleteMarkdown>{text}</Response>
            </MessageContent>
          </Message>
        </div>
      );
    }

    return <StreamingText />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Watch the text stream character by character. Incomplete formatting is auto-completed in real-time.',
      },
    },
  },
};

export const LongResponse: Story = {
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
          <Response>
            {`# The Dragon's Lair

As you descend into the depths of Mount Doom, the temperature rises dramatically. The narrow passage opens into a **vast cavern**, its ceiling lost in darkness above. The floor is covered in gold coins, precious gems, and ancient artifacts—a dragon's hoard accumulated over centuries.

## What You See

In the center of the chamber, coiled around a massive pile of treasure, lies the *Ancient Red Dragon Infernus*. Its scales shimmer like molten lava, and wisps of smoke curl from its nostrils with each breath.

### The Dragon's Stats

- **HP:** 546/546
- **AC:** 22
- **Challenge Rating:** 24
- **Legendary Actions:** 3 per round

## Your Options

1. **Negotiate** - The dragon is ancient and might prefer conversation to combat
2. **Attack** - Launch a surprise assault while it appears to be sleeping
3. **Sneak** - Attempt to steal a specific item and escape unnoticed
4. **Retreat** - Live to fight another day

> "Pride comes before the fall, but wisdom ensures survival."
> — Ancient Proverb

What do you do?`}
          </Response>
        </MessageContent>
      </Message>
    </div>
  ),
};
