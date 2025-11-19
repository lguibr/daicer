import { useEffect, useMemo, useRef, useState } from 'react';
import type { Message } from '../../types/shared';
import type { PresenceData } from '../../services/socket';
import MarkdownMessage from '../game/MarkdownMessage';
import useAuth from '../../hooks/useAuth';
import { useI18n } from '../../i18n';
import cn from '../../lib/utils';
import { DiceLoader } from '../ui/dice-loader';

interface StreamingMessage extends Message {
  isStreaming?: boolean;
  streamContent?: string;
}

interface StreamingChatAreaProps {
  messages: Message[];
  streamingMessages: Map<string, string>; // messageId -> accumulated content
  worldDescription: string;
  isProcessing: boolean;
  presence: PresenceData[];
}

/**
 * @deprecated Use GameplayChatArea from @/components/game/GameplayChatArea instead.
 * This component will be removed in v2.0.0.
 *
 * Migration guide:
 * - Replace StreamingChatArea with GameplayChatArea
 * - Props remain compatible, but new component uses AI Elements architecture
 * - All features preserved: dice animations, tool cards, presence indicators
 *
 * Streaming-enabled chat area component
 * Displays messages with real-time token streaming and presence indicators
 */
export default function StreamingChatArea({
  messages,
  streamingMessages,
  worldDescription,
  isProcessing,
  presence,
}: StreamingChatAreaProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Deprecation warning
  useEffect(() => {
    console.warn(
      '[DEPRECATED] StreamingChatArea is deprecated. Use GameplayChatArea from @/components/game/GameplayChatArea instead. This component will be removed in v2.0.0.'
    );
  }, []);

  // Combine messages with streaming content
  const displayMessages = useMemo(() => {
    const combined: StreamingMessage[] = messages.map((msg) => {
      const streamContent = streamingMessages.get(msg.id);
      if (streamContent) {
        return {
          ...msg,
          isStreaming: true,
          streamContent,
        };
      }
      return msg;
    });

    // Add any streaming messages that don't have a message yet
    streamingMessages.forEach((content, messageId) => {
      const exists = messages.some((m) => m.id === messageId);
      if (!exists) {
        combined.push({
          id: messageId,
          sender: 'DM',
          text: '',
          timestamp: Date.now(),
          isStreaming: true,
          streamContent: content,
        });
      }
    });

    return combined;
  }, [messages, streamingMessages]);

  // Filter messages to show public and user-specific private messages
  const visibleMessages = useMemo(
    () => displayMessages.filter((msg) => !msg.recipientId || msg.recipientId === user?.uid),
    [displayMessages, user?.uid]
  );

  // Auto-scroll logic with user override
  useEffect(() => {
    if (!containerRef.current || !autoScroll) return;

    const node = containerRef.current;
    const isNearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 100;

    if (isNearBottom) {
      node.scrollTo({
        top: node.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [visibleMessages.length, streamingMessages.size, autoScroll]);

  // Handle manual scroll to disable auto-scroll
  const handleScroll = () => {
    if (!containerRef.current) return;

    const node = containerRef.current;
    const isNearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 50;
    setAutoScroll(isNearBottom);
  };

  const showLoader = visibleMessages.length === 0 || isProcessing;

  // Get DM presence
  const dmPresence = presence.find((p) => p.type === 'generating' || p.type === 'tool_executing');

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex h-full max-h-full flex-col gap-6 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6"
    >
      {/* World Description */}
      {worldDescription && (
        <div className="rounded-3xl border border-midnight-600/70 bg-midnight-800/60 p-6 shadow-[0_22px_44px_rgba(5,9,18,0.45)]">
          <h3 className="mb-2 text-lg font-bold text-aurora-300">{t('gameplay.worldTitle')}</h3>
          <div className="text-shadow-200">
            <MarkdownMessage content={worldDescription} />
          </div>
        </div>
      )}

      {/* Messages */}
      {visibleMessages.map((msg) => {
        const isDM = msg.sender === 'DM';
        const isPrivate = !!msg.recipientId;
        const content = msg.isStreaming && msg.streamContent ? msg.streamContent : msg.text;

        return (
          <div key={msg.id} className={cn('flex w-full', isDM ? 'justify-start' : 'justify-end')}>
            <div
              className={cn(
                'relative flex w-full max-w-4xl flex-col gap-3 rounded-3xl border px-5 py-4 shadow-[0_24px_38px_rgba(6,10,18,0.45)] backdrop-blur-sm transition',
                isPrivate
                  ? 'border-nebula-500/40 bg-nebula-900/60'
                  : isDM
                    ? 'border-midnight-600/60 bg-midnight-700/80'
                    : 'border-aurora-500/30 bg-aurora-900/35'
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <p
                    className={cn(
                      'text-sm font-semibold uppercase tracking-[0.22em]',
                      isDM ? 'text-aurora-200' : 'text-shadow-100'
                    )}
                  >
                    {msg.sender}
                  </p>
                  {isPrivate && (
                    <span className="flex items-center gap-1 rounded-full bg-nebula-500/25 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-nebula-200">
                      🔒 {t('gameplay.privatePerspective')}
                    </span>
                  )}
                  {msg.isStreaming && (
                    <span className="flex items-center gap-2 rounded-full bg-aurora-500/20 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-aurora-300">
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-aurora-400" />
                      Streaming...
                    </span>
                  )}
                </div>
                <p className="text-xs text-shadow-500">{new Date(msg.timestamp).toLocaleTimeString()}</p>
              </div>

              <div className="prose prose-invert max-w-none text-shadow-50 break-words">
                {isDM ? (
                  <MarkdownMessage content={content} />
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed break-words">{content}</p>
                )}
              </div>

              {msg.images && msg.images.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {msg.images.map((img) => (
                    <img
                      key={img.slice(0, 16)}
                      src={`data:image/png;base64,${img}`}
                      className="h-full w-full rounded-2xl border border-midnight-600/60 object-cover object-center shadow-lg"
                      alt="Generated scene"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* DM Presence Indicator */}
      {dmPresence && (
        <div className="flex justify-start">
          <div className="flex items-center gap-3 rounded-full border border-aurora-500/30 bg-aurora-900/20 px-4 py-2 shadow-lg backdrop-blur-sm">
            <DiceLoader size="small" diceCount={2} maxDiceCount={3} />
            <span className="text-sm font-medium text-aurora-200">
              {dmPresence.metadata?.message || 'DM is thinking...'}
            </span>
            {dmPresence.metadata?.progress !== undefined && (
              <span className="text-xs text-aurora-400">{Math.round(dmPresence.metadata.progress)}%</span>
            )}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {showLoader && !dmPresence && (
        <div className="flex justify-center py-10">
          <DiceLoader
            size="medium"
            diceCount={3}
            message={isProcessing ? t('gameplay.processing') : t('gameplay.adventureBegins')}
            maxDiceCount={5}
          />
        </div>
      )}

      {/* Scroll to Bottom Button (appears when not auto-scrolling) */}
      {!autoScroll && visibleMessages.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setAutoScroll(true);
            if (containerRef.current) {
              containerRef.current.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior: 'smooth',
              });
            }
          }}
          className="fixed bottom-24 right-8 z-10 flex items-center gap-2 rounded-full border border-aurora-500/30 bg-midnight-800/90 px-4 py-2 text-sm font-medium text-aurora-200 shadow-lg backdrop-blur-sm transition hover:bg-midnight-700/90"
        >
          ↓ New messages
        </button>
      )}
    </div>
  );
}
