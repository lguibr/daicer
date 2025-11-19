import {
  useState,
  useRef,
  useEffect,
  type ReactNode,
  type FormEvent,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';
import { Button } from '@/components/ui/button';
import cn from '@/lib/utils';

interface PromptInputProps {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  className?: string;
}

interface PromptInputTextareaProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
}

interface PromptInputToolbarProps {
  children: ReactNode;
  className?: string;
}

interface PromptInputSubmitProps {
  disabled?: boolean;
  status?: 'ready' | 'submitted' | 'streaming' | 'error';
  className?: string;
}

/**
 * Form container for prompt input system
 * Handles form submission and layout
 */
export function PromptInput({ onSubmit, children, className }: PromptInputProps) {
  return (
    <form onSubmit={onSubmit} className={cn('relative flex w-full flex-col', className)}>
      {children}
    </form>
  );
}

/**
 * Auto-resizing textarea with Enter/Shift+Enter handling
 * Inspired by AI Elements but styled with Daicer theme
 */
export function PromptInputTextarea({
  value,
  onChange,
  placeholder = 'What would you like to know?',
  disabled = false,
  minHeight = 48,
  maxHeight = 164,
  className,
  onKeyDown,
}: PromptInputTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;

    // Reset height to recalculate
    textarea.style.height = `${minHeight}px`;

    // Set new height based on scrollHeight
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, [value, minHeight, maxHeight]);

  // Handle Enter/Shift+Enter
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();

      // Trigger form submission
      const form = textareaRef.current?.closest('form');
      if (form) {
        form.requestSubmit();
      }
    }

    // Call custom onKeyDown if provided
    onKeyDown?.(e);
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300',
        isFocused && !disabled
          ? 'border-aurora-500/60 bg-midnight-800/80 shadow-[0_0_30px_rgba(34,211,238,0.15)]'
          : 'border-midnight-600/60 bg-midnight-800/60',
        disabled && 'opacity-60 cursor-not-allowed'
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full resize-none bg-transparent px-5 py-4 text-shadow-50 placeholder:text-shadow-400',
          'focus:outline-none',
          'scrollbar-thin scrollbar-thumb-midnight-600 scrollbar-track-transparent',
          disabled && 'cursor-not-allowed',
          className
        )}
        rows={1}
        style={
          {
            minHeight: `${minHeight}px`,
            maxHeight: `${maxHeight}px`,
            fieldSizing: 'content',
          } as React.CSSProperties
        }
      />

      {/* Character count */}
      {value.length > 0 && (
        <div className="absolute bottom-2 left-4 text-xs text-shadow-500">
          {value.length} {value.length === 1 ? 'character' : 'characters'}
        </div>
      )}

      {/* Focus glow effect */}
      {isFocused && !disabled && (
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-aurora-500/5 via-nebula-500/5 to-aurora-500/5" />
        </div>
      )}

      {/* Hint text */}
      {isFocused && !disabled && (
        <div className="absolute -bottom-6 left-0 text-xs text-shadow-500">
          Press <kbd className="rounded bg-midnight-700 px-1.5 py-0.5 font-mono">Enter</kbd> to send,{' '}
          <kbd className="rounded bg-midnight-700 px-1.5 py-0.5 font-mono">Shift+Enter</kbd> for new line
        </div>
      )}
    </div>
  );
}

/**
 * Toolbar container for actions and submit button
 */
export function PromptInputToolbar({ children, className }: PromptInputToolbarProps) {
  return <div className={cn('mt-3 flex items-center justify-between gap-2', className)}>{children}</div>;
}

/**
 * Submit button with status indicators
 */
export function PromptInputSubmit({ disabled = false, status = 'ready', className }: PromptInputSubmitProps) {
  const getIcon = () => {
    switch (status) {
      case 'streaming':
      case 'submitted':
        return (
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        );
      case 'error':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        );
    }
  };

  return (
    <Button
      type="submit"
      disabled={disabled}
      size="icon"
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200',
        !disabled && status === 'ready'
          ? 'bg-gradient-to-r from-aurora-500 to-nebula-500 text-white shadow-lg hover:shadow-aurora-500/30 hover:scale-105'
          : 'bg-midnight-700 text-shadow-500 cursor-not-allowed',
        className
      )}
      title={disabled ? 'Cannot send' : 'Send message (Enter)'}
    >
      {getIcon()}
    </Button>
  );
}

PromptInput.displayName = 'PromptInput';
PromptInputTextarea.displayName = 'PromptInputTextarea';
PromptInputToolbar.displayName = 'PromptInputToolbar';
PromptInputSubmit.displayName = 'PromptInputSubmit';
