/**
 * Storybook stories for Actions
 * Demonstrates message-level actions like copy, regenerate, edit, delete
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Actions, ActionCopy, ActionRegenerate, ActionEdit, ActionDelete } from './Actions';
import { Message, MessageContent, MessageHeader, MessageSender, MessageAvatar } from './Message';

const meta: Meta<typeof Actions> = {
  title: 'AI/Actions',
  component: Actions,
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
type Story = StoryObj<typeof Actions>;

export const AllActions: Story = {
  render: () => {
    const handleCopy = () => console.info('Copy clicked');
    const handleRegenerate = (id: string) => console.info('Regenerate:', id);
    const handleEdit = (id: string) => console.info('Edit:', id);
    const handleDelete = (id: string) => console.info('Delete:', id);

    return (
      <div className="bg-midnight-950 p-8">
        <div className="group">
          <Message from="DM">
            <MessageHeader>
              <div className="flex items-center gap-3">
                <MessageAvatar name="DM" />
                <MessageSender isDM>Dungeon Master</MessageSender>
              </div>
              <Actions>
                <ActionCopy text="Test message content" onCopy={handleCopy} />
                <ActionRegenerate messageId="msg-1" onRegenerate={handleRegenerate} />
                <ActionEdit messageId="msg-1" onEdit={handleEdit} />
                <ActionDelete messageId="msg-1" onDelete={handleDelete} />
              </Actions>
            </MessageHeader>
            <MessageContent>
              <p className="text-shadow-50">Hover over this message to see the action buttons appear in the header.</p>
            </MessageContent>
          </Message>
        </div>
        <p className="mt-4 text-sm text-shadow-400">↑ Hover over the message to see actions</p>
      </div>
    );
  },
};

export const CopyOnly: Story = {
  render: () => (
    <div className="bg-midnight-950 p-8">
      <div className="group">
        <Message from="DM">
          <MessageHeader>
            <div className="flex items-center gap-3">
              <MessageAvatar name="DM" />
              <MessageSender isDM>Dungeon Master</MessageSender>
            </div>
            <Actions>
              <ActionCopy text="The ancient door opens with a loud creak..." />
            </Actions>
          </MessageHeader>
          <MessageContent>
            <p className="text-shadow-50">The ancient door opens with a loud creak...</p>
          </MessageContent>
        </Message>
      </div>
    </div>
  ),
};

export const DMActions: Story = {
  render: () => (
    <div className="bg-midnight-950 p-8">
      <div className="group">
        <Message from="DM">
          <MessageHeader>
            <div className="flex items-center gap-3">
              <MessageAvatar name="DM" />
              <MessageSender isDM>Dungeon Master</MessageSender>
            </div>
            <Actions>
              <ActionCopy text="DM narration text" />
              <ActionRegenerate messageId="msg-dm" onRegenerate={(id) => console.info('Regenerate:', id)} />
              <ActionDelete messageId="msg-dm" onDelete={(id) => console.info('Delete:', id)} />
            </Actions>
          </MessageHeader>
          <MessageContent>
            <p className="text-shadow-50">A dragon emerges from the shadows...</p>
          </MessageContent>
        </Message>
      </div>
      <p className="mt-4 text-sm text-shadow-400">↑ DM messages show copy, regenerate, and delete actions</p>
    </div>
  ),
};

export const PlayerActions: Story = {
  render: () => (
    <div className="bg-midnight-950 p-8">
      <div className="group">
        <Message from="user">
          <MessageHeader>
            <div className="flex items-center gap-3">
              <MessageAvatar name="Alice" />
              <MessageSender>Alice the Brave</MessageSender>
            </div>
            <Actions>
              <ActionCopy text="Player action text" />
              <ActionEdit messageId="msg-player" onEdit={(id) => console.info('Edit:', id)} />
            </Actions>
          </MessageHeader>
          <MessageContent>
            <p className="text-shadow-50">I attack the goblin with my sword!</p>
          </MessageContent>
        </Message>
      </div>
      <p className="mt-4 text-sm text-shadow-400">↑ Player messages show copy and edit actions</p>
    </div>
  ),
};

export const CopyInteraction: Story = {
  render: () => {
    function CopyDemo() {
      const [log, setLog] = React.useState<string[]>([]);

      const handleCopy = () => {
        setLog((prev) => [...prev, `Copied at ${new Date().toLocaleTimeString()}`]);
      };

      return (
        <div className="space-y-4 bg-midnight-950 p-8">
          <div className="group">
            <Message from="DM">
              <MessageHeader>
                <div className="flex items-center gap-3">
                  <MessageAvatar name="DM" />
                  <MessageSender isDM>Dungeon Master</MessageSender>
                </div>
                <Actions>
                  <ActionCopy text="You find a mysterious ancient scroll with strange runes." onCopy={handleCopy} />
                </Actions>
              </MessageHeader>
              <MessageContent>
                <p className="text-shadow-50">You find a mysterious ancient scroll with strange runes.</p>
              </MessageContent>
            </Message>
          </div>

          {log.length > 0 && (
            <div className="rounded-lg border border-midnight-600/60 bg-midnight-800/60 p-4">
              <p className="mb-2 text-sm font-semibold text-shadow-200">Action Log:</p>
              <div className="space-y-1">
                {log.map((entry, i) => (
                  <p key={i} className="font-mono text-sm text-shadow-400">
                    {entry}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return <CopyDemo />;
  },
};

export const RegenerateInteraction: Story = {
  render: () => {
    function RegenerateDemo() {
      const [log, setLog] = React.useState<string[]>([]);

      const handleRegenerate = (id: string) => {
        setLog((prev) => [...prev, `Regenerating message ${id} at ${new Date().toLocaleTimeString()}`]);
      };

      return (
        <div className="space-y-4 bg-midnight-950 p-8">
          <div className="group">
            <Message from="DM">
              <MessageHeader>
                <div className="flex items-center gap-3">
                  <MessageAvatar name="DM" />
                  <MessageSender isDM>Dungeon Master</MessageSender>
                </div>
                <Actions>
                  <ActionRegenerate messageId="msg-test" onRegenerate={handleRegenerate} />
                </Actions>
              </MessageHeader>
              <MessageContent>
                <p className="text-shadow-50">The goblin attacks with its rusty blade.</p>
              </MessageContent>
            </Message>
          </div>

          {log.length > 0 && (
            <div className="rounded-lg border border-midnight-600/60 bg-midnight-800/60 p-4">
              <p className="mb-2 text-sm font-semibold text-shadow-200">Action Log:</p>
              <div className="space-y-1">
                {log.map((entry, i) => (
                  <p key={i} className="font-mono text-sm text-shadow-400">
                    {entry}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return <RegenerateDemo />;
  },
};

export const DeleteConfirmation: Story = {
  render: () => {
    function DeleteDemo() {
      const [log, setLog] = React.useState<string[]>([]);

      const handleDelete = (id: string) => {
        setLog((prev) => [...prev, `Deleted message ${id} at ${new Date().toLocaleTimeString()}`]);
      };

      return (
        <div className="space-y-4 bg-midnight-950 p-8">
          <div className="rounded-lg border border-aurora-500/30 bg-aurora-900/20 p-4">
            <p className="mb-2 font-semibold text-aurora-200">Delete requires confirmation:</p>
            <ul className="space-y-1 text-sm text-shadow-300">
              <li>1. Click delete button once</li>
              <li>2. Button turns red asking for confirmation</li>
              <li>3. Click again within 3 seconds to confirm</li>
              <li>4. After 3 seconds, confirmation resets</li>
            </ul>
          </div>

          <div className="group">
            <Message from="DM">
              <MessageHeader>
                <div className="flex items-center gap-3">
                  <MessageAvatar name="DM" />
                  <MessageSender isDM>Dungeon Master</MessageSender>
                </div>
                <Actions>
                  <ActionDelete messageId="msg-test" onDelete={handleDelete} />
                </Actions>
              </MessageHeader>
              <MessageContent>
                <p className="text-shadow-50">This message can be deleted.</p>
              </MessageContent>
            </Message>
          </div>

          {log.length > 0 && (
            <div className="rounded-lg border border-midnight-600/60 bg-midnight-800/60 p-4">
              <p className="mb-2 text-sm font-semibold text-shadow-200">Action Log:</p>
              <div className="space-y-1">
                {log.map((entry, i) => (
                  <p key={i} className="font-mono text-sm text-shadow-400">
                    {entry}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return <DeleteDemo />;
  },
};

export const DisabledActions: Story = {
  render: () => (
    <div className="bg-midnight-950 p-8">
      <div className="group">
        <Message from="DM">
          <MessageHeader>
            <div className="flex items-center gap-3">
              <MessageAvatar name="DM" />
              <MessageSender isDM>Dungeon Master</MessageSender>
            </div>
            <Actions>
              <ActionCopy text="Content" />
              <ActionRegenerate messageId="msg-1" disabled />
              <ActionEdit messageId="msg-1" disabled />
              <ActionDelete messageId="msg-1" disabled />
            </Actions>
          </MessageHeader>
          <MessageContent>
            <p className="text-shadow-50">Some actions are disabled in this state.</p>
          </MessageContent>
        </Message>
      </div>
      <p className="mt-4 text-sm text-shadow-400">↑ Disabled actions are grayed out</p>
    </div>
  ),
};

export const InConversation: Story = {
  render: () => (
    <div className="space-y-6 bg-midnight-950 p-8">
      <div className="group">
        <Message from="DM">
          <MessageHeader>
            <div className="flex items-center gap-3">
              <MessageAvatar name="DM" />
              <MessageSender isDM>Dungeon Master</MessageSender>
            </div>
            <Actions>
              <ActionCopy text="You enter a dark tavern..." />
              <ActionRegenerate messageId="msg-1" onRegenerate={(id) => console.info('Regenerate:', id)} />
              <ActionDelete messageId="msg-1" onDelete={(id) => console.info('Delete:', id)} />
            </Actions>
          </MessageHeader>
          <MessageContent>
            <p className="text-shadow-50">You enter a dark tavern...</p>
          </MessageContent>
        </Message>
      </div>

      <div className="group">
        <Message from="user">
          <MessageHeader>
            <div className="flex items-center gap-3">
              <MessageAvatar name="Alice" />
              <MessageSender>Alice the Brave</MessageSender>
            </div>
            <Actions>
              <ActionCopy text="I order an ale" />
              <ActionEdit messageId="msg-2" onEdit={(id) => console.info('Edit:', id)} />
            </Actions>
          </MessageHeader>
          <MessageContent>
            <p className="text-shadow-50">I order an ale</p>
          </MessageContent>
        </Message>
      </div>

      <div className="group">
        <Message from="DM">
          <MessageHeader>
            <div className="flex items-center gap-3">
              <MessageAvatar name="DM" />
              <MessageSender isDM>Dungeon Master</MessageSender>
            </div>
            <Actions>
              <ActionCopy text="The bartender slides you a drink..." />
              <ActionRegenerate messageId="msg-3" onRegenerate={(id) => console.info('Regenerate:', id)} />
              <ActionDelete messageId="msg-3" onDelete={(id) => console.info('Delete:', id)} />
            </Actions>
          </MessageHeader>
          <MessageContent>
            <p className="text-shadow-50">The bartender slides you a drink...</p>
          </MessageContent>
        </Message>
      </div>

      <p className="text-sm text-shadow-400">↑ Hover over each message to see contextual actions</p>
    </div>
  ),
};
