import { describe, it, expect } from '@testing-library/react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CombatGrid } from '../CombatGrid';
import type { CombatCharacter, Position } from '../../../hooks/useCombat';

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
    onSquareClick: jest.fn(),
    onCharacterClick: jest.fn(),
  };

  it('should render grid with correct dimensions', () => {
    const { container } = render(<CombatGrid {...mockProps} />);
    
    // Grid should have 10x10 = 100 squares
    const squares = container.querySelectorAll('[class*="aspect-square"]');
    expect(squares.length).toBe(100);
  });

  it('should display character on grid', () => {
    render(<CombatGrid {...mockProps} />);
    
    // Should show character initial
    expect(screen.getByText('F')).toBeInTheDocument();
    
    // Should show HP
    expect(screen.getByText('50/50')).toBeInTheDocument();
  });

  it('should call onSquareClick when empty square clicked', () => {
    const onSquareClick = jest.fn();
    const { container } = render(
      <CombatGrid {...mockProps} onSquareClick={onSquareClick} />
    );

    // Click an empty square (not 2,2 where character is)
    const squares = container.querySelectorAll('[class*="aspect-square"]');
    if (squares[0]) {
      fireEvent.click(squares[0]);
      expect(onSquareClick).toHaveBeenCalled();
    }
  });

  it('should call onCharacterClick when character clicked', () => {
    const onCharacterClick = jest.fn();
    render(<CombatGrid {...mockProps} onCharacterClick={onCharacterClick} />);

    const characterElement = screen.getByText('F');
    fireEvent.click(characterElement.closest('[class*="aspect-square"]')!);
    
    expect(onCharacterClick).toHaveBeenCalledWith('char-1');
  });

  it('should highlight reachable squares', () => {
    const reachableSquares: Position[] = [{ x: 3, y: 3 }, { x: 4, y: 4 }];
    const { container } = render(
      <CombatGrid {...mockProps} reachableSquares={reachableSquares} />
    );

    // Reachable squares should have different styling
    const squares = container.querySelectorAll('[class*="bg-aurora"]');
    expect(squares.length).toBeGreaterThan(0);
  });
});

