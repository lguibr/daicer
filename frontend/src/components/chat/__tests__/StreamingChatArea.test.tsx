/**
 * Tests for StreamingChatArea component
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StreamingChatArea from '../StreamingChatArea';
import type { Message } from '../@daicer/engine';
import type { PresenceData } from '../../../services/socket';

// Mock dependencies
vi.mock('../../../hooks/useAuth', () => ({
  default: () => ({ user: { uid: 'user-123' } }),
}));

vi.mock('../../../i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('../../game/MarkdownMessage', () => ({
  default: ({ content }: { content: string }) => <div>{content}</div>,
}));

describe('StreamingChatArea', () => {
  const mockMessages: Message[] = [
    {
      id: 'msg-1',
      sender: 'DM',
      text: 'Welcome to the tavern!',
      timestamp: Date.now(),
    },
    {
      id: 'msg-2',
      sender: 'Alice',
      text: 'I look around',
      timestamp: Date.now(),
    },
  ];

  const mockStreamingMessages = new Map<string, string>([['msg-3', 'The tavern is bustling with...']]);

  const mockPresence: PresenceData[] = [
    {
      userId: 'dm-system',
      userName: 'DM',
      type: 'generating',
      timestamp: Date.now(),
      metadata: { message: 'DM is thinking...' },
    },
  ];

  it('should render messages', () => {
    render(
      <StreamingChatArea
        messages={mockMessages}
        streamingMessages={new Map()}
        worldDescription=""
        isProcessing={false}
        presence={[]}
      />
    );

    expect(screen.getByText('Welcome to the tavern!')).toBeInTheDocument();
    expect(screen.getByText('I look around')).toBeInTheDocument();
  });

  it('should show streaming messages', () => {
    render(
      <StreamingChatArea
        messages={mockMessages}
        streamingMessages={mockStreamingMessages}
        worldDescription=""
        isProcessing={false}
        presence={[]}
      />
    );

    expect(screen.getByText(/The tavern is bustling with/)).toBeInTheDocument();
    expect(screen.getByText('Streaming...')).toBeInTheDocument();
  });

  it('should show DM presence indicator', () => {
    render(
      <StreamingChatArea
        messages={mockMessages}
        streamingMessages={new Map()}
        worldDescription=""
        isProcessing={false}
        presence={mockPresence}
      />
    );

    expect(screen.getByText('DM is thinking...')).toBeInTheDocument();
  });

  it('should show world description', () => {
    render(
      <StreamingChatArea
        messages={mockMessages}
        streamingMessages={new Map()}
        worldDescription="A dark fantasy world..."
        isProcessing={false}
        presence={[]}
      />
    );

    expect(screen.getByText('A dark fantasy world...')).toBeInTheDocument();
  });

  it('should filter private messages', () => {
    const messagesWithPrivate: Message[] = [
      ...mockMessages,
      {
        id: 'msg-private',
        sender: 'DM',
        text: 'Secret message',
        timestamp: Date.now(),
        recipientId: 'other-user',
      },
    ];

    render(
      <StreamingChatArea
        messages={messagesWithPrivate}
        streamingMessages={new Map()}
        worldDescription=""
        isProcessing={false}
        presence={[]}
      />
    );

    expect(screen.queryByText('Secret message')).not.toBeInTheDocument();
  });
});
