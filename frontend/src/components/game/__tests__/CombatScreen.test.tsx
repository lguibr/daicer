import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CombatScreen } from '../CombatScreen';

// Mock useCombat hook
const mockUseCombat = vi.fn();
vi.mock('../../../hooks/useCombat', () => ({
  useCombat: () => mockUseCombat(),
}));

describe('CombatScreen', () => {
  it('shows "no active combat" when combatState is null', () => {
    mockUseCombat.mockReturnValue({
      combatState: null,
      history: [],
      attack: vi.fn(),
      move: vi.fn(),
      endTurn: vi.fn(),
      restoreState: vi.fn(),
      getActiveCharacter: vi.fn(() => null),
    });

    render(<CombatScreen roomId="test-room" players={[]} />);

    expect(screen.getByText('No active combat')).toBeInTheDocument();
    expect(screen.getByText(/Combat will begin when initiated/i)).toBeInTheDocument();
  });

  it('renders combat UI when combatState exists', () => {
    mockUseCombat.mockReturnValue({
      combatState: {
        sessionId: 'test',
        characters: [],
        activeCharacterId: null,
        turnOrder: [],
        round: 1,
        isCombatOver: false,
        winner: null,
        log: [],
        diceHistory: [],
        gridWidth: 10,
        gridHeight: 10,
        phase: 'combat',
        pendingOpportunityAttacks: [],
        diceRollerSeed: 42,
      },
      history: [],
      attack: vi.fn(),
      move: vi.fn(),
      endTurn: vi.fn(),
      restoreState: vi.fn(),
      getActiveCharacter: vi.fn(() => null),
    });

    render(<CombatScreen roomId="test-room" players={[]} />);

    expect(screen.getByText('⚔️ Combat')).toBeInTheDocument();
  });

  it('displays current round number', () => {
    mockUseCombat.mockReturnValue({
      combatState: {
        sessionId: 'test',
        characters: [],
        activeCharacterId: null,
        turnOrder: [],
        round: 3,
        isCombatOver: false,
        winner: null,
        log: [],
        diceHistory: [],
        gridWidth: 10,
        gridHeight: 10,
        phase: 'combat',
        pendingOpportunityAttacks: [],
        diceRollerSeed: 42,
      },
      history: [],
      attack: vi.fn(),
      move: vi.fn(),
      endTurn: vi.fn(),
      restoreState: vi.fn(),
      getActiveCharacter: vi.fn(() => null),
    });

    render(<CombatScreen roomId="test-room" players={[]} />);

    expect(screen.getByText(/Round 3/)).toBeInTheDocument();
  });

  it('shows victory overlay when combat is over', () => {
    mockUseCombat.mockReturnValue({
      combatState: {
        sessionId: 'test',
        characters: [],
        activeCharacterId: null,
        turnOrder: [],
        round: 5,
        isCombatOver: true,
        winner: 'player',
        log: [],
        diceHistory: [],
        gridWidth: 10,
        gridHeight: 10,
        phase: 'combat',
        pendingOpportunityAttacks: [],
        diceRollerSeed: 42,
      },
      history: [],
      attack: vi.fn(),
      move: vi.fn(),
      endTurn: vi.fn(),
      restoreState: vi.fn(),
      getActiveCharacter: vi.fn(() => null),
    });

    render(<CombatScreen roomId="test-room" players={[]} />);

    expect(screen.getByText('Combat Complete!')).toBeInTheDocument();
    expect(screen.getByText('The party is victorious!')).toBeInTheDocument();
  });

  it('shows defeat message when enemies win', () => {
    mockUseCombat.mockReturnValue({
      combatState: {
        sessionId: 'test',
        characters: [],
        activeCharacterId: null,
        turnOrder: [],
        round: 5,
        isCombatOver: true,
        winner: 'enemy',
        log: [],
        diceHistory: [],
        gridWidth: 10,
        gridHeight: 10,
        phase: 'combat',
        pendingOpportunityAttacks: [],
        diceRollerSeed: 42,
      },
      history: [],
      attack: vi.fn(),
      move: vi.fn(),
      endTurn: vi.fn(),
      restoreState: vi.fn(),
      getActiveCharacter: vi.fn(() => null),
    });

    render(<CombatScreen roomId="test-room" players={[]} />);

    expect(screen.getByText('The enemies have won...')).toBeInTheDocument();
  });

  it('renders player and enemy sections', () => {
    mockUseCombat.mockReturnValue({
      combatState: {
        sessionId: 'test',
        characters: [
// eslint-disable-next-line @typescript-eslint/no-explicit-any
          { id: '1', name: 'Fighter', isPlayer: true, conditions: [], position: { x: 1, y: 1 }, hp: 30 } as any,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
          { id: '2', name: 'Goblin', isPlayer: false, conditions: [], position: { x: 5, y: 5 }, hp: 15 } as any,
        ],
        activeCharacterId: null,
        turnOrder: [],
        round: 1,
        isCombatOver: false,
        winner: null,
        log: [],
        diceHistory: [],
        gridWidth: 10,
        gridHeight: 10,
        phase: 'combat',
        pendingOpportunityAttacks: [],
        diceRollerSeed: 42,
      },
      history: [],
      attack: vi.fn(),
      move: vi.fn(),
      endTurn: vi.fn(),
      restoreState: vi.fn(),
      getActiveCharacter: vi.fn(() => null),
    });

    render(<CombatScreen roomId="test-room" players={[]} />);

    expect(screen.getByText('PLAYERS')).toBeInTheDocument();
    expect(screen.getByText('ENEMIES')).toBeInTheDocument();
  });

  it('includes combat log', () => {
    mockUseCombat.mockReturnValue({
      combatState: {
        sessionId: 'test',
        characters: [],
        activeCharacterId: null,
        turnOrder: [],
        round: 1,
        isCombatOver: false,
        winner: null,
        log: [],
        diceHistory: [],
        gridWidth: 10,
        gridHeight: 10,
        phase: 'combat',
        pendingOpportunityAttacks: [],
        diceRollerSeed: 42,
      },
      history: [],
      attack: vi.fn(),
      move: vi.fn(),
      endTurn: vi.fn(),
      restoreState: vi.fn(),
      getActiveCharacter: vi.fn(() => null),
    });

    render(<CombatScreen roomId="test-room" players={[]} />);

    expect(screen.getByText('Combat Log')).toBeInTheDocument();
  });

  it('renders end turn button', () => {
    mockUseCombat.mockReturnValue({
      combatState: {
        sessionId: 'test',
        characters: [],
        activeCharacterId: null,
        turnOrder: [],
        round: 1,
        isCombatOver: false,
        winner: null,
        log: [],
        diceHistory: [],
        gridWidth: 10,
        gridHeight: 10,
        phase: 'combat',
        pendingOpportunityAttacks: [],
        diceRollerSeed: 42,
      },
      history: [],
      attack: vi.fn(),
      move: vi.fn(),
      endTurn: vi.fn(),
      restoreState: vi.fn(),
      getActiveCharacter: vi.fn(() => null),
    });

    render(<CombatScreen roomId="test-room" players={[]} />);

    expect(screen.getByText('End Turn')).toBeInTheDocument();
  });
});
