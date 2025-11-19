/**
 * Storybook stories for Message components
 * Demonstrates role-based layout, avatars, and message variants
 */

import type { Meta, StoryObj } from '@storybook/react';
import {
  Message,
  MessageContent,
  MessageAvatar,
  MessageHeader,
  MessageSender,
  MessageTime,
  MessageBadge,
} from './Message';

const meta: Meta<typeof Message> = {
  title: 'AI/Message',
  component: Message,
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
type Story = StoryObj<typeof Message>;

export const DMMessage: Story = {
  render: () => (
    <div className="space-y-4 bg-midnight-950 p-8">
      <Message from="DM">
        <MessageHeader>
          <div className="flex items-center gap-3">
            <MessageAvatar name="Dungeon Master" />
            <MessageSender isDM>Dungeon Master</MessageSender>
          </div>
          <MessageTime timestamp={Date.now()} />
        </MessageHeader>
        <MessageContent>
          <p className="text-shadow-50">
            You push open the heavy oak door and step into a vast chamber. Torches flicker along the walls, casting
            dancing shadows across ancient stone.
          </p>
        </MessageContent>
      </Message>
    </div>
  ),
};

export const UserMessage: Story = {
  render: () => (
    <div className="space-y-4 bg-midnight-950 p-8">
      <Message from="user">
        <MessageHeader>
          <div className="flex items-center gap-3">
            <MessageAvatar name="Alice the Brave" />
            <MessageSender>Alice the Brave</MessageSender>
          </div>
          <MessageTime timestamp={Date.now()} />
        </MessageHeader>
        <MessageContent>
          <p className="text-shadow-50">I carefully examine the room for traps before proceeding.</p>
        </MessageContent>
      </Message>
    </div>
  ),
};

export const SystemMessage: Story = {
  render: () => (
    <div className="space-y-4 bg-midnight-950 p-8">
      <Message from="system">
        <MessageHeader>
          <MessageSender>System</MessageSender>
          <MessageTime timestamp={Date.now()} />
        </MessageHeader>
        <MessageContent>
          <p className="text-center text-sm text-shadow-300">Combat has begun! Roll for initiative.</p>
        </MessageContent>
      </Message>
    </div>
  ),
};

export const PrivateMessage: Story = {
  render: () => (
    <div className="space-y-4 bg-midnight-950 p-8">
      <Message from="DM">
        <MessageHeader>
          <div className="flex items-center gap-3">
            <MessageAvatar name="Dungeon Master" />
            <MessageSender isDM>Dungeon Master</MessageSender>
            <MessageBadge variant="private">🔒 Private</MessageBadge>
          </div>
          <MessageTime timestamp={Date.now()} />
        </MessageHeader>
        <MessageContent>
          <p className="text-shadow-50">You notice a hidden compartment in the wall that the others haven't seen.</p>
        </MessageContent>
      </Message>
    </div>
  ),
};

export const StreamingMessage: Story = {
  render: () => (
    <div className="space-y-4 bg-midnight-950 p-8">
      <Message from="DM">
        <MessageHeader>
          <div className="flex items-center gap-3">
            <MessageAvatar name="Dungeon Master" />
            <MessageSender isDM>Dungeon Master</MessageSender>
            <MessageBadge variant="streaming">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-aurora-400" />
              Streaming...
            </MessageBadge>
          </div>
          <MessageTime timestamp={Date.now()} />
        </MessageHeader>
        <MessageContent>
          <p className="text-shadow-50">The ancient dragon rises from its slumber, its scales glimmering like</p>
        </MessageContent>
      </Message>
    </div>
  ),
};

export const MessageWithAvatar: Story = {
  render: () => (
    <div className="space-y-4 bg-midnight-950 p-8">
      <Message from="user">
        <MessageHeader>
          <div className="flex items-center gap-3">
            <MessageAvatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alice" name="Alice" />
            <MessageSender>Alice the Brave</MessageSender>
          </div>
          <MessageTime timestamp={Date.now()} />
        </MessageHeader>
        <MessageContent>
          <p className="text-shadow-50">I cast Fireball at the center of the goblin horde!</p>
        </MessageContent>
      </Message>
    </div>
  ),
};

export const Conversation: Story = {
  render: () => (
    <div className="space-y-6 bg-midnight-950 p-8">
      <Message from="DM">
        <MessageHeader>
          <div className="flex items-center gap-3">
            <MessageAvatar name="DM" />
            <MessageSender isDM>Dungeon Master</MessageSender>
          </div>
          <MessageTime timestamp={Date.now() - 180000} />
        </MessageHeader>
        <MessageContent>
          <p className="text-shadow-50">
            You find yourselves at the entrance of a dark cavern. The air is thick with the smell of sulfur.
          </p>
        </MessageContent>
      </Message>

      <Message from="Alice">
        <MessageHeader>
          <div className="flex items-center gap-3">
            <MessageAvatar name="Alice" />
            <MessageSender>Alice the Brave</MessageSender>
          </div>
          <MessageTime timestamp={Date.now() - 120000} />
        </MessageHeader>
        <MessageContent>
          <p className="text-shadow-50">I light a torch and peer into the darkness.</p>
        </MessageContent>
      </Message>

      <Message from="DM">
        <MessageHeader>
          <div className="flex items-center gap-3">
            <MessageAvatar name="DM" />
            <MessageSender isDM>Dungeon Master</MessageSender>
          </div>
          <MessageTime timestamp={Date.now() - 60000} />
        </MessageHeader>
        <MessageContent>
          <p className="text-shadow-50">
            Your torch illuminates rough stone walls covered in ancient carvings. You hear the distant sound of water
            dripping.
          </p>
        </MessageContent>
      </Message>

      <Message from="Bob">
        <MessageHeader>
          <div className="flex items-center gap-3">
            <MessageAvatar name="Bob" />
            <MessageSender>Bob the Wizard</MessageSender>
          </div>
          <MessageTime timestamp={Date.now()} />
        </MessageHeader>
        <MessageContent>
          <p className="text-shadow-50">I cast Detect Magic to check for any enchantments or traps.</p>
        </MessageContent>
      </Message>
    </div>
  ),
};

export const LongMessage: Story = {
  render: () => (
    <div className="space-y-4 bg-midnight-950 p-8">
      <Message from="DM">
        <MessageHeader>
          <div className="flex items-center gap-3">
            <MessageAvatar name="DM" />
            <MessageSender isDM>Dungeon Master</MessageSender>
          </div>
          <MessageTime timestamp={Date.now()} />
        </MessageHeader>
        <MessageContent>
          <p className="text-shadow-50">
            The chamber opens into a vast hall, its ceiling lost in shadow high above. Massive pillars carved with
            draconic runes line the walls, each one glowing with a faint ethereal light. At the far end of the hall, you
            see a throne of obsidian, and upon it sits a figure cloaked in darkness. The air crackles with arcane
            energy, and you feel the weight of ancient power pressing down upon you.
          </p>
          <p className="text-shadow-50 mt-2">
            As you step forward, your footsteps echo through the silence. The figure on the throne stirs, and two eyes
            like burning coals fix upon you. A voice, ancient and powerful, fills your mind: "So, mortals dare to enter
            my domain. What brings you to the Sanctum of Shadows?"
          </p>
        </MessageContent>
      </Message>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6 bg-midnight-950 p-8">
      <Message from="DM">
        <MessageHeader>
          <div className="flex items-center gap-3">
            <MessageAvatar name="DM" />
            <MessageSender isDM>DM</MessageSender>
          </div>
          <MessageTime timestamp={Date.now()} />
        </MessageHeader>
        <MessageContent>
          <p className="text-shadow-50">Standard DM message</p>
        </MessageContent>
      </Message>

      <Message from="user">
        <MessageHeader>
          <div className="flex items-center gap-3">
            <MessageAvatar name="Player" />
            <MessageSender>Player</MessageSender>
          </div>
          <MessageTime timestamp={Date.now()} />
        </MessageHeader>
        <MessageContent>
          <p className="text-shadow-50">Standard player message</p>
        </MessageContent>
      </Message>

      <Message from="system">
        <MessageHeader>
          <MessageSender>System</MessageSender>
        </MessageHeader>
        <MessageContent>
          <p className="text-center text-sm text-shadow-300">System notification</p>
        </MessageContent>
      </Message>

      <Message from="DM">
        <MessageHeader>
          <div className="flex items-center gap-3">
            <MessageAvatar name="DM" />
            <MessageSender isDM>DM</MessageSender>
            <MessageBadge variant="private">🔒 Private</MessageBadge>
          </div>
        </MessageHeader>
        <MessageContent>
          <p className="text-shadow-50">Private DM message</p>
        </MessageContent>
      </Message>

      <Message from="DM">
        <MessageHeader>
          <div className="flex items-center gap-3">
            <MessageAvatar name="DM" />
            <MessageSender isDM>DM</MessageSender>
            <MessageBadge variant="streaming">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-aurora-400" />
              Streaming...
            </MessageBadge>
          </div>
        </MessageHeader>
        <MessageContent>
          <p className="text-shadow-50">Streaming response...</p>
        </MessageContent>
      </Message>
    </div>
  ),
};
