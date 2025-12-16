import { useState, useRef, useEffect } from 'react';
import { sendTypingIndicator } from '../../services/socket';
import { useI18n } from '../../i18n';
import { PromptInput, PromptInputTextarea, PromptInputSubmit } from '../ai';

/**
 * Enhanced composer using AI Elements PromptInput
 * Preserves draft persistence and typing indicators from StreamingComposer
 */
import { ActionBar } from './ActionBar';

interface GameplayComposerProps {
  roomId: string;
  userName: string;
  onSubmit: (action: string) => void;
  disabled?: boolean;
  placeholder?: string;
  isProcessing?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

export default function GameplayComposer({
  roomId,
  userName,
  onSubmit,
  disabled = false,
  placeholder,
  isProcessing = false,
  value,
  onChange,
}: GameplayComposerProps) {
  const { t } = useI18n();
  const [internalAction, setInternalAction] = useState('');
  const isControlled = value !== undefined;
  const action = isControlled ? value : internalAction;

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Load draft from localStorage (only if uncontrolled)
  useEffect(() => {
    if (isControlled) return;
    const draft = localStorage.getItem(`composer-draft-${roomId}`);
    if (draft) {
      setInternalAction(draft);
    }
  }, [roomId, isControlled]);

  // Save draft to localStorage
  useEffect(() => {
    if (action) {
      localStorage.setItem(`composer-draft-${roomId}`, action);
    } else {
      localStorage.removeItem(`composer-draft-${roomId}`);
    }
  }, [action, roomId]);

  // Handle typing indicator
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement> | string) => {
    const newValue = typeof e === 'string' ? e : e.target.value;

    if (!isControlled) {
      setInternalAction(newValue);
    }
    onChange?.(newValue);

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

    if (!isControlled) {
      setInternalAction('');
    }
    onChange?.(''); // Clear parent

    setIsTyping(false);
    sendTypingIndicator(roomId, userName, false);

    // Clear draft
    localStorage.removeItem(`composer-draft-${roomId}`);
  };

  const handleActionSelect = (text: string) => {
    const newValue = action + (action.length > 0 && !action.endsWith(' ') ? ' ' : '') + text;
    handleChange(newValue);
  };

  const status = isProcessing ? 'streaming' : disabled ? 'error' : 'ready';

  return (
    <div className="relative space-y-2">
      <ActionBar onActionSelect={handleActionSelect} disabled={disabled || isProcessing} />

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
          minHeight={80}
          maxHeight={300}
          className="border-midnight-600/60 bg-midnight-800/60 text-shadow-50 placeholder:text-shadow-400 focus:border-aurora-500/60 focus:bg-midnight-800/80 focus:shadow-[0_0_30px_rgba(34,211,238,0.15)]"
        />
        <PromptInputSubmit status={status} disabled={!action.trim() || disabled} />
      </PromptInput>

      {/* Character Count */}
      {action.length > 0 && <div className="text-right text-xs text-shadow-500">{action.length} characters</div>}
    </div>
  );
}
