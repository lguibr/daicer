import { useMemo } from 'react';
import type { Message } from '../../types/shared';
import type { PresenceData, ToolCall as SocketToolCall } from '../../services/socket';
import useAuth from '../../hooks/useAuth';
import { useI18n } from '../../i18n';
import cn from '../../lib/utils';
import { DiceLoader } from '../ui/dice-loader';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  Message as AIMessage,
  MessageContent,
  MessageHeader,
  MessageSender,
  MessageAvatar,
  MessageTime,
  MessageBadge,
  Response,
  Actions,
  ActionCopy,
  ActionRegenerate,
  ActionDelete,
} from '../ai';
import DiceRollCard from '../chat/DiceRollCard';
import ToolCallCard from '../chat/ToolCallCard';

interface DiceRollData {
  dice: string;
  result: number;
  breakdown: string;
  purpose?: string;
}

interface StreamingMessage extends Message {
  isStreaming?: boolean;
  streamContent?: string;
  diceRolls?: DiceRollData[];
  toolCalls?: SocketToolCall[];
}

interface GameplayChatAreaProps {
  messages: Message[];
  streamingMessages: Map<string, string>; // messageId -> accumulated content
  worldDescription: string;
  isProcessing: boolean;
  presence: PresenceData[];
}

/**
 * Enhanced chat area combining AI Elements with game-specific features
 * - Uses new Conversation/Message components for better UX
 * - Preserves DiceRollCard for 3D animations (MANDATORY)
 * - Preserves ToolCallCard for tool visualizations
 * - Adds Actions for copy/regenerate/delete
 */
export default function GameplayChatArea({
  messages,
  streamingMessages,
  worldDescription,
  isProcessing,
  presence,
}: GameplayChatAreaProps) {
  const { user } = useAuth();
  const { t } = useI18n();

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
    () =>
      displayMessages.filter((msg) => {
        const recipient = msg.recipientId || msg.targetPlayer;
        return !recipient || recipient === user?.uid;
      }),
    [displayMessages, user?.uid]
  );

  const showLoader = visibleMessages.length === 0 || isProcessing;

  // Get DM presence
  const dmPresence = presence.find((p) => p.type === 'generating' || p.type === 'tool_executing');

  return (
    <Conversation className="h-full">
      <ConversationContent className="flex flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6">
        {/* World Description */}
        {worldDescription && (
          <div className="rounded-3xl border border-midnight-600/70 bg-midnight-800/60 p-6 shadow-[0_22px_44px_rgba(5,9,18,0.45)]">
            <h3 className="mb-2 text-lg font-bold text-aurora-300">{t('gameplay.worldTitle')}</h3>
            <div className="text-shadow-200">
              <Response>{worldDescription}</Response>
            </div>
          </div>
        )}

        {/* Messages */}
        {visibleMessages.map((msg) => {
          const isDM = msg.sender === 'DM';
          const isPrivate = !!(msg.recipientId || msg.targetPlayer);
          const content = msg.isStreaming && msg.streamContent ? msg.streamContent : msg.text;

          return (
            <div key={msg.id} className={cn('group flex w-full', isDM ? 'justify-start' : 'justify-end')}>
              <AIMessage
                from={isDM ? 'assistant' : 'user'}
                className={cn(
                  'w-full max-w-4xl transition-all duration-300',
                  isPrivate &&
                    'border-2 border-nebula-500/60 bg-gradient-to-br from-nebula-900/80 to-midnight-900/90 shadow-[0_0_30px_rgba(139,92,246,0.15)]'
                )}
              >
                <MessageHeader>
                  <div className="flex items-center gap-3">
                    <MessageAvatar
                      name={msg.sender}
                      src={isDM ? undefined : `https://api.dicebear.com/8.x/lorelei/svg?seed=${msg.sender}`}
                    />
                    <MessageSender isDM={isDM}>{msg.sender}</MessageSender>
                    {isPrivate && <MessageBadge variant="private">🔒 {t('gameplay.privatePerspective')}</MessageBadge>}
                    {msg.isStreaming && <MessageBadge variant="streaming">Streaming...</MessageBadge>}
                  </div>

                  <div className="flex items-center gap-3">
                    <MessageTime timestamp={msg.timestamp} />
                    <Actions>
                      <ActionCopy text={content} />
                      {isDM && (
                        <>
                          <ActionRegenerate messageId={msg.id} />
                          <ActionDelete messageId={msg.id} />
                        </>
                      )}
                    </Actions>
                  </div>
                </MessageHeader>

                <MessageContent>
                  {/* Render DM messages with markdown, player messages as plain text */}
                  {isDM ? (
                    <Response parseIncompleteMarkdown={msg.isStreaming}>{content}</Response>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed break-words text-shadow-50">{content}</p>
                  )}

                  {/* Dice Rolls - MANDATORY FEATURE */}
                  {msg.diceRolls && msg.diceRolls.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {msg.diceRolls.map((roll: DiceRollData, idx: number) => (
                        <DiceRollCard key={`${msg.id}-dice-${idx}`} roll={roll} animate />
                      ))}
                    </div>
                  )}

                  {/* Tool Calls */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {msg.toolCalls.map((toolCall: SocketToolCall, idx: number) => (
                        <ToolCallCard key={`${msg.id}-tool-${idx}`} toolCall={toolCall} status="complete" />
                      ))}
                    </div>
                  )}

                  {/* Generated Images */}
                  {msg.images && msg.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
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
                </MessageContent>
              </AIMessage>
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
      </ConversationContent>

      {/* Scroll to Bottom Button */}
      <ConversationScrollButton />
    </Conversation>
  );
}
