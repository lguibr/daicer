import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CombatGrid } from '../CombatGrid';
import { I18nProvider } from '../../../i18n';
import type { CombatCharacter, Position } from '../../../types/combat';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderWithProviders = (ui: React.ReactNode, options?: any) => {
  return render(<I18nProvider>{ui}</I18nProvider>, options);
};

describe('CombatGrid', () => {
  const mockCharacters: CombatCharacter[] = [
    {
      id: 'char-1',
      name: 'Fighter',
      hp: 50,
      maxHp: 50,
      tempHp: 0,
      armorClass: 16,
      position: { x: 2, y: 2 },
      initiative: 15,
      avatar: '',
      isPlayer: true,
      strength: 16,
      dexterity: 12,
      constitution: 14,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      proficiencyBonus: 2,
      speed: 6,
      reach: 1,
      hasMoved: false,
      hasActed: false,
      hasReaction: true,
      hasBonusAction: true,
      movementRemaining: 6,
      conditions: [],
    },
  ];

  const mockProps = {
    characters: mockCharacters,
    gridWidth: 10,
    gridHeight: 10,
    activeCharacterId: 'char-1',
    selectedCharacterId: null,
    reachableSquares: [] as Position[],
    onSquareClick: vi.fn(),
    onCharacterClick: vi.fn(),
  };

  it('should render grid with correct dimensions', () => {
    const { container } = renderWithProviders(<CombatGrid {...mockProps} />);

    // Grid should have 10x10 = 100 squares
    const squares = container.querySelectorAll('[class*="aspect-square"]');
    expect(squares.length).toBe(100);
  });

  it('should display character on grid', () => {
    renderWithProviders(<CombatGrid {...mockProps} />);

    // Should show character initial
    expect(screen.getByText('F')).toBeInTheDocument();

    // Should show HP
    expect(screen.getByText('50/50')).toBeInTheDocument();
  });

  it('should call onSquareClick when empty square clicked', () => {
    const onSquareClick = vi.fn();
    const { container } = renderWithProviders(<CombatGrid {...mockProps} onSquareClick={onSquareClick} />);

    // Click an empty square (not 2,2 where character is)
    const squares = container.querySelectorAll('[class*="aspect-square"]');
    if (squares[0]) {
      fireEvent.click(squares[0]);
      expect(onSquareClick).toHaveBeenCalled();
    }
  });

  it('should call onCharacterClick when character clicked', () => {
    const onCharacterClick = vi.fn();
    renderWithProviders(<CombatGrid {...mockProps} onCharacterClick={onCharacterClick} />);

    const characterElement = screen.getByText('F');
    fireEvent.click(characterElement.closest('[class*="aspect-square"]')!);

    expect(onCharacterClick).toHaveBeenCalledWith('char-1');
  });

  it('should highlight reachable squares', () => {
    const reachableSquares: Position[] = [
      { x: 3, y: 3 },
      { x: 4, y: 4 },
    ];
    const { container } = renderWithProviders(<CombatGrid {...mockProps} reachableSquares={reachableSquares} />);

    // Reachable squares should have different styling
    const squares = container.querySelectorAll('[class*="bg-aurora"]');
    expect(squares.length).toBeGreaterThan(0);
  });

  it('should highlight active character', () => {
    const { container } = renderWithProviders(<CombatGrid {...mockProps} />);

    // Active character should have ring styling
    const activeSquares = container.querySelectorAll('[class*="ring-nebula"]');
    expect(activeSquares.length).toBeGreaterThan(0);
  });

  it('should highlight selected character', () => {
    const { container } = renderWithProviders(<CombatGrid {...mockProps} selectedCharacterId="char-1" />);

    // Selected character should have ring styling
    const selectedSquares = container.querySelectorAll('[class*="ring-aurora"]');
    expect(selectedSquares.length).toBeGreaterThan(0);
  });

  it('should display coordinates on squares', () => {
    const { container } = renderWithProviders(<CombatGrid {...mockProps} />);

    // Should show coordinates in top-left of squares
    expect(screen.getByText('0,0')).toBeInTheDocument();
    expect(screen.getByText('2,2')).toBeInTheDocument();
  });

  it('should differentiate between player and enemy characters', () => {
    const enemyChar: CombatCharacter = {
      ...mockCharacters[0],
      id: 'enemy-1',
      name: 'Goblin',
      isPlayer: false,
      position: { x: 5, y: 5 },
    };

    const { container } = renderWithProviders(
      <CombatGrid {...mockProps} characters={[...mockCharacters, enemyChar]} />
    );

    // Player character should have aurora background
    const playerAvatar = container.querySelector('.bg-aurora-500');
    expect(playerAvatar).toBeInTheDocument();

    // Enemy character should have red background
    const enemyAvatar = container.querySelector('.bg-red-600');
    expect(enemyAvatar).toBeInTheDocument();
  });

  it('should not display dead characters', () => {
    const deadChar: CombatCharacter = {
      ...mockCharacters[0],
      hp: 0,
      position: { x: 3, y: 3 },
    };

    const { container } = renderWithProviders(<CombatGrid {...mockProps} characters={[deadChar]} />);

    // Dead character at 3,3 should not be shown
    const squares = container.querySelectorAll('[class*="aspect-square"]');
    const square33 = squares[33]; // Assuming row-major order
    expect(square33?.textContent).not.toContain('F');
  });

  it('should render with different grid sizes', () => {
    const { container, rerender } = renderWithProviders(<CombatGrid {...mockProps} gridWidth={5} gridHeight={5} />);

    let squares = container.querySelectorAll('[class*="aspect-square"]');
    expect(squares.length).toBe(25);

    rerender(
      <I18nProvider>
        <CombatGrid {...mockProps} gridWidth={15} gridHeight={20} />
      </I18nProvider>
    );
    squares = container.querySelectorAll('[class*="aspect-square"]');
    expect(squares.length).toBe(300);
  });

  it('should handle multiple characters on grid', () => {
    const characters: CombatCharacter[] = [
      mockCharacters[0],
      { ...mockCharacters[0], id: 'char-2', name: 'Wizard', position: { x: 4, y: 4 } },
      { ...mockCharacters[0], id: 'char-3', name: 'Rogue', position: { x: 6, y: 6 } },
    ];

    renderWithProviders(<CombatGrid {...mockProps} characters={characters} />);

    expect(screen.getByText('F')).toBeInTheDocument();
    expect(screen.getByText('W')).toBeInTheDocument();
    expect(screen.getByText('R')).toBeInTheDocument();
  });

  it('should update when reachable squares change', () => {
    const { container, rerender } = renderWithProviders(<CombatGrid {...mockProps} reachableSquares={[]} />);

    let reachableSquares = container.querySelectorAll('[class*="bg-aurora-9"]');
    expect(reachableSquares.length).toBe(0);

    rerender(
      <I18nProvider>
        <CombatGrid
          {...mockProps}
          reachableSquares={[
            { x: 1, y: 1 },
            { x: 2, y: 1 },
          ]}
        />
      </I18nProvider>
    );
    reachableSquares = container.querySelectorAll('[class*="bg-aurora-9"]');
    expect(reachableSquares.length).toBeGreaterThan(0);
  });
});
