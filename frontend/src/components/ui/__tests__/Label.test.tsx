import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Label from '../label';

describe('Label', () => {
  it('renders with text content', () => {
    render(<Label>Username</Label>);
    expect(screen.getByText('Username')).toBeInTheDocument();
  });

  it('applies default text size and weight', () => {
    const { container } = render(<Label>Label Text</Label>);
    const label = container.querySelector('label');
    expect(label).toHaveClass('text-sm', 'font-medium');
  });

  it('associates with input using htmlFor', () => {
    render(
      <>
        <Label htmlFor="test-input">Test Label</Label>
        <input id="test-input" />
      </>
    );

    const label = screen.getByText('Test Label');
    expect(label).toHaveAttribute('for', 'test-input');
  });

  it('applies custom className', () => {
    const { container } = render(<Label className="custom-label">Label</Label>);
    const label = container.querySelector('label');
    expect(label).toHaveClass('custom-label');
  });

  it('forwards ref', () => {
    const ref = { current: null };
    render(<Label ref={ref}>Label</Label>);
    expect(ref.current).not.toBeNull();
  });

  it('supports peer-disabled styling', () => {
    const { container } = render(<Label>Label</Label>);
    const label = container.querySelector('label');
    expect(label).toHaveClass('peer-disabled:cursor-not-allowed', 'peer-disabled:opacity-70');
  });

  it('renders children elements', () => {
    render(
      <Label>
        <span>Label with </span>
        <strong>emphasis</strong>
      </Label>
    );

    expect(screen.getByText('Label with')).toBeInTheDocument();
    expect(screen.getByText('emphasis')).toBeInTheDocument();
  });
});
