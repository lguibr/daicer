import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import cn from '@/lib/utils';

interface ActionsProps {
  children: ReactNode;
  className?: string;
}

interface ActionCopyProps {
  text: string;
  onCopy?: () => void;
  className?: string;
}

interface ActionRegenerateProps {
  messageId: string;
  onRegenerate?: (messageId: string) => void;
  disabled?: boolean;
  className?: string;
}

interface ActionEditProps {
  messageId: string;
  onEdit?: (messageId: string) => void;
  disabled?: boolean;
  className?: string;
}

interface ActionDeleteProps {
  messageId: string;
  onDelete?: (messageId: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Actions container for message-level operations
 * Appears on message hover
 */
export function Actions({ children, className }: ActionsProps) {
  return (
    <div
      className={cn('flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100', className)}
      role="toolbar"
      aria-label="Message actions"
    >
      {children}
    </div>
  );
}

/**
 * Copy message text to clipboard
 */
export function ActionCopy({ text, onCopy, className }: ActionCopyProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.();

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  return (
    <Button
      onClick={handleCopy}
      size="sm"
      variant="ghost"
      className={cn('h-8 w-8 p-0', className)}
      title={copied ? 'Copied!' : 'Copy message'}
    >
      {copied ? (
        <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}
    </Button>
  );
}

/**
 * Regenerate AI response
 * DM only
 */
export function ActionRegenerate({ messageId, onRegenerate, disabled, className }: ActionRegenerateProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = () => {
    setIsRegenerating(true);
    onRegenerate?.(messageId);

    // Reset after 2 seconds (actual regeneration happens via parent)
    setTimeout(() => {
      setIsRegenerating(false);
    }, 2000);
  };

  return (
    <Button
      onClick={handleRegenerate}
      size="sm"
      variant="ghost"
      disabled={disabled || isRegenerating}
      className={cn('h-8 w-8 p-0', className)}
      title="Regenerate response"
    >
      <svg
        className={cn('h-4 w-4', isRegenerating && 'animate-spin')}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    </Button>
  );
}

/**
 * Edit player message
 */
export function ActionEdit({ messageId, onEdit, disabled, className }: ActionEditProps) {
  const handleEdit = () => {
    onEdit?.(messageId);
  };

  return (
    <Button
      onClick={handleEdit}
      size="sm"
      variant="ghost"
      disabled={disabled}
      className={cn('h-8 w-8 p-0', className)}
      title="Edit message"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    </Button>
  );
}

/**
 * Delete message
 * DM only
 */
export function ActionDelete({ messageId, onDelete, disabled, className }: ActionDeleteProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }

    onDelete?.(messageId);
    setConfirmDelete(false);
  };

  return (
    <Button
      onClick={handleDelete}
      size="sm"
      variant="ghost"
      disabled={disabled}
      className={cn('h-8 w-8 p-0', confirmDelete && 'text-red-400 hover:text-red-300', className)}
      title={confirmDelete ? 'Click again to confirm' : 'Delete message'}
    >
      {confirmDelete ? (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      )}
    </Button>
  );
}

Actions.displayName = 'Actions';
ActionCopy.displayName = 'ActionCopy';
ActionRegenerate.displayName = 'ActionRegenerate';
ActionEdit.displayName = 'ActionEdit';
ActionDelete.displayName = 'ActionDelete';
