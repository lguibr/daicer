import { useState, useRef, useEffect } from 'react';
import { sendTypingIndicator } from '../../services/socket';
import { useI18n } from '../../i18n';
import { PromptInput, PromptInputTextarea, PromptInputSubmit } from '../ai';

interface GameplayComposerProps {
  roomId: string;
  userName: string;
  onSubmit: (action: string) => void;
  disabled?: boolean;
  placeholder?: string;
  isProcessing?: boolean;
}

/**
 * Enhanced composer using AI Elements PromptInput
 * Preserves draft persistence and typing indicators from StreamingComposer
 */
export default function GameplayComposer({
  roomId,
  userName,
  onSubmit,
  disabled = false,
  placeholder,
  isProcessing = false,
}: GameplayComposerProps) {
  const { t } = useI18n();
  const [action, setAction] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!action.trim() || disabled) return;

    onSubmit(action.trim());
    setAction('');
    setIsTyping(false);
    sendTypingIndicator(roomId, userName, false);

    // Clear draft
    localStorage.removeItem(`composer-draft-${roomId}`);
  };

  const status = isProcessing ? 'streaming' : disabled ? 'error' : 'ready';

  return (
    <div className="relative">
      <PromptInput onSubmit={handleSubmit}>
        <PromptInputTextarea
          value={action}
          onChange={handleChange}
          placeholder={
            disabled
              ? isProcessing
                ? t('gameplay.processing')
                : 'Combat in progress...'
              : placeholder || t('gameplay.actionPlaceholder')
          }
          disabled={disabled}
          minHeight={100}
          maxHeight={300}
          className="border-midnight-600/60 bg-midnight-800/60 text-shadow-50 placeholder:text-shadow-400 focus:border-aurora-500/60 focus:bg-midnight-800/80 focus:shadow-[0_0_30px_rgba(34,211,238,0.15)]"
        />
        <PromptInputSubmit status={status} disabled={!action.trim() || disabled} />
      </PromptInput>

      {/* Character Count */}
      {action.length > 0 && <div className="mt-2 text-xs text-shadow-500">{action.length} characters</div>}
    </div>
  );
}
