import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import userEvent from '@testing-library/user-event';
import GameplayScreen from '../GameplayScreen';
import { MemoryRouter } from 'react-router-dom';
import type { Room, Player } from '@daicer/engine';

// Mock components
vi.mock('../../terrain/TerrainExplorer', () => ({
  TerrainExplorer: ({ onTileClick }: any) => (
    <div data-testid="terrain-explorer" onClick={() => onTileClick({ x: 10, y: 10, z: 0 }, 'grass')}>
      Mock Terrain Explorer
    </div>
  ),
}));

vi.mock('../GameplayComposer', () => ({
  default: ({ onSubmit }: any) => (
    <div data-testid="gameplay-composer">
      <button onClick={() => onSubmit('Test Action')}>Send Action</button>
    </div>
  ),
}));

vi.mock('../ActionBar', () => ({
  ActionBar: ({ onActionSelect }: any) => (
    <div data-testid="action-bar">
      <button onClick={() => onActionSelect('[Action: Attack]')}>Attack</button>
    </div>
  ),
}));

vi.mock('../../room/EntityListModal', () => ({
  EntityListModal: () => <div data-testid="entity-list-modal-mock" />,
}));

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
  roomId: 'ABC123',
  documentId: 'room-doc-1',
  ownerId: 'user-1',
  phase: 'GAMEPLAY' as any, // Cast to any or import GamePhase if available
  createdAt: Date.now(),
  updatedAt: Date.now(),
  worldDescription: 'A mystical forest',
  settings: {
    language: 'en',
    difficulty: 'medium',
    worldType: 'terra',
    worldSize: 'medium',
    theme: 'fantasy',
    setting: 'test',
    tone: 'heroic',
    worldBackground: 'test',
    dmStyle: { verbosity: 3, detail: 3, engagement: 3, narrative: 3, customDirectives: '' },
    dmSystemPrompt: 'test',
    playerCount: 4,
    adventureLength: 'short',
    startingLevel: 1,
    attributePointBudget: 27,
  },
};

const mockPlayers: Player[] = [
  {
    id: 'player-1',
    userId: 'user-1',
    name: 'Alice',
    isReady: true,
    joinedAt: Date.now(),
    character: {
      name: 'Elara',
      race: 'Elf',
      characterClass: 'Wizard',
      level: 1,
      hp: 10,
      maxHp: 10,
      currentHp: 10,
      armorClass: 12,
      attributes: {
        Strength: 8,
        Dexterity: 14,
        Constitution: 12,
        Intelligence: 16,
        Wisdom: 12,
        Charisma: 10,
      },
      skills: {},
      alignment: 'Neutral Good',
      background: 'Sage',
      hitDice: { total: 1, current: 1 },
      deathSaves: { successes: 0, failures: 0 },
      initiative: 0,
      speed: 30,
      proficiencyBonus: 2,
      inspiration: false,
      savingThrows: { fortitude: 0, reflex: 0, will: 0 },
      skillDetails: [],
      expertises: [],
      baseAttackBonus: 0,
      attacks: [],
      equipment: [],
      currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
      proficienciesAndLanguages: '',
      features: '',
      talents: [],
      appearance: { age: '', height: '', weight: '', eyes: '', skin: '', hair: '', description: '' },
      personality: { traits: '', ideals: '', bonds: '', flaws: '' },
      backstory: '',
      backgroundDetails: { origin: '', upbringing: '', motivation: '', keyEvents: [] },
      alliesAndOrganizations: '',
      treasure: '',
      resourcePools: [],
      advancementPoints: { ability: 0, skill: 0, talent: 0 },
      spellcasting: { class: '', ability: '', saveDC: 0, attackBonus: 0, cantrips: [], spellsKnown: [], slots: [] },
    } as any, // Simplified cast for complex char object
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
    const composers = screen.getAllByTestId('gameplay-composer');
    expect(composers.length).toBeGreaterThan(0);
    expect(composers[0]).toBeInTheDocument();
  });

  it('shows waiting message when player has submitted', () => {
    const playersWithAction = [{ ...mockPlayers[0], action: 'I cast a spell' }, mockPlayers[1]];
    renderWithRouter(<GameplayScreen room={mockRoom} players={playersWithAction} />);

    // Actions submitted appears in both sidebar and bottom bar
    const statusElements = screen.getAllByText(/Actions submitted/i);
    expect(statusElements.length).toBeGreaterThan(0);
    expect(statusElements[0]).toBeInTheDocument();

    const countElements = screen.getAllByText(/1 \/ 2/);
    expect(countElements.length).toBeGreaterThan(0);
  });

  it('shows process turn button when all submitted and user is owner', () => {
    const allSubmitted = mockPlayers.map((p) => ({ ...p, action: 'some action' }));
    renderWithRouter(<GameplayScreen room={mockRoom} players={allSubmitted} />);

    // Check that at least one Process Turn button exists (desktop/mobile)
    const buttons = screen.getAllByRole('button', { name: /Process Turn/i });
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons[0]).toBeInTheDocument();
  });

  it('displays action count', () => {
    const partialSubmit = [{ ...mockPlayers[0], action: 'action 1' }, mockPlayers[1]];
    renderWithRouter(<GameplayScreen room={mockRoom} players={partialSubmit} />);

    const countElements = screen.getAllByText(/1 \/ 2/);
    expect(countElements.length).toBeGreaterThan(0);
  });

  it('shows "your turn" message when not submitted', () => {
    renderWithRouter(<GameplayScreen room={mockRoom} players={mockPlayers} />);
    expect(screen.getAllByText(/Your turn - submit an action/i)[0]).toBeInTheDocument();
  });

  it('does not show process turn button for non-owners', () => {
    const allSubmitted = mockPlayers.map((p) => ({ ...p, action: 'action' }));
    const nonOwnerRoom = { ...mockRoom, ownerId: 'user-2' };
    renderWithRouter(<GameplayScreen room={nonOwnerRoom} players={allSubmitted} />);

    // Should be zero buttons
    const buttons = screen.queryAllByRole('button', { name: /Process Turn/i });
    expect(buttons).toHaveLength(0);
  });
});
