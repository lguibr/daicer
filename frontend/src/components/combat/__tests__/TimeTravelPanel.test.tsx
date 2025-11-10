import { describe, it, expect } from '@testing-library/react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimeTravelPanel } from '../TimeTravelPanel';
import type { CombatHistory } from '../../../hooks/useCombat';

describe('TimeTravelPanel', () => {
  const mockHistory: CombatHistory[] = [
    {
      timestamp: 1000,
      description: 'Combat started',
      state: {
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
        phase: 'setup',
        pendingOpportunityAttacks: [],
        diceRollerSeed: 42,
      },
    },
    {
      timestamp: 2000,
      description: 'Turn started',
      state: {
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
        phase: 'turn_start',
        pendingOpportunityAttacks: [],
        diceRollerSeed: 42,
      },
    },
  ];

  const mockProps = {
    history: mockHistory,
    currentIndex: 1,
    onRestore: jest.fn(),
    isOpen: true,
    onToggle: jest.fn(),
  };

  it('should render when open', () => {
    render(<TimeTravelPanel {...mockProps} />);
    
    expect(screen.getByText('Time Travel')).toBeInTheDocument();
  });

  it('should display history entries', () => {
    render(<TimeTravelPanel {...mockProps} />);
    
    expect(screen.getByText('Combat started')).toBeInTheDocument();
    expect(screen.getByText('Turn started')).toBeInTheDocument();
  });

  it('should call onRestore when entry clicked', () => {
    const onRestore = jest.fn();
    render(<TimeTravelPanel {...mockProps} onRestore={onRestore} />);

    const firstEntry = screen.getByText('Combat started');
    fireEvent.click(firstEntry);
    
    expect(onRestore).toHaveBeenCalledWith(0);
  });

  it('should navigate with prev/next buttons', () => {
    const onRestore = jest.fn();
    render(<TimeTravelPanel {...mockProps} onRestore={onRestore} currentIndex={1} />);

    const prevButton = screen.getByText('← Prev');
    fireEvent.click(prevButton);
    
    expect(onRestore).toHaveBeenCalledWith(0);
  });

  it('should disable prev button at start', () => {
    render(<TimeTravelPanel {...mockProps} currentIndex={0} />);

    const prevButton = screen.getByText('← Prev');
    expect(prevButton).toBeDisabled();
  });

  it('should disable next button at end', () => {
    render(<TimeTravelPanel {...mockProps} currentIndex={1} />);

    const nextButton = screen.getByText('Next →');
    expect(nextButton).toBeDisabled();
  });

  it('should toggle open/closed state', () => {
    const onToggle = jest.fn();
    const { rerender } = render(
      <TimeTravelPanel {...mockProps} isOpen={false} onToggle={onToggle} />
    );

    const openButton = screen.getByTitle('Open Time Travel');
    fireEvent.click(openButton);
    
    expect(onToggle).toHaveBeenCalled();

    // Rerender as open
    rerender(<TimeTravelPanel {...mockProps} isOpen={true} onToggle={onToggle} />);
    
    const closeButton = screen.getByRole('button', { name: '' }); // X button
    expect(closeButton).toBeInTheDocument();
  });

  it('should show empty state when no history', () => {
    render(<TimeTravelPanel {...mockProps} history={[]} />);
    
    expect(screen.getByText('No history yet')).toBeInTheDocument();
  });
});

