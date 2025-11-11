import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card';

describe('Card Components', () => {
  describe('Card', () => {
    it('renders with children', () => {
      render(<Card>Card Content</Card>);
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('applies default classes', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('rounded-xl', 'border', 'shadow');
    });

    it('accepts custom className', () => {
      const { container } = render(<Card className="custom-card">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-card');
    });

    it('forwards ref', () => {
      const ref = { current: null };
      render(<Card ref={ref}>Content</Card>);
      expect(ref.current).not.toBeNull();
    });
  });

  describe('CardHeader', () => {
    it('renders with children', () => {
      render(<CardHeader>Header Content</CardHeader>);
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('applies default padding and spacing', () => {
      const { container } = render(<CardHeader>Header</CardHeader>);
      const header = container.firstChild as HTMLElement;
      expect(header).toHaveClass('p-6', 'space-y-1.5');
    });
  });

  describe('CardTitle', () => {
    it('renders as h3 element', () => {
      const { container } = render(<CardTitle>Title</CardTitle>);
      const title = container.querySelector('h3');
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Title');
    });

    it('applies font and tracking classes', () => {
      const { container } = render(<CardTitle>Title</CardTitle>);
      const title = container.querySelector('h3');
      expect(title).toHaveClass('font-semibold', 'tracking-tight');
    });
  });

  describe('CardDescription', () => {
    it('renders as paragraph element', () => {
      const { container } = render(<CardDescription>Description</CardDescription>);
      const desc = container.querySelector('p');
      expect(desc).toBeInTheDocument();
      expect(desc).toHaveTextContent('Description');
    });

    it('applies muted text style', () => {
      const { container } = render(<CardDescription>Description</CardDescription>);
      const desc = container.querySelector('p');
      expect(desc).toHaveClass('text-muted-foreground');
    });
  });

  describe('CardContent', () => {
    it('renders with children', () => {
      render(<CardContent>Main Content</CardContent>);
      expect(screen.getByText('Main Content')).toBeInTheDocument();
    });

    it('applies padding', () => {
      const { container } = render(<CardContent>Content</CardContent>);
      const content = container.firstChild as HTMLElement;
      expect(content).toHaveClass('p-6', 'pt-0');
    });
  });

  describe('CardFooter', () => {
    it('renders with children', () => {
      render(<CardFooter>Footer Content</CardFooter>);
      expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });

    it('applies flex layout', () => {
      const { container } = render(<CardFooter>Footer</CardFooter>);
      const footer = container.firstChild as HTMLElement;
      expect(footer).toHaveClass('flex', 'items-center');
    });
  });

  describe('Full Card Composition', () => {
    it('renders complete card structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>Test Content</CardContent>
          <CardFooter>Test Footer</CardFooter>
        </Card>
      );

      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
      expect(screen.getByText('Test Footer')).toBeInTheDocument();
    });
  });
});
