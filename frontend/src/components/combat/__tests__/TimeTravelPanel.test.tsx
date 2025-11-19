import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimeTravelPanel } from '../TimeTravelPanel';
import type { CombatHistory } from '../../../types/combat';

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
    onRestore: vi.fn(),
    isOpen: true,
    onToggle: vi.fn(),
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
    const onRestore = vi.fn();
    render(<TimeTravelPanel {...mockProps} onRestore={onRestore} />);

    const firstEntry = screen.getByText('Combat started');
    fireEvent.click(firstEntry);

    expect(onRestore).toHaveBeenCalledWith(0);
  });

  it('should navigate with prev/next buttons', () => {
    const onRestore = vi.fn();
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
    const onToggle = vi.fn();
    const { rerender } = render(<TimeTravelPanel {...mockProps} isOpen={false} onToggle={onToggle} />);

    const openButton = screen.getByTitle('Open Time Travel');
    fireEvent.click(openButton);

    expect(onToggle).toHaveBeenCalled();

    // Rerender as open
    rerender(<TimeTravelPanel {...mockProps} isOpen={true} onToggle={onToggle} />);

    const closeButton = screen.getByRole('button', { name: 'Close Time Travel' });
    expect(closeButton).toBeInTheDocument();
  });

  it('should show empty state when no history', () => {
    render(<TimeTravelPanel {...mockProps} history={[]} />);

    expect(screen.getByText('No history yet')).toBeInTheDocument();
  });

  it('should show current position indicator', () => {
    render(<TimeTravelPanel {...mockProps} currentIndex={1} />);

    expect(screen.getByText('2 / 2')).toBeInTheDocument(); // currentIndex + 1 / total
  });

  it('should display timestamp for each entry', () => {
    render(<TimeTravelPanel {...mockProps} />);

    // Timestamps should be formatted as locale time strings
    const timestamps = screen.getAllByText(/:/); // Time strings contain colons
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it('should show round information for each state', () => {
    render(<TimeTravelPanel {...mockProps} />);

    // Should show round number for each entry
    expect(screen.getAllByText(/Round 1/i)).toHaveLength(2);
  });

  it('should show alive character count', () => {
    const historyWithChars: CombatHistory[] = [
      {
        ...mockHistory[0],
        state: {
          ...mockHistory[0].state,
          characters: [
            { id: '1', hp: 10, maxHp: 10 } as any,
            { id: '2', hp: 5, maxHp: 10 } as any,
            { id: '3', hp: 0, maxHp: 10 } as any,
          ],
        },
      },
    ];

    render(<TimeTravelPanel {...mockProps} history={historyWithChars} />);

    expect(screen.getByText(/2 alive/i)).toBeInTheDocument();
  });

  it('should apply different styles to past, current, and future entries', () => {
    const { container } = render(<TimeTravelPanel {...mockProps} currentIndex={1} />);

    // Current entry should have special styling
    const currentEntry = container.querySelector('.bg-nebula-900\\/30');
    expect(currentEntry).toBeInTheDocument();
  });

  it('should render as floating button when closed', () => {
    render(<TimeTravelPanel {...mockProps} isOpen={false} />);

    const button = screen.getByTitle('Open Time Travel');
    expect(button).toHaveClass('fixed', 'bottom-4', 'right-4');
  });

  it('should handle next button navigation', () => {
    const onRestore = vi.fn();
    render(<TimeTravelPanel {...mockProps} onRestore={onRestore} currentIndex={0} />);

    const nextButton = screen.getByText('Next →');
    fireEvent.click(nextButton);

    expect(onRestore).toHaveBeenCalledWith(1);
  });

  it('should not navigate beyond bounds', () => {
    const onRestore = vi.fn();
    render(<TimeTravelPanel {...mockProps} onRestore={onRestore} currentIndex={0} />);

    const prevButton = screen.getByText('← Prev');
    expect(prevButton).toBeDisabled();

    // Disabled button shouldn't trigger click
    fireEvent.click(prevButton);
    expect(onRestore).not.toHaveBeenCalled();
  });

  it('should show timeline with visual dots', () => {
    const { container } = render(<TimeTravelPanel {...mockProps} />);

    // Timeline should have dots for each entry
    const dots = container.querySelectorAll('.rounded-full.border-2');
    expect(dots.length).toBe(2);
  });

  it('should highlight current entry dot', () => {
    const { container } = render(<TimeTravelPanel {...mockProps} currentIndex={1} />);

    // Current entry dot should have nebula color
    const currentDot = container.querySelector('.bg-nebula-500');
    expect(currentDot).toBeInTheDocument();
  });

  it('should handle hover state on entries', () => {
    const { container } = render(<TimeTravelPanel {...mockProps} />);

    const entries = container.querySelectorAll('[class*="cursor-pointer"]');
    expect(entries.length).toBeGreaterThan(0);
  });

  it('should display close button when open', () => {
    render(<TimeTravelPanel {...mockProps} isOpen={true} />);

    const closeButtons = screen.getAllByRole('button');
    expect(closeButtons.some((btn) => btn.querySelector('svg'))).toBe(true);
  });
});
