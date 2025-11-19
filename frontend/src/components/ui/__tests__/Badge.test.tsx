import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Badge } from '../badge';

describe('Badge', () => {
  it('renders with default variant styles', () => {
    render(<Badge>Default Badge</Badge>);
    const badge = screen.getByText('Default Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-primary', 'text-primary-foreground', 'border-transparent');
  });

  it('applies variant classes correctly', () => {
    const { rerender } = render(<Badge variant="secondary">Secondary</Badge>);
    expect(screen.getByText('Secondary')).toHaveClass('bg-secondary', 'text-secondary-foreground');

    rerender(<Badge variant="destructive">Destructive</Badge>);
    expect(screen.getByText('Destructive')).toHaveClass('bg-destructive', 'text-destructive-foreground');

    rerender(<Badge variant="outline">Outline</Badge>);
    expect(screen.getByText('Outline')).toHaveClass('border-border', 'bg-background', 'text-foreground');
  });

  it('merges custom className', () => {
    render(<Badge className="tracking-wide">Custom</Badge>);
    expect(screen.getByText('Custom')).toHaveClass('tracking-wide');
  });

  it('renders as child when requested', () => {
    render(
      <Badge asChild>
        <a href="/lore">Lore</a>
      </Badge>
    );
    const link = screen.getByRole('link', { name: 'Lore' });
    expect(link).toHaveAttribute('href', '/lore');
    expect(link).toHaveClass('inline-flex');
  });
});
