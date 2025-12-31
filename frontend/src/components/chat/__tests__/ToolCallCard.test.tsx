/**
 * Tests for ToolCallCard component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ToolCallCard from '../ToolCallCard';
import type { ToolCall } from '../../../services/socket';
// Mock DiceRollCard to avoid Three.js initialization in JSDOM
import { vi } from 'vitest';

vi.mock('../DiceRollCard', () => ({
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ roll }: { roll: any }) => (
    <div data-testid="mock-dice-roll">
      Mock Roll: {roll.dice} = {roll.result}
    </div>
  ),
}));

describe('ToolCallCard', () => {
  const diceToolCall: ToolCall = {
    id: 'tool-1',
    toolName: 'roll_dice',
    parameters: { dice: '1d20', modifier: 5 },
    result: { total: 18, breakdown: '[13] + 5' },
    timestamp: Date.now(),
  };

  const genericToolCall: ToolCall = {
    id: 'tool-2',
    toolName: 'lookup_rule',
    parameters: { rule: 'stealth' },
    result: 'Stealth check details...',
    timestamp: Date.now(),
  };

  it('should render tool call', () => {
    render(<ToolCallCard toolCall={diceToolCall} status="complete" />);

    expect(screen.getByText('Rolling Dice')).toBeInTheDocument();
    expect(screen.getByText('🎲')).toBeInTheDocument();
  });

  it('should expand on click', () => {
    render(<ToolCallCard toolCall={genericToolCall} status="complete" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Parameters')).toBeInTheDocument();
    expect(screen.getByText('rule:')).toBeInTheDocument();
    expect(screen.getByText('stealth')).toBeInTheDocument();
  });

  it('should show result when expanded', () => {
    render(<ToolCallCard toolCall={genericToolCall} status="complete" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Result')).toBeInTheDocument();
    expect(screen.getByText(/Stealth check details/i)).toBeInTheDocument();
  });

  it('should show running status', () => {
    render(<ToolCallCard toolCall={diceToolCall} status="running" />);

    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('should show different icons for different tools', () => {
    const ruleToolCall: ToolCall = {
      ...genericToolCall,
      toolName: 'lookup_rule',
    };

    render(<ToolCallCard toolCall={ruleToolCall} status="complete" />);

    expect(screen.getByText('📖')).toBeInTheDocument();
    expect(screen.getByText('Checking Rules')).toBeInTheDocument();
  });
});
