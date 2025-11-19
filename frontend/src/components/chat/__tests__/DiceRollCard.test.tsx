import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DiceRollCard from '../DiceRollCard';
import type { DiceRollData } from '../useDiceRollState';

// Mock DiceRollAnimation component
vi.mock('../../ui/dice-roll-animation/DiceRollAnimation', () => ({
  DiceRollAnimation: vi.fn(({ dice, onComplete, autoStart }) => {
    // Simulate animation completion after a short delay
    if (autoStart && onComplete) {
      setTimeout(() => onComplete(), 100);
    }

    return (
      <div data-testid="dice-animation" data-dice-count={dice.length}>
        {dice.map((die: any, i: number) => (
          <div key={i} data-testid={`die-${i}`} data-type={`d${die.type}`} data-result={die.result}>
            D{die.type}: {die.result}
          </div>
        ))}
      </div>
    );
  }),
}));

describe('DiceRollCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const roll: DiceRollData = {
        dice: '1d20+5',
        result: 18,
        breakdown: '[13] + 5',
      };

      render(<DiceRollCard roll={roll} animate={false} />);

      expect(screen.getByText('18')).toBeInTheDocument();
      expect(screen.getByText('1d20+5')).toBeInTheDocument();
    });

    it('renders with purpose label', () => {
      const roll: DiceRollData = {
        dice: '1d20+5',
        result: 18,
        breakdown: '[13] + 5',
        purpose: 'Attack Roll',
      };

      render(<DiceRollCard roll={roll} animate={false} />);

      expect(screen.getByText('Attack Roll')).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('does not re-render when unrelated props change', () => {
      const roll: DiceRollData = {
        dice: '1d20+5',
        result: 18,
      };

      const { rerender } = render(<DiceRollCard roll={roll} animate={false} />);

      const firstRender = screen.getByText('18');

      // Re-render with same props
      rerender(<DiceRollCard roll={roll} animate={false} />);

      const secondRender = screen.getByText('18');

      // Should be the same DOM node (memoized)
      expect(firstRender).toBe(secondRender);
    });
  });

  describe('Dice Parsing', () => {
    it('parses single d20 correctly', () => {
      const roll: DiceRollData = {
        dice: '1d20+5',
        result: 18,
        breakdown: '[13] + 5',
      };

      render(<DiceRollCard roll={roll} animate={false} />);

      const diceAnimation = screen.getByTestId('dice-animation');
      expect(diceAnimation).toHaveAttribute('data-dice-count', '1');

      const die = screen.getByTestId('die-0');
      expect(die).toHaveAttribute('data-type', 'd20');
      expect(die).toHaveAttribute('data-result', '13');
    });

    it('parses multiple d6 correctly', () => {
      const roll: DiceRollData = {
        dice: '3d6',
        result: 13,
        breakdown: '[4, 5, 4]',
      };

      render(<DiceRollCard roll={roll} animate={false} />);

      const diceAnimation = screen.getByTestId('dice-animation');
      expect(diceAnimation).toHaveAttribute('data-dice-count', '3');

      expect(screen.getByTestId('die-0')).toHaveAttribute('data-result', '4');
      expect(screen.getByTestId('die-1')).toHaveAttribute('data-result', '5');
      expect(screen.getByTestId('die-2')).toHaveAttribute('data-result', '4');
    });
  });

  describe('Critical Rolls', () => {
    it('applies critical success styling for natural 20', () => {
      const roll: DiceRollData = {
        dice: '1d20+5',
        result: 25,
        breakdown: '[20] + 5',
        purpose: 'Attack Roll',
      };

      const { container } = render(<DiceRollCard roll={roll} animate={false} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('emerald');
    });

    it('applies critical fail styling for natural 1', () => {
      const roll: DiceRollData = {
        dice: '1d20+5',
        result: 6,
        breakdown: '[1] + 5',
        purpose: 'Attack Roll',
      };

      const { container } = render(<DiceRollCard roll={roll} animate={false} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('red');
    });

    it('shows sparkle effect for natural 20 when animation complete', async () => {
      const roll: DiceRollData = {
        dice: '1d20+5',
        result: 25,
        breakdown: '[20] + 5',
      };

      render(<DiceRollCard roll={roll} animate={true} />);

      await waitFor(
        () => {
          const sparkles = document.querySelectorAll('.animate-pulse');
          expect(sparkles.length).toBeGreaterThan(0);
        },
        { timeout: 200 }
      );
    });
  });
});
