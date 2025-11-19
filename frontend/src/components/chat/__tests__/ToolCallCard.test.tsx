/**
 * Tests for ToolCallCard component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ToolCallCard from '../ToolCallCard';
import type { ToolCall } from '../../../services/socket';

describe('ToolCallCard', () => {
  const mockToolCall: ToolCall = {
    id: 'tool-1',
    toolName: 'roll_dice',
    parameters: { dice: '1d20', modifier: 5 },
    result: { total: 18, breakdown: '[13] + 5' },
    timestamp: Date.now(),
  };

  it('should render tool call', () => {
    render(<ToolCallCard toolCall={mockToolCall} status="complete" />);

    expect(screen.getByText('Rolling Dice')).toBeInTheDocument();
    expect(screen.getByText('🎲')).toBeInTheDocument();
  });

  it('should expand on click', () => {
    render(<ToolCallCard toolCall={mockToolCall} status="complete" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Parameters')).toBeInTheDocument();
    expect(screen.getByText('dice:')).toBeInTheDocument();
    expect(screen.getByText('1d20')).toBeInTheDocument();
  });

  it('should show result when expanded', () => {
    render(<ToolCallCard toolCall={mockToolCall} status="complete" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Result')).toBeInTheDocument();
    expect(screen.getByText(/total.*18/i)).toBeInTheDocument();
  });

  it('should show running status', () => {
    render(<ToolCallCard toolCall={mockToolCall} status="running" />);

    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('should show different icons for different tools', () => {
    const ruleToolCall: ToolCall = {
      ...mockToolCall,
      toolName: 'lookup_rule',
    };

    render(<ToolCallCard toolCall={ruleToolCall} status="complete" />);

    expect(screen.getByText('📖')).toBeInTheDocument();
    expect(screen.getByText('Checking Rules')).toBeInTheDocument();
  });
});
