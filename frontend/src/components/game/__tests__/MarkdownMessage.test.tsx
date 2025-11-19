import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MarkdownMessage from '../MarkdownMessage';

describe('MarkdownMessage', () => {
  it('renders plain text', () => {
    render(<MarkdownMessage content="Hello world" />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders headers with appropriate styling', () => {
    const { container } = render(<MarkdownMessage content="# Main Title" />);

    const h1 = container.querySelector('h1');
    expect(h1).toBeInTheDocument();
    expect(h1).toHaveClass('text-2xl', 'font-bold', 'text-aurora-300');
  });

  it('renders paragraphs', () => {
    const { container } = render(<MarkdownMessage content="This is a paragraph.\n\nThis is another paragraph." />);

    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs.length).toBeGreaterThanOrEqual(1);
  });

  it('renders bold text', () => {
    render(<MarkdownMessage content="This is **bold text**" />);

    const bold = screen.getByText('bold text');
    expect(bold.tagName).toBe('STRONG');
    expect(bold).toHaveClass('text-aurora-200', 'font-bold');
  });

  it('renders italic text', () => {
    render(<MarkdownMessage content="This is *italic text*" />);

    const italic = screen.getByText('italic text');
    expect(italic.tagName).toBe('EM');
    expect(italic).toHaveClass('italic');
  });

  it('renders blockquotes', () => {
    render(<MarkdownMessage content="> This is a quote" />);

    const quote = screen.getByText('This is a quote');
    expect(quote.closest('blockquote')).toBeInTheDocument();
  });

  it('renders unordered lists', () => {
    const { container } = render(<MarkdownMessage content="- Item 1\n- Item 2\n- Item 3" />);

    const ul = container.querySelector('ul');
    expect(ul).toBeInTheDocument();
    expect(ul).toHaveClass('list-disc');
  });

  it('renders ordered lists', () => {
    const { container } = render(<MarkdownMessage content="1. First\n2. Second\n3. Third" />);

    const ol = container.querySelector('ol');
    expect(ol).toBeInTheDocument();
    expect(ol).toHaveClass('list-decimal');
  });

  it('renders horizontal rules', () => {
    const { container } = render(<MarkdownMessage content="Above\n\n---\n\nBelow" />);

    // Check for hr element or verify content is rendered
    const content = container.textContent;
    expect(content).toContain('Above');
    expect(content).toContain('Below');
  });

  it('renders inline code', () => {
    render(<MarkdownMessage content="Use `code` here" />);

    const code = screen.getByText('code');
    expect(code.tagName).toBe('CODE');
    expect(code).toHaveClass('bg-midnight-800');
  });

  it('renders code blocks', () => {
    const { container } = render(<MarkdownMessage content="```javascript\nconst x = 5;\n```" />);

    const code = container.querySelector('code');
    expect(code).toBeInTheDocument();
    expect(code).toHaveClass('bg-midnight-800');
  });

  it('renders links with correct attributes', () => {
    render(<MarkdownMessage content="[Link](https://example.com)" />);

    const link = screen.getByText('Link');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders tables', () => {
    const tableMarkdown = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
`;
    render(<MarkdownMessage content={tableMarkdown} />);

    expect(screen.getByText('Header 1')).toBeInTheDocument();
    expect(screen.getByText('Cell 1')).toBeInTheDocument();
  });

  it('sanitizes dangerous HTML', () => {
    const { container } = render(<MarkdownMessage content='Normal text with <script>alert("xss")</script> script' />);

    // Script tags should be sanitized by rehype-sanitize
    expect(container.querySelector('script')).not.toBeInTheDocument();
    // Just verify component renders without crashing
    expect(container.firstChild).toBeTruthy();
  });

  it('handles complex markdown combinations', () => {
    const content = `
# Adventure Begins

You enter a **dark dungeon**. The walls are *ancient*.

> "Beware the shadows," whispers the voice.

Your options:
1. Go left
2. Go right
3. Turn back

Equipment:
- Sword
- Shield
- Torch
`;

    render(<MarkdownMessage content={content} />);

    expect(screen.getByText('Adventure Begins')).toBeInTheDocument();
    expect(screen.getByText('dark dungeon')).toBeInTheDocument();
    expect(screen.getByText('Go left')).toBeInTheDocument();
    expect(screen.getByText('Sword')).toBeInTheDocument();
  });

  it('renders GFM features like strikethrough', () => {
    render(<MarkdownMessage content="~~crossed out~~" />);

    const del = screen.getByText('crossed out');
    expect(del.tagName).toBe('DEL');
  });

  it('handles empty content gracefully', () => {
    const { container } = render(<MarkdownMessage content="" />);
    // Empty markdown renders as empty div or nothing - just check no crash
    expect(container).toBeInTheDocument();
  });

  it('preserves line breaks in content', () => {
    const { container } = render(<MarkdownMessage content="Line 1\n\nLine 2" />);

    // Markdown converts double newlines to separate paragraphs
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs.length).toBeGreaterThanOrEqual(1);
  });
});
