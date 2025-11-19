import { type ReactNode } from 'react';
import cn from '@/lib/utils';

interface MessageProps {
  from: 'user' | 'assistant' | 'system' | string;
  children: ReactNode;
  className?: string;
}

interface MessageContentProps {
  children: ReactNode;
  className?: string;
}

interface MessageAvatarProps {
  src?: string;
  name: string;
  className?: string;
}

interface MessageActionsProps {
  children: ReactNode;
  className?: string;
}

/**
 * Message container with role-based layout
 * DM/assistant messages on left, user messages on right, system centered
 */
export function Message({ from, children, className }: MessageProps) {
  const isDM = from === 'assistant' || from === 'DM';
  const isUser = from === 'user' || (!isDM && from !== 'system');
  const isSystem = from === 'system';

  return (
    <div
      className={cn(
        'flex w-full',
        isSystem && 'justify-center',
        isDM && 'justify-start',
        isUser && 'justify-end',
        className
      )}
      role="article"
      aria-label={`Message from ${from}`}
    >
      <div
        className={cn(
          'relative flex w-full max-w-4xl flex-col gap-3 rounded-3xl border px-5 py-4',
          'shadow-[0_24px_38px_rgba(6,10,18,0.45)] backdrop-blur-sm transition-all duration-200',
          'hover:shadow-[0_28px_42px_rgba(6,10,18,0.55)]',
          isSystem && 'border-nebula-500/40 bg-nebula-900/60',
          isDM && 'border-midnight-600/60 bg-midnight-700/80',
          isUser && 'border-aurora-500/30 bg-aurora-900/35'
        )}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Message content wrapper
 * Contains the actual message text and any embedded components
 */
export function MessageContent({ children, className }: MessageContentProps) {
  return <div className={cn('flex flex-col gap-3', className)}>{children}</div>;
}

/**
 * Avatar display with fallback to initials
 * Shows first 2 characters of name if no image provided
 */
export function MessageAvatar({ src, name, className }: MessageAvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
        'border-2 border-aurora-400/30 bg-gradient-to-br from-aurora-500/20 to-nebula-500/20',
        'font-semibold text-shadow-50',
        className
      )}
      aria-label={`${name}'s avatar`}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span className="text-sm">{initials}</span>
      )}
    </div>
  );
}

/**
 * Message header with sender info and metadata
 */
export function MessageHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>{children}</div>;
}

/**
 * Sender label with styling
 */
export function MessageSender({
  children,
  isDM = false,
  className,
}: {
  children: ReactNode;
  isDM?: boolean;
  className?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <p
        className={cn(
          'text-sm font-semibold uppercase tracking-[0.22em]',
          isDM ? 'text-aurora-200' : 'text-shadow-100',
          className
        )}
      >
        {children}
      </p>
    </div>
  );
}

/**
 * Message timestamp
 */
export function MessageTime({ timestamp, className }: { timestamp: number | Date; className?: string }) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

  return <p className={cn('text-xs text-shadow-500', className)}>{date.toLocaleTimeString()}</p>;
}

/**
 * Badge for special message types (private, streaming, etc.)
 */
export function MessageBadge({
  children,
  variant = 'default',
  className,
}: {
  children: ReactNode;
  variant?: 'default' | 'private' | 'streaming' | 'system';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'flex items-center gap-1 rounded-full px-3 py-1',
        'text-[0.65rem] font-semibold uppercase tracking-[0.28em]',
        variant === 'private' && 'bg-nebula-500/25 text-nebula-200',
        variant === 'streaming' && 'bg-aurora-500/20 text-aurora-300',
        variant === 'system' && 'bg-midnight-500/25 text-shadow-200',
        variant === 'default' && 'bg-shadow-500/20 text-shadow-100',
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Actions container for message-level operations
 */
export function MessageActions({ children, className }: MessageActionsProps) {
  return (
    <div className={cn('flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100', className)}>
      {children}
    </div>
  );
}

Message.displayName = 'Message';
MessageContent.displayName = 'MessageContent';
MessageAvatar.displayName = 'MessageAvatar';
MessageHeader.displayName = 'MessageHeader';
MessageSender.displayName = 'MessageSender';
MessageTime.displayName = 'MessageTime';
MessageBadge.displayName = 'MessageBadge';
MessageActions.displayName = 'MessageActions';
