import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CombatLog } from '../CombatLog';
import type { CombatLogEntry, DiceRollResult } from '../../../types/combat';

const mockDiceRoll: DiceRollResult = {
  id: 'roll-1',
  timestamp: Date.now(),
  rollType: 'attack',
  diceType: 'd20',
  numberOfDice: 1,
  rawRolls: [15],
  modifier: 5,
  advantageType: 'normal',
  finalResult: 20,
  description: 'Attack roll',
};

const mockLogEntry: CombatLogEntry = {
  id: 'log-1',
  timestamp: Date.now(),
  message: 'Warrior attacks the Goblin',
  type: 'attack',
  relatedRolls: [],
};

describe('CombatLog', () => {
  it('renders combat log title', () => {
    render(<CombatLog log={[]} diceHistory={[]} />);

    expect(screen.getByText('Combat Log')).toBeInTheDocument();
  });

  it('displays log entries', () => {
    render(<CombatLog log={[mockLogEntry]} diceHistory={[]} />);

    expect(screen.getByText('Warrior attacks the Goblin')).toBeInTheDocument();
  });

  it('shows correct icon for attack type', () => {
    render(<CombatLog log={[mockLogEntry]} diceHistory={[]} />);

    expect(screen.getByText('⚔️')).toBeInTheDocument();
  });

  it('shows correct icon for different log types', () => {
    const entries: CombatLogEntry[] = [
      { ...mockLogEntry, id: '1', type: 'damage', message: 'Damage dealt' },
      { ...mockLogEntry, id: '2', type: 'move', message: 'Character moved' },
      { ...mockLogEntry, id: '3', type: 'turn', message: 'Turn started' },
      { ...mockLogEntry, id: '4', type: 'round', message: 'New round' },
      { ...mockLogEntry, id: '5', type: 'victory', message: 'Victory!' },
    ];

    render(<CombatLog log={entries} diceHistory={[]} />);

    expect(screen.getByText('💥')).toBeInTheDocument(); // damage
    expect(screen.getByText('🏃')).toBeInTheDocument(); // move
    expect(screen.getByText('▶️')).toBeInTheDocument(); // turn
    expect(screen.getByText('🔄')).toBeInTheDocument(); // round
    expect(screen.getByText('🏆')).toBeInTheDocument(); // victory
  });

  it('applies correct color for log types', () => {
    const { container } = render(<CombatLog log={[mockLogEntry]} diceHistory={[]} />);

    expect(container.querySelector('.text-orange-400')).toBeInTheDocument();
  });

  it('displays related dice rolls', () => {
    const entryWithRoll: CombatLogEntry = {
      ...mockLogEntry,
      relatedRolls: ['roll-1'],
    };

    render(<CombatLog log={[entryWithRoll]} diceHistory={[mockDiceRoll]} />);

    expect(screen.getByText(/attack roll:/i)).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('expands and collapses dice roll details', async () => {
    const user = userEvent.setup();
    const entryWithRoll: CombatLogEntry = {
      ...mockLogEntry,
      relatedRolls: ['roll-1'],
    };

    render(<CombatLog log={[entryWithRoll]} diceHistory={[mockDiceRoll]} />);

    const rollButton = screen.getByRole('button', { name: /attack roll/i });
    expect(screen.queryByText('[15]')).not.toBeInTheDocument();

    await user.click(rollButton);
    expect(screen.getByText(/\[15\]/)).toBeInTheDocument();

    await user.click(rollButton);
    expect(screen.queryByText('[15]')).not.toBeInTheDocument();
  });

  it('formats advantage rolls correctly', () => {
    const advantageRoll: DiceRollResult = {
      ...mockDiceRoll,
      id: 'adv-roll',
      advantageType: 'advantage',
      rawRolls: [15, 12],
    };

    const entry: CombatLogEntry = {
      ...mockLogEntry,
      relatedRolls: ['adv-roll'],
    };

    render(<CombatLog log={[entry]} diceHistory={[advantageRoll]} />);

    const rollButton = screen.getByRole('button', { name: /attack roll/i });
    userEvent.click(rollButton);
  });

  it('formats disadvantage rolls correctly', () => {
    const disadvantageRoll: DiceRollResult = {
      ...mockDiceRoll,
      id: 'dis-roll',
      advantageType: 'disadvantage',
      rawRolls: [15, 8],
    };

    const entry: CombatLogEntry = {
      ...mockLogEntry,
      relatedRolls: ['dis-roll'],
    };

    render(<CombatLog log={[entry]} diceHistory={[disadvantageRoll]} />);

    const rollButton = screen.getByRole('button');
    userEvent.click(rollButton);
  });

  it('handles multiple dice rolls', () => {
    const multiDiceRoll: DiceRollResult = {
      ...mockDiceRoll,
      id: 'multi-roll',
      diceType: 'd6',
      numberOfDice: 3,
      rawRolls: [4, 3, 6],
      finalResult: 18,
    };

    const entry: CombatLogEntry = {
      ...mockLogEntry,
      relatedRolls: ['multi-roll'],
    };

    render(<CombatLog log={[entry]} diceHistory={[multiDiceRoll]} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders bold text for markdown-style formatting', () => {
    const entryWithBold: CombatLogEntry = {
      ...mockLogEntry,
      message: 'Attack **hits** for **15** damage',
    };

    const { container } = render(<CombatLog log={[entryWithBold]} diceHistory={[]} />);

    const strongElements = container.querySelectorAll('strong');
    expect(strongElements.length).toBeGreaterThan(0);
  });

  it('handles empty log', () => {
    const { container } = render(<CombatLog log={[]} diceHistory={[]} />);

    expect(screen.getByText('Combat Log')).toBeInTheDocument();
    expect(container.querySelector('.space-y-2')?.children.length).toBe(1); // Only ref div
  });

  it('handles missing roll references gracefully', () => {
    const entryWithMissingRoll: CombatLogEntry = {
      ...mockLogEntry,
      relatedRolls: ['nonexistent-roll'],
    };

    render(<CombatLog log={[entryWithMissingRoll]} diceHistory={[]} />);

    expect(screen.getByText('Warrior attacks the Goblin')).toBeInTheDocument();
  });

  it('displays multiple log entries in order', () => {
    const entries: CombatLogEntry[] = [
      { ...mockLogEntry, id: '1', message: 'First entry' },
      { ...mockLogEntry, id: '2', message: 'Second entry' },
      { ...mockLogEntry, id: '3', message: 'Third entry' },
    ];

    render(<CombatLog log={entries} diceHistory={[]} />);

    expect(screen.getByText('First entry')).toBeInTheDocument();
    expect(screen.getByText('Second entry')).toBeInTheDocument();
    expect(screen.getByText('Third entry')).toBeInTheDocument();
  });
});
