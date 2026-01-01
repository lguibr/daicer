import { useState, useEffect, useRef, type ReactNode } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import cn from '@/lib/utils';

interface ReasoningProps {
  children: ReactNode;
  isStreaming?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
  className?: string;
}

const AUTO_CLOSE_DELAY = 1000; // ms after streaming stops

/**
 * Collapsible reasoning display for LangChain traces
 * - Auto-opens during streaming
 * - Auto-closes after streaming completes
 * - Tracks thinking duration
 */
export function Reasoning({
  children,
  isStreaming = false,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  duration: controlledDuration,
  className,
}: ReasoningProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [internalDuration, setInternalDuration] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Determine if controlled or uncontrolled
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const duration = controlledDuration !== undefined ? controlledDuration : internalDuration;

  // Handle open state change
  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  // Auto-open when streaming starts
  useEffect(() => {
    if (isStreaming && !isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleOpenChange(true);
      startTimeRef.current = Date.now();
    }
  }, [isStreaming, isOpen]);

  // Auto-close after streaming stops
  useEffect(() => {
    if (!isStreaming && isOpen && startTimeRef.current) {
      // Calculate final duration
      const finalDuration = (Date.now() - startTimeRef.current) / 1000;
      setInternalDuration(finalDuration);

      // Close after delay
      closeTimeoutRef.current = setTimeout(() => {
        handleOpenChange(false);
      }, AUTO_CLOSE_DELAY);
    }

    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, [isStreaming, isOpen]);

  // Update duration while streaming
  useEffect(() => {
    if (!isStreaming || !startTimeRef.current) return;

    const interval = setInterval(() => {
      if (startTimeRef.current) {
        setInternalDuration((Date.now() - startTimeRef.current) / 1000);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isStreaming]);

  return (
    <Collapsible.Root
      open={isOpen}
      onOpenChange={handleOpenChange}
      className={cn('rounded-2xl border border-aurora-500/30 bg-aurora-900/10 overflow-hidden', className)}
    >
      <Collapsible.Trigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-aurora-500/5"
        >
          <div className="flex items-center gap-3">
            {/* Brain icon */}
            <svg className="h-5 w-5 text-aurora-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>

            <div className="flex flex-col">
              <span className="text-sm font-semibold text-aurora-200">{isStreaming ? 'Thinking...' : 'Reasoning'}</span>
              {duration > 0 && !isStreaming && (
                <span className="text-xs text-aurora-400">Thought for {duration.toFixed(1)} seconds</span>
              )}
            </div>
          </div>

          {/* Chevron */}
          <svg
            className={cn('h-4 w-4 text-aurora-400 transition-transform duration-200', isOpen && 'rotate-180')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </Collapsible.Trigger>

      <Collapsible.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
        <div className="border-t border-aurora-500/20 bg-midnight-900/20 px-4 py-3">
          <div className="prose prose-invert max-w-none text-sm text-shadow-200">{children}</div>
        </div>
      </Collapsible.Content>

      {/* Streaming indicator */}
      {isStreaming && (
        <div className="absolute inset-0 -z-10 opacity-30 pointer-events-none">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-aurora-500/0 via-aurora-500/20 to-aurora-500/0" />
        </div>
      )}
    </Collapsible.Root>
  );
}

Reasoning.displayName = 'Reasoning';
