import { type ReactNode } from 'react';
import cn from '@/lib/utils';
import MarkdownMessage from '../game/MarkdownMessage';

interface ResponseProps {
  children: string | ReactNode;
  className?: string;
  parseIncompleteMarkdown?: boolean;
}

/**
 * Auto-complete incomplete formatting tokens during streaming
 * Handles **bold, *italic*, ~~strikethrough~~, and `code`
 */
function autoCompleteMarkdown(text: string): string {
  if (typeof text !== 'string') return '';

  let result = text;

  // Count formatting tokens
  const boldCount = (text.match(/\*\*/g) || []).length;
  const italicCount = (text.match(/(?<!\*)\*(?!\*)/g) || []).length;
  const strikeCount = (text.match(/~~/g) || []).length;
  const codeCount = (text.match(/(?<!`)`(?!`)/g) || []).length;

  // Auto-complete unclosed bold
  if (boldCount % 2 !== 0) {
    result += '**';
  }

  // Auto-complete unclosed italic (but not if it's part of a bold)
  if (italicCount % 2 !== 0 && !result.endsWith('***')) {
    result += '*';
  }

  // Auto-complete unclosed strikethrough
  if (strikeCount % 2 !== 0) {
    result += '~~';
  }

  // Auto-complete unclosed inline code (but not code blocks)
  if (codeCount % 2 !== 0 && !result.includes('```')) {
    result += '`';
  }

  return result;
}

/**
 * Hide incomplete links and images during streaming
 * Shows them once the closing bracket appears
 */
function hideIncompleteLinks(text: string): string {
  if (typeof text !== 'string') return '';

  // Hide incomplete markdown links: [text without closing bracket
  let result = text.replace(/\[([^\]]+)$/g, '');

  // Hide incomplete images: ![alt without closing bracket
  result = result.replace(/!\[([^\]]+)$/g, '');

  return result;
}

/**
 * Process streaming markdown to handle incomplete formatting
 */
function processStreamingMarkdown(text: string): string {
  let processed = text;

  // First, hide incomplete links/images
  processed = hideIncompleteLinks(processed);

  // Then, auto-complete formatting
  processed = autoCompleteMarkdown(processed);

  return processed;
}

/**
 * Response renderer with intelligent streaming support
 * - Auto-completes incomplete markdown formatting during streaming
 * - Hides incomplete links until complete
 * - Reuses existing MarkdownMessage component for rendering
 * - Preserves Daicer's custom markdown styling
 */
export function Response({ children, className, parseIncompleteMarkdown = true }: ResponseProps) {
  // Handle both string and ReactNode children
  if (typeof children !== 'string') {
    return <div className={cn('prose prose-invert max-w-none', className)}>{children}</div>;
  }

  // Process markdown if parsing is enabled and content looks incomplete
  let content = children;
  if (parseIncompleteMarkdown) {
    // Check if content looks incomplete (ends with partial formatting)
    const hasIncompleteFormatting =
      content.endsWith('**') ||
      content.endsWith('*') ||
      content.endsWith('~~') ||
      content.endsWith('`') ||
      content.endsWith('[') ||
      content.match(/\[[^\]]+$/);

    if (hasIncompleteFormatting) {
      content = processStreamingMarkdown(content);
    }
  }

  return (
    <div className={cn('prose prose-invert max-w-none text-shadow-50 break-words', className)}>
      <MarkdownMessage content={content} />
    </div>
  );
}

Response.displayName = 'Response';
