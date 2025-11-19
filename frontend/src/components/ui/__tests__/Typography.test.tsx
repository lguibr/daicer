import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import {
  TypographyBlockquote,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyInlineCode,
  TypographyLarge,
  TypographyLead,
  TypographyList,
  TypographyMuted,
  TypographyP,
  TypographySmall,
  TypographyTable,
  TypographyTableContainer,
} from '../typography';

describe('Typography primitives', () => {
  it('renders heading hierarchy with semantic levels', () => {
    render(
      <>
        <TypographyH1>Heading One</TypographyH1>
        <TypographyH2>Heading Two</TypographyH2>
        <TypographyH3>Heading Three</TypographyH3>
        <TypographyH4>Heading Four</TypographyH4>
      </>
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('font-display');
    expect(screen.getByRole('heading', { level: 2 })).toHaveClass('font-display');
    expect(screen.getByRole('heading', { level: 3 })).toHaveClass('font-display');
    expect(screen.getByRole('heading', { level: 4 })).toHaveClass('font-display');
  });

  it('applies prose semantics with default spacing', () => {
    render(
      <>
        <TypographyP>Body text</TypographyP>
        <TypographyLead>Lead copy</TypographyLead>
        <TypographyLarge>Large copy</TypographyLarge>
        <TypographySmall>Small copy</TypographySmall>
        <TypographyMuted>Muted copy</TypographyMuted>
        <TypographyBlockquote>Insight</TypographyBlockquote>
        <TypographyInlineCode>npm run qa</TypographyInlineCode>
        <TypographyList>
          <li>First</li>
        </TypographyList>
      </>
    );

    expect(screen.getByText('Body text').tagName).toBe('P');
    expect(screen.getByText('Lead copy')).toHaveClass('text-muted-foreground');
    expect(screen.getByText('Large copy').tagName).toBe('DIV');
    expect(screen.getByText('Small copy').tagName).toBe('SMALL');
    expect(screen.getByText('Muted copy')).toHaveClass('text-muted-foreground');
    expect(screen.getByText('Insight').tagName).toBe('BLOCKQUOTE');
    expect(screen.getByText('npm run qa').tagName).toBe('CODE');
    expect(screen.getByRole('list')).toHaveClass('list-disc');
  });

  it('merges custom class names', () => {
    render(<TypographyH1 className="text-primary">Custom Heading</TypographyH1>);

    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('text-primary');
  });

  it('supports data tables with overflow container', () => {
    render(
      <TypographyTableContainer data-testid="table-container">
        <TypographyTable>
          <thead>
            <tr>
              <th>Column</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Value</td>
            </tr>
          </tbody>
        </TypographyTable>
      </TypographyTableContainer>
    );

    const container = screen.getByTestId('table-container');
    expect(container).toHaveClass('overflow-x-auto');

    const table = container.querySelector('table');
    expect(table).not.toBeNull();
    expect(table).toHaveClass('w-full');
  });
});
