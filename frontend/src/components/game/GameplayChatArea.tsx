import { useMemo } from 'react';
import type { Message } from '../../types/models';
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
  content?: string; // Legacy compatibility
  diceRolls?: DiceRollData[];
  toolCalls?: SocketToolCall[];
  recipientId?: string;
  targetPlayer?: string;
  images?: string[];
}

interface GameplayChatAreaProps {
  messages: Message[];
  streamingMessages: Map<string, string>; // messageId -> accumulated content
  worldDescription: string;
  isProcessing: boolean;
  presence: PresenceData[];
  currentUserId?: string; // Strapi Document ID of the current user
  currentUserCharacter?: any; // To be typed properly if Character definition is shared
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
  currentUserId,
  currentUserCharacter,
}: GameplayChatAreaProps) {
  const { user } = useAuth();
  const { t } = useI18n();

  // Combine messages with streaming content
  const displayMessages = useMemo(() => {
    const combined: StreamingMessage[] = messages.map((msg) => {
      // Logic moved: filter logic is later, but map logic needs ID.
      // Message ID should exist.
      if (!msg.id) return msg;

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
          content, // Map content to satisfy StreamingMessage type
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
        // Check either provided ID (Strapi Document ID) or Auth UID (Firebase)
        // Backend usually sends Document ID in recipient field.
        return !recipient || recipient === currentUserId || recipient === user?.uid;
      }),
    [displayMessages, user?.uid, currentUserId]
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
          const content = msg.isStreaming && msg.streamContent ? msg.streamContent : msg.content || msg.text;

          // Private DM Logic: "Your Perspective"
          const senderName = isPrivate ? 'Your Perspective' : msg.sender;
          // Use user's character avatar for private perspective if available, otherwise DM or dicebear
          const avatarSrc =
            isPrivate && currentUserCharacter?.portraitUrl
              ? currentUserCharacter.portraitUrl
              : isPrivate
                ? undefined // Fallback to initial if no portrait
                : isDM
                  ? undefined
                  : `https://api.dicebear.com/8.x/lorelei/svg?seed=${msg.sender}`;

          return (
            <div
              key={msg.id}
              className={cn('group flex w-full', isPrivate ? 'justify-center' : isDM ? 'justify-start' : 'justify-end')}
            >
              <AIMessage
                from={isDM ? 'assistant' : 'user'}
                className={cn(
                  'w-full max-w-4xl transition-all duration-300 relative overflow-hidden',
                  isPrivate &&
                    'border-2 border-nebula-500/60 bg-gradient-to-br from-nebula-900/90 to-midnight-950/90 shadow-[0_0_40px_rgba(139,92,246,0.2)]'
                )}
              >
                {/* Logo Watermark for Private Messages */}
                {isPrivate && (
                  <div
                    className="absolute inset-0 z-0 bg-[url('/logo.png')] bg-no-repeat bg-center bg-contain opacity-5 pointer-events-none"
                    aria-hidden="true"
                  />
                )}

                <div className="relative z-10 flex flex-col gap-3">
                  <MessageHeader>
                    <div className="flex items-center gap-3">
                      <MessageAvatar
                        name={isPrivate && currentUserCharacter?.name ? currentUserCharacter.name : senderName}
                        src={avatarSrc}
                        className={isPrivate ? 'border-nebula-400 ring-2 ring-nebula-500/20' : undefined}
                      />
                      <MessageSender isDM={isDM} className={isPrivate ? 'text-nebula-200' : undefined}>
                        {senderName}
                      </MessageSender>
                      {isPrivate && (
                        <MessageBadge variant="private">🔒 {t('gameplay.privatePerspective')}</MessageBadge>
                      )}
                      {msg.isStreaming && <MessageBadge variant="streaming">Streaming...</MessageBadge>}
                    </div>

                    <div className="flex items-center gap-3">
                      <MessageTime timestamp={msg.timestamp} />
                      <Actions>
                        {content && <ActionCopy text={content} />}
                        {isDM && msg.id && (
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

                    {/* Metadata / Thought Process */}
                    {isDM && msg.metadata && (
                      <div className="mt-4 rounded-lg border border-midnight-700 bg-midnight-900/50 p-3">
                        <details className="group/details">
                          <summary className="flex cursor-pointer items-center gap-2 text-xs font-medium text-shadow-400 hover:text-shadow-200">
                            <span className="transition-transform group-open/details:rotate-90">▶</span>
                            <span>Thinking Process & Context</span>
                          </summary>
                          <div className="mt-3 space-y-4 text-xs text-shadow-300">
                            {msg.metadata.ragContext && (
                              <div>
                                <h4 className="mb-2 flex items-center gap-2 font-bold text-aurora-300">
                                  <span className="text-lg">📚</span> Relevant Rules (RAG)
                                </h4>
                                <RAGContextViewer text={msg.metadata.ragContext} />
                              </div>
                            )}
                            {msg.metadata.toolCalls && (
                              <div>
                                <h4 className="mb-2 flex items-center gap-2 font-bold text-nebula-300">
                                  <span className="text-lg">🛠️</span> Tool Calls
                                </h4>
                                <ToolCallsViewer toolCalls={msg.metadata.toolCalls} />
                              </div>
                            )}
                          </div>
                        </details>
                      </div>
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
                </div>
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

// --- Helper Components ---

interface RAGRule {
  id: string;
  title: string;
  relevance: string;
  category: string;
  content: string;
}

function RAGContextViewer({ text }: { text: string }) {
  // Parse the RAG text. Assuming format: "**Rule N: Title** (relevance: X%) Category: Y ...content..."
  // If parsing fails, fallback to raw text.

  const rules: RAGRule[] = useMemo(() => {
    try {
      // Split by "**Rule " to find segments
      const parts = text.split(/\*\*Rule /g);
      // First part might be empty or preamble
      const parsedRules = parts
        .slice(1) // Skip preamble
        .map((part) => {
          // Re-add "Rule " prefix for regex matching if needed, or just parse the rest
          // part looks like: "1: Title** (relevance: X%) Category: Y ...content..."

          const titleMatch = part.match(/^(\d+): (.*?)\*\*/);
          if (!titleMatch) return null;

          const ruleNumber = titleMatch[1];
          const title = titleMatch[2];
          const rest = part.substring(titleMatch[0].length);

          // Extract metadata
          const relevanceMatch = rest.match(/\(relevance: (.*?)\)/);
          const categoryMatch = rest.match(/Category: (.*?)\s/);

          const relevance = relevanceMatch ? relevanceMatch[1] : 'Unknown';
          const category = categoryMatch ? categoryMatch[1] : 'General';

          // Content is what's left after metadata
          // Clean up leading metadata text
          let content = rest
            .replace(/\(relevance: .*?\)/, '')
            .replace(/Category: .*?\s/, '')
            .trim();

          // Remove trailing dashes if any
          if (content.startsWith('-') || content.startsWith('—')) {
            content = content.replace(/^[—\-\s]+/, '');
          }

          return {
            id: ruleNumber,
            title,
            relevance,
            category,
            content,
          };
        })
        .filter((rule): rule is RAGRule => rule !== null);

      return parsedRules;
    } catch (e) {
      console.error('Failed to parse RAG context', e);
      return [];
    }
  }, [text]);

  if (rules.length === 0) {
    return (
      <div className="rounded bg-midnight-950 p-3 font-mono text-[10px] leading-relaxed opacity-80 whitespace-pre-wrap">
        {text}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-1">
      {rules.map((rule) => (
        <div
          key={rule.id}
          className="relative overflow-hidden rounded-lg border border-aurora-500/20 bg-midnight-950/50 p-3 shadow-sm transition-all hover:border-aurora-500/40 hover:bg-midnight-950/80"
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <h5 className="font-bold text-aurora-200">
              <span className="mr-2 opacity-50">#{rule.id}</span>
              {rule.title}
            </h5>
            <div className="flex flex-col items-end gap-1 text-[10px]">
              <span className="rounded-full bg-aurora-500/10 px-2 py-0.5 text-aurora-300">{rule.relevance} match</span>
              <span className="text-shadow-400 uppercase tracking-wider">{rule.category}</span>
            </div>
          </div>
          <p className="text-shadow-300 leading-relaxed opacity-90">{rule.content}</p>
        </div>
      ))}
    </div>
  );
}

function ToolCallsViewer({ toolCalls }: { toolCalls: SocketToolCall[] }) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="space-y-2">
      {toolCalls.map((call, idx) => (
        <div key={idx} className="rounded-md border border-nebula-500/20 bg-midnight-950/50 p-2 font-mono text-[10px]">
          <div className="mb-1 flex items-center justify-between border-b border-nebula-500/10 pb-1">
            <span className="font-bold text-nebula-300">{call.toolName || 'Unknown Tool'}</span>
            <span className="opacity-50">call_id: {call.id?.slice(0, 8)}...</span>
          </div>
          <div className="overflow-x-auto py-1">
            <pre className="text-shadow-300">{JSON.stringify(call.parameters, null, 2)}</pre>
          </div>
        </div>
      ))}
    </div>
  );
}
