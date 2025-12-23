import { useEffect, useMemo, useRef } from 'react';
import type { Message } from '../../types/shared';
import MarkdownMessage from './MarkdownMessage';
import useAuth from '../../hooks/useAuth';
import { useI18n } from '../../i18n';
import cn from '../../lib/utils';
import { DiceLoader } from '../ui/dice-loader';

interface ChatAreaProps {
  messages: Message[];
  worldDescription: string;
  isProcessing: boolean;
}

/**
 * Chat area component
 * @param props - Component props
 * @returns Chat UI
 */
export default function ChatArea({ messages, worldDescription, isProcessing }: ChatAreaProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Filter messages to show public and user-specific private messages
  const visibleMessages = useMemo(
    () => messages.filter((msg) => !msg.recipientId || msg.recipientId === user?.uid),
    [messages, user?.uid]
  );

  useEffect(() => {
    if (containerRef.current) {
      const node = containerRef.current;
      node.scrollTo({
        top: node.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [visibleMessages.length, isProcessing]);

  const showLoader = visibleMessages.length === 0 || isProcessing;

  return (
    <div
      ref={containerRef}
      className="flex h-full max-h-full flex-col gap-6 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6"
    >
      {/* World Description */}
      {worldDescription && (
        <div className="rounded-3xl border border-midnight-600/70 bg-midnight-800/60 p-6 shadow-[0_22px_44px_rgba(5,9,18,0.45)]">
          <h3 className="text-lg font-bold text-aurora-300 mb-2">{t('gameplay.worldTitle')}</h3>
          <div className="text-shadow-200">
            <MarkdownMessage content={worldDescription} />
          </div>
        </div>
      )}

      {/* Messages */}
      {visibleMessages.map((msg) => {
        const isDM = msg.sender === 'DM';
        const isPrivate = !!msg.recipientId;

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
                    {msg.sender || 'Unknown'}
                  </p>
                  {isPrivate && (
                    <span className="flex items-center gap-1 rounded-full bg-nebula-500/25 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-nebula-200">
                      🔒 {t('gameplay.privatePerspective')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-shadow-500">{new Date(msg.timestamp).toLocaleTimeString()}</p>
              </div>

              <div className="prose prose-invert max-w-none text-shadow-50 break-words">
                {isDM ? (
                  <MarkdownMessage content={msg.text || ''} />
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed break-words">{msg.text || ''}</p>
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

      {showLoader && (
        <div className="flex justify-center py-10">
          <DiceLoader
            size="medium"
            diceCount={3}
            message={isProcessing ? t('gameplay.processing') : t('gameplay.adventureBegins')}
            maxDiceCount={5}
          />
        </div>
      )}
    </div>
  );
}
