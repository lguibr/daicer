/**
 * Tests for StreamingComposer component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StreamingComposer from '../StreamingComposer';

// Mock dependencies
vi.mock('../../../services/socket', () => ({
  sendTypingIndicator: vi.fn(),
}));

vi.mock('../../../i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

describe('StreamingComposer', () => {
  const mockOnSubmit = vi.fn();
  const defaultProps = {
    roomId: 'room-123',
    userName: 'Alice',
    onSubmit: mockOnSubmit,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render composer', () => {
    render(<StreamingComposer {...defaultProps} />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle text input', () => {
    render(<StreamingComposer {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'I attack!' } });

    expect(textarea).toHaveValue('I attack!');
  });

  it('should submit on button click', () => {
    render(<StreamingComposer {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'I attack!' } });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOnSubmit).toHaveBeenCalledWith('I attack!');
    expect(textarea).toHaveValue('');
  });

  it('should submit on Enter key', () => {
    render(<StreamingComposer {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'I attack!' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(mockOnSubmit).toHaveBeenCalledWith('I attack!');
  });

  it('should not submit on Shift+Enter', () => {
    render(<StreamingComposer {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Line 1' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should disable when disabled prop is true', () => {
    render(<StreamingComposer {...defaultProps} disabled />);

    const textarea = screen.getByRole('textbox');
    const button = screen.getByRole('button');

    expect(textarea).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it('should persist draft to localStorage', () => {
    render(<StreamingComposer {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Draft message' } });

    expect(localStorage.getItem('composer-draft-room-123')).toBe('Draft message');
  });

  it('should load draft from localStorage', () => {
    localStorage.setItem('composer-draft-room-123', 'Saved draft');

    render(<StreamingComposer {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('Saved draft');
  });

  it('should show character count', () => {
    render(<StreamingComposer {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Hello' } });

    expect(screen.getByText('5 characters')).toBeInTheDocument();
  });
});
