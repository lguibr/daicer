import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import ChatArea from '../ChatArea';
import type { Message } from '../@daicer/engine';

// Mock useAuth
vi.mock('../../../hooks/useAuth', () => ({
  default: () => ({
    user: { uid: 'user-1' },
  }),
}));

const mockMessages: Message[] = [
  {
    id: 'msg-1',
    sender: 'DM',
    text: 'Welcome to the adventure!',
    timestamp: Date.now() - 10000,
  },
  {
    id: 'msg-2',
    sender: 'Player 1',
    text: 'I search the room.',
    timestamp: Date.now() - 5000,
  },
  {
    id: 'msg-3',
    sender: 'DM',
    text: 'You find **a hidden door** behind the tapestry!',
    timestamp: Date.now(),
  },
];

describe('ChatArea', () => {
  it('renders world description when provided', () => {
    render(<ChatArea messages={[]} worldDescription="A dark and mysterious forest" isProcessing={false} />);

    expect(screen.getByText('The World')).toBeInTheDocument();
    expect(screen.getByText('A dark and mysterious forest')).toBeInTheDocument();
  });

  it('does not render world description when empty', () => {
    render(<ChatArea messages={[]} worldDescription="" isProcessing={false} />);

    expect(screen.queryByText('The World')).not.toBeInTheDocument();
  });

  it('displays all public messages', () => {
    render(<ChatArea messages={mockMessages} worldDescription="" isProcessing={false} />);

    expect(screen.getByText('Welcome to the adventure!')).toBeInTheDocument();
    expect(screen.getByText('I search the room.')).toBeInTheDocument();
  });

  it('differentiates DM messages from player messages', () => {
    const { container } = render(<ChatArea messages={mockMessages} worldDescription="" isProcessing={false} />);

    const dmMessages = container.querySelectorAll('.justify-start');
    const playerMessages = container.querySelectorAll('.justify-end');
    expect(dmMessages.length).toBeGreaterThan(0);
    expect(playerMessages.length).toBeGreaterThan(0);
  });

  it('renders markdown in DM messages', () => {
    render(<ChatArea messages={mockMessages} worldDescription="" isProcessing={false} />);

    // The markdown-rendered content should exist
    // react-markdown will render "**a hidden door**" as <strong>
    expect(screen.getByText(/find/)).toBeInTheDocument();
  });

  it('displays timestamps for messages', () => {
    render(<ChatArea messages={mockMessages} worldDescription="" isProcessing={false} />);

    // Each message should have a timestamp
    const timestamps = screen.getAllByText(/\d{1,2}:\d{2}:\d{2}/);
    expect(timestamps.length).toBe(mockMessages.length);
  });

  it('shows private message indicator', () => {
    const privateMessage: Message = {
      id: 'msg-private',
      sender: 'DM',
      text: 'This is just for you...',
      timestamp: Date.now(),
      recipientId: 'user-1',
    };

    render(<ChatArea messages={[privateMessage]} worldDescription="" isProcessing={false} />);

    expect(screen.getByText('🔒 Your Perspective')).toBeInTheDocument();
  });

  it('filters out private messages for other players', () => {
    const privateForOther: Message = {
      id: 'msg-private-other',
      sender: 'DM',
      text: 'Secret message for someone else',
      timestamp: Date.now(),
      recipientId: 'user-2',
    };

    render(<ChatArea messages={[...mockMessages, privateForOther]} worldDescription="" isProcessing={false} />);

    expect(screen.queryByText('Secret message for someone else')).not.toBeInTheDocument();
  });

  it('shows private messages intended for current user', () => {
    const privateForUser: Message = {
      id: 'msg-private-user',
      sender: 'DM',
      text: 'Secret message for you',
      timestamp: Date.now(),
      recipientId: 'user-1',
    };

    render(<ChatArea messages={[privateForUser]} worldDescription="" isProcessing={false} />);

    expect(screen.getByText('Secret message for you')).toBeInTheDocument();
  });

  it('displays images when present', () => {
    const messageWithImage: Message = {
      id: 'msg-image',
      sender: 'DM',
      text: 'You see this scene:',
      timestamp: Date.now(),
      images: ['base64imagedata1', 'base64imagedata2'],
    };

    render(<ChatArea messages={[messageWithImage]} worldDescription="" isProcessing={false} />);

    const images = screen.getAllByAltText('Generated scene');
    expect(images).toHaveLength(2);
  });

  it('shows empty state when no messages', () => {
    render(<ChatArea messages={[]} worldDescription="" isProcessing={false} />);

    expect(screen.getByText('The adventure begins...')).toBeInTheDocument();
  });

  it('displays player names correctly', () => {
    render(<ChatArea messages={mockMessages} worldDescription="" isProcessing={false} />);

    const senders = screen.getAllByText(/DM|Player 1/);
    expect(senders.length).toBeGreaterThan(0);
    expect(screen.getByText('Player 1')).toBeInTheDocument();
  });

  it('applies private message styling', () => {
    const privateMsg: Message = {
      id: 'msg-priv',
      sender: 'DM',
      text: 'Private info',
      timestamp: Date.now(),
      recipientId: 'user-1',
    };

    render(<ChatArea messages={[privateMsg]} worldDescription="" isProcessing={false} />);

    // Private messages should have purple styling
    const privateBadge = screen.getByText('🔒 Your Perspective');
    const privateBubble = privateBadge.closest('[class*="bg-nebula-900"]');
    expect(privateBubble).not.toBeNull();
  });

  it('aligns DM messages to the left', () => {
    const { container } = render(<ChatArea messages={[mockMessages[0]]} worldDescription="" isProcessing={false} />);

    const messageContainer = container.querySelector('.justify-start');
    expect(messageContainer).toBeInTheDocument();
  });

  it('aligns player messages to the right', () => {
    const { container } = render(<ChatArea messages={[mockMessages[1]]} worldDescription="" isProcessing={false} />);

    const messageContainer = container.querySelector('.justify-end');
    expect(messageContainer).toBeInTheDocument();
  });

  it('handles plain text in player messages', () => {
    render(<ChatArea messages={[mockMessages[1]]} worldDescription="" isProcessing={false} />);

    // Player messages should render as plain text with whitespace preserved
    expect(screen.getByText('I search the room.')).toBeInTheDocument();
  });

  it('shows processing loader when inference is running', () => {
    render(<ChatArea messages={mockMessages} worldDescription="" isProcessing />);

    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });
});
