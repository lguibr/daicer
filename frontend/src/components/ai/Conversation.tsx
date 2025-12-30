import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import cn from '@/lib/utils';

interface ConversationProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface ConversationContentProps {
  children: ReactNode;
  className?: string;
}

interface ConversationScrollButtonProps {
  className?: string;
}

/**
 * Auto-scrolling conversation container with stick-to-bottom behavior
 * Inspired by AI Elements but styled with Daicer's midnight/aurora theme
 */
export function Conversation({ children, className, style }: ConversationProps) {
  return (
    <div
      className={cn('relative flex h-full w-full flex-col overflow-hidden', className)}
      style={style}
      role="log"
      aria-live="polite"
      aria-atomic="false"
    >
      {children}
    </div>
  );
}

/**
 * Scrollable content area for messages
 * Manages auto-scroll behavior and scroll detection
 */
export function ConversationContent({ children, className }: ConversationContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const prevScrollHeightRef = useRef<number>(0);

  // Auto-scroll logic - stick to bottom when enabled
  useEffect(() => {
    if (!containerRef.current || !autoScroll) return;

    const node = containerRef.current;

    // Only scroll if content changed (new messages)
    if (node.scrollHeight !== prevScrollHeightRef.current) {
      const isNearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 100;

      if (isNearBottom || autoScroll) {
        node.scrollTo({
          top: node.scrollHeight,
          behavior: 'smooth',
        });
      }

      prevScrollHeightRef.current = node.scrollHeight;
    }
  }, [children, autoScroll]);

  // Handle manual scroll - disable auto-scroll when user scrolls up
  const handleScroll = () => {
    if (!containerRef.current) return;

    const node = containerRef.current;
    const isNearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 50;

    setAutoScroll(isNearBottom);
    setShowScrollButton(!isNearBottom);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const node = containerRef.current;

    switch (e.key) {
      case 'Home':
        e.preventDefault();
        node.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'End':
        e.preventDefault();
        node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
        setAutoScroll(true);
        break;
      case 'PageUp':
        e.preventDefault();
        node.scrollBy({ top: -node.clientHeight, behavior: 'smooth' });
        break;
      case 'PageDown':
        e.preventDefault();
        node.scrollBy({ top: node.clientHeight, behavior: 'smooth' });
        break;
      default:
        break;
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        className={cn(
          'flex-1 overflow-y-auto overflow-x-hidden',
          'focus:outline-none focus:ring-2 focus:ring-aurora-500/30',
          'scrollbar-thin scrollbar-thumb-midnight-600 scrollbar-track-midnight-900',
          className
        )}
      >
        {children}
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && <ConversationScrollButton />}
    </>
  );
}

/**
 * Floating button to scroll back to bottom
 * Appears when user has scrolled up
 */
export function ConversationScrollButton({ className }: ConversationScrollButtonProps) {
  const handleClick = () => {
    // Find the parent ConversationContent
    const content = document.querySelector('[role="log"] > div');
    if (content) {
      content.scrollTo({
        top: content.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className={cn('absolute bottom-4 right-4 z-10', className)}>
      <Button
        onClick={handleClick}
        variant="outline"
        size="icon"
        className={cn(
          'h-8 w-8 rounded-full shadow-lg',
          'bg-midnight-800 border-aurora-500/30 text-aurora-400',
          'hover:bg-midnight-700 hover:text-aurora-300 hover:border-aurora-400/50',
          'backdrop-blur-sm transition-all duration-300 animate-in fade-in zoom-in'
        )}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </Button>
    </div>
  );
}

Conversation.displayName = 'Conversation';
ConversationContent.displayName = 'ConversationContent';
ConversationScrollButton.displayName = 'ConversationScrollButton';
