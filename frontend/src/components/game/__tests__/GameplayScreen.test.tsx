import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import userEvent from '@testing-library/user-event';
import GameplayScreen from '../GameplayScreen';
import { MemoryRouter } from 'react-router-dom';
import type { Room, Player } from '@daicer/shared';

// Mock hooks
vi.mock('../../../hooks/useAuth', () => ({
  default: () => ({
    user: { uid: 'user-1' },
  }),
}));

vi.mock('../../../hooks/useSocket', () => ({
  default: () => ({
    messages: [],
    creatures: [],
  }),
}));

vi.mock('../../../services/socket', () => ({
  submitAction: vi.fn(),
  processTurn: vi.fn(),
  getSocket: vi.fn(() => null),
  disconnectSocket: vi.fn(),
  sendTypingIndicator: vi.fn(),
}));

// Mock ChunkLoader service to prevent network requests
vi.mock('../../../contexts/infinite-chunks/services/chunkLoader', () => ({
  loadChunk: vi.fn(() =>
    Promise.resolve({
      x: 0,
      y: 0,
      tiles: [],
      structures: [],
      features: [],
      biomes: [],
      chunkSize: 16,
      isLoaded: true,
    })
  ),
  getChunksToLoad: vi.fn(() => []),
  getMaxConcurrentLoads: vi.fn(() => 2),
}));

const mockRoom: Room = {
  id: 'room-1',
  code: 'ABC123',
  ownerId: 'user-1',
  phase: 'GAMEPLAY',
  createdAt: Date.now(),
  worldDescription: 'A mystical forest',
  settings: {
    language: 'en',
    difficulty: 'medium',
  },
};

const mockPlayers: Player[] = [
  {
    id: 'player-1',
    userId: 'user-1',
    name: 'Alice',
    character: {
      name: 'Elara',
      race: 'Elf',
      characterClass: 'Wizard',
      level: 1,
      hp: 10,
      maxHp: 10,
      armorClass: 12,
      attributes: {
        Strength: 8,
        Dexterity: 14,
        Constitution: 12,
        Intelligence: 16,
        Wisdom: 12,
        Charisma: 10,
      },
      skills: [],
      alignment: 'Neutral Good',
      background: 'Sage',
    },
    action: null,
  },
  {
    id: 'player-2',
    userId: 'user-2',
    name: 'Bob',
    character: {
      name: 'Thrain',
      race: 'Dwarf',
      characterClass: 'Fighter',
      level: 1,
      hp: 12,
      maxHp: 12,
      armorClass: 16,
      attributes: {
        Strength: 16,
        Dexterity: 12,
        Constitution: 14,
        Intelligence: 10,
        Wisdom: 10,
        Charisma: 8,
      },
      skills: [],
      alignment: 'Lawful Good',
      background: 'Soldier',
    },
    action: null,
  },
];

