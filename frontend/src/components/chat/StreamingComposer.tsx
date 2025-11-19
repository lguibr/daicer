import { useState, useRef, useEffect } from 'react';
import { sendTypingIndicator } from '../../services/socket';
import { useI18n } from '../../i18n';
import cn from '../../lib/utils';

interface StreamingComposerProps {
  roomId: string;
  userName: string;
  onSubmit: (action: string) => void;
  disabled?: boolean;
  placeholder?: string;
  isProcessing?: boolean;
}

/**
 * @deprecated Use GameplayComposer from @/components/game/GameplayComposer instead.
 * This component will be removed in v2.0.0.
 *
 * Migration guide:
 * - Replace StreamingComposer with GameplayComposer
 * - Props remain compatible, using new AI Elements PromptInput internally
 * - All features preserved: draft persistence, typing indicators
 *
 * Beautiful composer with typing indicators and draft persistence
 */
export default function StreamingComposer({
  roomId,
  userName,
  onSubmit,
  disabled = false,
  placeholder,
  isProcessing = false,
}: StreamingComposerProps) {
  const { t } = useI18n();
  const [action, setAction] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Deprecation warning
  useEffect(() => {
    console.warn(
      '[DEPRECATED] StreamingComposer is deprecated. Use GameplayComposer from @/components/game/GameplayComposer instead. This component will be removed in v2.0.0.'
    );
  }, []);

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem(`composer-draft-${roomId}`);
    if (draft) {
      setAction(draft);
    }
  }, [roomId]);

  // Save draft to localStorage
  useEffect(() => {
    if (action) {
      localStorage.setItem(`composer-draft-${roomId}`, action);
    } else {
      localStorage.removeItem(`composer-draft-${roomId}`);
    }
  }, [action, roomId]);

  // Handle typing indicator
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAction(e.target.value);

    // Send typing indicator
    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(roomId, userName, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(roomId, userName, false);
    }, 2000);
  };

  // Clear typing on unmount
  useEffect(
    () => () => {
      if (isTyping) {
        sendTypingIndicator(roomId, userName, false);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    },
    [roomId, userName, isTyping]
  );

  const handleSubmit = () => {
    if (!action.trim() || disabled) return;

    onSubmit(action.trim());
    setAction('');
    setIsTyping(false);
    sendTypingIndicator(roomId, userName, false);

    // Clear draft
    localStorage.removeItem(`composer-draft-${roomId}`);

    // Focus back on textarea
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative">
      {/* Composer Container */}
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300',
          isFocused && !disabled
            ? 'border-aurora-500/60 bg-midnight-800/80 shadow-[0_0_30px_rgba(34,211,238,0.15)]'
            : 'border-midnight-600/60 bg-midnight-800/60',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={action}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={
            disabled
              ? isProcessing
                ? t('gameplay.processing')
                : 'Combat in progress...'
              : placeholder || t('gameplay.actionPlaceholder')
          }
          disabled={disabled}
          className={cn(
            'w-full resize-none bg-transparent px-5 py-4 pr-16 text-shadow-50 placeholder:text-shadow-400',
            'focus:outline-none',
            'min-h-[100px] max-h-[300px]',
            disabled && 'cursor-not-allowed'
          )}
          rows={3}
        />

        {/* Character Count */}
        {action.length > 0 && (
          <div className="absolute bottom-2 left-4 text-xs text-shadow-500">{action.length} characters</div>
        )}

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!action.trim() || disabled}
          className={cn(
            'absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200',
            action.trim() && !disabled
              ? 'bg-gradient-to-r from-aurora-500 to-nebula-500 text-white shadow-lg hover:shadow-aurora-500/30 hover:scale-105'
              : 'bg-midnight-700 text-shadow-500 cursor-not-allowed'
          )}
          title={action.trim() ? 'Send (Enter)' : 'Type to send'}
        >
          {disabled && isProcessing ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>

        {/* Focus Glow Effect */}
        {isFocused && !disabled && (
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-aurora-500/5 via-nebula-500/5 to-aurora-500/5" />
          </div>
        )}
      </div>

      {/* Shift+Enter Hint */}
      {isFocused && !disabled && (
        <p className="mt-2 text-xs text-shadow-500">
          Press <kbd className="rounded bg-midnight-700 px-1.5 py-0.5 font-mono">Enter</kbd> to send,{' '}
          <kbd className="rounded bg-midnight-700 px-1.5 py-0.5 font-mono">Shift+Enter</kbd> for new line
        </p>
      )}
    </div>
  );
}