beforeAll(() => {
  Object.defineProperty(window.HTMLElement.prototype, 'scrollTo', {
    value: vi.fn(),
    configurable: true,
    writable: true,
  });
});

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('GameplayScreen', () => {
  it('renders action input when player has not submitted', () => {
    renderWithRouter(<GameplayScreen room={mockRoom} players={mockPlayers} />);

    // "What do you do?" appears in both floating logic and potentially other places (like chat placeholder?)
    // Using getAllByPlaceholderText to be safe
    const inputs = screen.getAllByPlaceholderText(/What do you do/i);
    expect(inputs.length).toBeGreaterThan(0);
    expect(inputs[0]).toBeInTheDocument();
    expect(screen.getAllByTitle(/Send message \(Enter\)|Cannot send/i)[0]).toBeInTheDocument();
  });

  it('shows waiting message when player has submitted', () => {
    const playersWithAction = [{ ...mockPlayers[0], action: 'I cast a spell' }, mockPlayers[1]];

    renderWithRouter(<GameplayScreen room={mockRoom} players={playersWithAction} />);

    expect(screen.getAllByText(/Action submitted/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Waiting for turn to process/i)[0]).toBeInTheDocument();
  });

  it('shows process turn button when all submitted and user is owner', () => {
    const allSubmitted = mockPlayers.map((p) => ({ ...p, action: 'some action' }));

    renderWithRouter(<GameplayScreen room={mockRoom} players={allSubmitted} />);

    expect(screen.getAllByText('Process Turn')[0]).toBeInTheDocument();
  });

  it('displays action count', () => {
    const partialSubmit = [{ ...mockPlayers[0], action: 'action 1' }, mockPlayers[1]];

    renderWithRouter(<GameplayScreen room={mockRoom} players={partialSubmit} />);

    const actionCounts = screen.getAllByText(/Actions submitted\s*:\s*1\s*\/\s*2/i);
    expect(actionCounts.length).toBeGreaterThanOrEqual(1);
  });

  it('ignores whitespace-only actions', () => {
    const whitespaceActions = [
      { ...mockPlayers[0], action: '   ' },
      { ...mockPlayers[1], action: 'I scout ahead' },
    ];

    renderWithRouter(<GameplayScreen room={mockRoom} players={whitespaceActions} />);

    expect(screen.getAllByPlaceholderText(/What do you do/i)[0]).toBeInTheDocument();
    const counts = screen.getAllByText(/Actions submitted\s*:\s*1\s*\/\s*2/i);
    expect(counts.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Process Turn')).not.toBeInTheDocument();
  });

  it('shows "your turn" message when not submitted', () => {
    renderWithRouter(<GameplayScreen room={mockRoom} players={mockPlayers} />);

    expect(screen.getAllByText(/Your turn - submit an action/i)[0]).toBeInTheDocument();
  });

  it('shows "waiting for others" when current player submitted but not all', () => {
    const partialSubmit = [{ ...mockPlayers[0], action: 'I attack' }, mockPlayers[1]];

    renderWithRouter(<GameplayScreen room={mockRoom} players={partialSubmit} />);

    expect(screen.getAllByText(/Waiting for others/i)[0]).toBeInTheDocument();
  });

  it('shows "ready to process" when all submitted', () => {
    const allSubmitted = mockPlayers.map((p) => ({ ...p, action: 'action' }));

    renderWithRouter(<GameplayScreen room={mockRoom} players={allSubmitted} />);

    expect(screen.getAllByText(/Ready to process turn/i)[0]).toBeInTheDocument();
  });

  it('submit button is disabled when input is empty', () => {
    renderWithRouter(<GameplayScreen room={mockRoom} players={mockPlayers} />);

    const submitButton = screen.getAllByTitle(/Cannot send/i)[0];
    expect(submitButton).toBeDisabled();
  });

  it('submit button is enabled when input has text', async () => {
    const user = userEvent.setup();
    renderWithRouter(<GameplayScreen room={mockRoom} players={mockPlayers} />);

    const input = screen.getAllByPlaceholderText(/What do you do/i)[0];
    await user.clear(input);
    await user.type(input, 'I search the room');

    const submitButton = screen.getAllByTitle(/Send message \(Enter\)/i)[0];
    expect(submitButton).not.toBeDisabled();
  });

  it('shows player sidebar on desktop', () => {
    const { container } = renderWithRouter(<GameplayScreen room={mockRoom} players={mockPlayers} />);

    // Sidebar should be hidden on mobile but visible on desktop (lg:flex)
    const sidebar = container.querySelector('.lg\\:flex');
    expect(sidebar).toBeInTheDocument();
  });

  it('does not show process turn button for non-owners', () => {
    const allSubmitted = mockPlayers.map((p) => ({ ...p, action: 'action' }));
    const nonOwnerRoom = { ...mockRoom, ownerId: 'user-2' };

    renderWithRouter(<GameplayScreen room={nonOwnerRoom} players={allSubmitted} />);

    expect(screen.queryByText('Process Turn')).not.toBeInTheDocument();
  });

  it('handles typing in action textarea', async () => {
    const user = userEvent.setup();
    renderWithRouter(<GameplayScreen room={mockRoom} players={mockPlayers} />);

    const textarea = screen.getAllByPlaceholderText(/What do you do/i)[0];
    await user.clear(textarea);
    await user.type(textarea, 'I investigate the door');

    expect(textarea).toHaveValue('I investigate the door');
  });
});
