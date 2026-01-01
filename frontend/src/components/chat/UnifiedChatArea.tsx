import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { searchEntities } from '@/services/api';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  Message as AIMessage,
  MessageContent,
  MessageHeader,
  MessageSender,
  MessageAvatar,
  MessageBadge,
  MessageTime,
  Actions,
  ActionCopy,
  ActionRegenerate,
  Response,
} from '@/components/ai';
import { MentionDropdown } from './MentionDropdown';
import DiceRollCard from './DiceRollCard';
import ToolCallCard from './ToolCallCard';
import TraceEventCard from './TraceEventCard';
import { ChatActionToolbar } from './ChatActionToolbar';

// Shared interfaces
export interface UnifiedChatProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[]; // Relaxed type for cross-component compatibility
  currentUser?: { name?: string; id?: string; avatar?: string };
  onSendMessage: (msg: string) => Promise<void>;
  inputValue: string;
  onInputChange: (val: string) => void;
  isProcessing?: boolean;
  mode?: 'game' | 'debug';
  placeholder?: string;
  className?: string;

  // Specific Game Props
  worldDescription?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dmPresence?: any;
  hideInput?: boolean;
}

export function UnifiedChatArea({
  messages,
  currentUser,
  onSendMessage,
  inputValue,
  onInputChange,
  isProcessing = false,
  mode = 'game',
  placeholder,
  className,
  worldDescription,
  dmPresence,
  hideInput = false,
  hideHeader = false,
  ...props
}: UnifiedChatProps & {
  hideHeader?: boolean;
  activeCommand?: { label: string; name: string; prefix?: string; id?: string };
  onClearCommand?: () => void;
  onCommandSelect?: (cmd: { prefix: string; id: string; name: string; label: string }) => void;
  activeLocation?: { label: string; x: number; y: number; z: number };
  onClearLocation?: () => void;
  activeEntity?: { id: string; name: string };
  showTools?: boolean;
}) {
  // Start of body
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);

  // Mention State ... (lines 64-149 preserved implicitly by range, but I need to match StartLine carefully)
  // Logic: I will only replace the props destructuring and the header render block.
  // Actually, simpler to just replace the header block if I can access props.
  // But props are destructured in function signature. I need to update signature too.

  // Let's do partial replacements.
  // 1. Update Props Interface and Destructuring

  // Mention State
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{ id: string; name: string; type: 'monster' | 'character' }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  // Debounce Search
  useEffect(() => {
    if (mentionQuery === null) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchEntities(mentionQuery);
        setSuggestions(results);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [mentionQuery]);

  const handleLocalInputChange = (val: string) => {
    onInputChange(val);

    // Detect @mention trigger: text ending with @ or @word
    const match = val.match(/(?:^|\s)@(\w*)$/);
    if (match) {
      const query = match[1];
      setMentionQuery(query || '');

      // Calculate position (simple approximation: above input)
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.top - 300, // Show above, fixed height approx
          left: rect.left + 20,
        });
      }
    } else {
      setMentionQuery(null);
    }
  };

  const handleSelectMention = (entity: { id: string; name: string; type: 'monster' | 'character' }) => {
    // Replace the incomplete @word with @EntityName
    // We strictly replace the *last* occurrence if we matched end-of-string
    const match = inputValue.match(/(?:^|\s)@(\w*)$/);
    if (match && match.index !== undefined) {
      const prefix = inputValue.slice(0, match.index + (match[0].startsWith(' ') ? 1 : 0));
      // We use the entity Name directly.
      // If it contains spaces, we might want quotes, but for now just name.
      const newValue = `${prefix}@${entity.name} `;
      onInputChange(newValue);
    }
    setMentionQuery(null);
    inputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputValue.trim() && !props.activeCommand && !props.activeLocation) || isProcessing) return;
    const msg = inputValue.trim();
    onInputChange(''); // Clear only text input, command is cleared by parent after send
    await onSendMessage(msg);
  };

  const isGameMode = mode === 'game';
  const isDebugMode = mode === 'debug';

  return (
    <div className={clsx('flex flex-col h-full', className)}>
      <MentionDropdown
        suggestions={suggestions}
        isLoading={isSearching}
        position={dropdownPos}
        onSelect={handleSelectMention}
        onClose={() => setMentionQuery(null)}
      />

      {/* Debug Header */}
      {isDebugMode && !hideHeader && (
        <div className="p-3 border-b border-aurora-500/20 bg-midnight-900 flex items-center gap-2 shadow-sm z-10 shrink-0">
          <Sparkles className="w-4 h-4 text-aurora-400" />
          <h3 className="text-xs font-bold text-aurora-300 uppercase tracking-wider">God Mode Interface</h3>
        </div>
      )}

      {/* Tools Toolbar */}
      {props.showTools && props.onCommandSelect && (
        <div className="bg-midnight-900/80 border-b border-midnight-800 p-2 z-10">
          <ChatActionToolbar onCommandSelect={props.onCommandSelect} activeEntity={props.activeEntity} />
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 min-h-0 relative">
        <Conversation className="h-full">
          <ConversationContent
            className={clsx('flex flex-col px-4 py-4 sm:px-6 sm:py-6', isDebugMode ? 'gap-4' : 'gap-6')}
          >
            {/* Disclaimer / Empty State */}
            {messages.length === 0 && isDebugMode && (
              <div className="text-center mt-10 opacity-50 space-y-2">
                <Sparkles className="w-8 h-8 text-aurora-500/30 mx-auto" />
                <p className="text-xs text-aurora-200/50">Await your command, Creator.</p>
              </div>
            )}

            {/* World Description (Game Only) */}
            {isGameMode && worldDescription && (
              <div className="rounded-3xl border border-midnight-600/70 bg-midnight-800/60 p-6 shadow-[0_22px_44px_rgba(5,9,18,0.45)]">
                <h3 className="mb-2 text-lg font-bold text-aurora-300">{t('gameplay.worldTitle')}</h3>
                <div className="text-shadow-200">
                  <Response>{worldDescription}</Response>
                </div>
              </div>
            )}

            {/* Message List */}
            {messages.map((msg) => {
              // Normalize message properties handling 'role', 'sender', etc.
              const role = msg.role || (msg.sender === 'DM' ? 'assistant' : 'user');
              const isAssistant = role === 'assistant' || role === 'system';
              const isUser = role === 'user';
              const isSystem = role === 'system' && isDebugMode;

              if (isSystem) {
                // If it's a Trace Event (God Mode)
                if (msg.isEvent) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2 w-full px-4">
                      <TraceEventCard event={msg.data} />
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className="bg-midnight-800/80 border border-aurora-500/20 rounded-full px-3 py-1 text-[10px] text-aurora-300 shadow-sm flex items-center gap-2">
                      <Sparkles className="w-3 h-3" />
                      {msg.content}
                    </div>
                  </div>
                );
              }

              const content = msg.streamContent || msg.content || msg.text;
              const senderName = isUser ? currentUser?.name || 'You' : msg.sender || 'DM';
              const isPrivate = !!(msg.recipientId || msg.targetPlayer);

              const avatarSrc = isUser
                ? currentUser?.avatar
                : `https://api.dicebear.com/8.x/lorelei/svg?seed=${senderName}`;

              return (
                <div
                  key={msg.id}
                  className={clsx(
                    'group flex w-full',
                    isUser ? 'justify-end' : 'justify-start',
                    isPrivate && 'justify-center'
                  )}
                >
                  <AIMessage
                    from={isUser ? 'user' : 'assistant'}
                    className={clsx(
                      'w-full max-w-4xl transition-all duration-300 relative overflow-hidden',
                      isPrivate &&
                        'border-2 border-nebula-500/60 bg-gradient-to-br from-nebula-900/90 to-midnight-950/90 shadow-[0_0_40px_rgba(139,92,246,0.2)]'
                    )}
                  >
                    {/* Watermark */}
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
                            name={senderName}
                            src={avatarSrc}
                            className={isPrivate ? 'border-nebula-400 ring-2 ring-nebula-500/20' : undefined}
                          />
                          <MessageSender isDM={!isUser} className={isPrivate ? 'text-nebula-200' : undefined}>
                            {senderName}
                          </MessageSender>
                          {isPrivate && (
                            <MessageBadge variant="private">🔒 {t('gameplay.privatePerspective')}</MessageBadge>
                          )}
                          {msg.isStreaming && <MessageBadge variant="streaming">Streaming...</MessageBadge>}
                        </div>
                        <div className="flex items-center gap-3">
                          {msg.timestamp && <MessageTime timestamp={msg.timestamp} />}
                          <Actions>
                            {content && <ActionCopy text={content} />}
                            {!isUser && msg.id && isDebugMode && <ActionRegenerate messageId={msg.id} />}
                          </Actions>
                        </div>
                      </MessageHeader>

                      <MessageContent>
                        {isAssistant ? (
                          <Response parseIncompleteMarkdown={msg.isStreaming}>{content}</Response>
                        ) : (
                          <p className="whitespace-pre-wrap leading-relaxed break-words text-shadow-50">{content}</p>
                        )}

                        {/* Dice Rolls */}
                        {msg.diceRolls?.length > 0 && (
                          <div className="mt-4 space-y-3">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {msg.diceRolls.map((roll: any, i: number) => (
                              <DiceRollCard key={`${msg.id}-dice-${i}`} roll={roll} animate />
                            ))}
                          </div>
                        )}

                        {/* Tool Calls */}
                        {msg.toolCalls?.length > 0 && (
                          <div className="mt-4 space-y-3">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {msg.toolCalls.map((tc: any, i: number) => (
                              <ToolCallCard key={`${msg.id}-tool-${i}`} toolCall={tc} status="complete" />
                            ))}
                          </div>
                        )}

                        {/* Images */}
                        {msg.images?.length > 0 && (
                          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                            {msg.images.map((img: string) => (
                              <img
                                key={img.slice(0, 16)}
                                src={`data:image/png;base64,${img}`}
                                className="h-full w-full rounded-2xl border border-midnight-600/60 object-cover object-center shadow-lg"
                                alt="Generated"
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

            {/* Processing Indicators */}
            {(isProcessing || dmPresence) && (
              <div className="flex justify-start animate-pulse pt-2">
                <div className="flex items-center gap-2 bg-midnight-800 rounded-2xl px-4 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-aurora-400" />
                  <span className="text-xs text-shadow-400">
                    {dmPresence?.metadata?.message ||
                      (isDebugMode ? 'Processing command...' : t('gameplay.processing'))}
                  </span>
                </div>
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      {/* Input Area */}
      {/* Input Area */}
      {!hideInput && (
        <form
          onSubmit={handleSubmit}
          className="p-3 bg-midnight-900 border-t border-midnight-800 flex gap-2 z-10 shrink-0"
        >
          <div className="flex-1 flex items-center gap-2 bg-midnight-950 border border-midnight-700 rounded-xl px-4 py-3 focus-within:border-aurora-500/50 focus-within:ring-1 focus-within:ring-aurora-500/20 transition-all">
            {/* Active Command Tag */}
            {props.activeCommand && (
              <div className="flex items-center gap-1.5 bg-aurora-500/10 border border-aurora-500/30 rounded-md pl-2 pr-1 py-0.5 shrink-0 animate-in fade-in zoom-in-95 duration-200">
                <span className="text-xs font-bold text-aurora-300 uppercase tracking-wide">
                  {props.activeCommand.label}:
                </span>
                <span className="text-sm font-medium text-aurora-100">{props.activeCommand.name}</span>
                <button
                  type="button"
                  onClick={props.onClearCommand}
                  className="ml-1 p-0.5 rounded-full hover:bg-aurora-500/20 text-aurora-400 hover:text-aurora-200 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Active Location Tag */}
            {props.activeLocation && (
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-md pl-2 pr-1 py-0.5 shrink-0 animate-in fade-in zoom-in-95 duration-200">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide">AT</span>
                <span className="text-sm font-medium text-emerald-100 font-mono">{props.activeLocation.label}</span>
                <button
                  type="button"
                  onClick={props.onClearLocation}
                  className="ml-1 p-0.5 rounded-full hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-200 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                handleLocalInputChange(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && !inputValue) {
                  if (props.activeLocation && props.onClearLocation) {
                    props.onClearLocation();
                  } else if (props.activeCommand && props.onClearCommand) {
                    props.onClearCommand();
                  }
                }
              }}
              placeholder={
                props.activeCommand || props.activeLocation
                  ? 'Add details...'
                  : placeholder || (isDebugMode ? 'Command the world...' : t('gameplay.placeholder'))
              }
              className="flex-1 bg-transparent border-none p-0 text-sm text-shadow-100 focus:outline-none placeholder:text-midnight-600 min-w-[50px]"
              disabled={isProcessing}
            />
          </div>

          <Button
            type="submit"
            size="icon"
            disabled={isProcessing || (!inputValue.trim() && !props.activeCommand && !props.activeLocation)}
            className="h-full aspect-square bg-aurora-600 hover:bg-aurora-500 text-white rounded-xl shadow-lg shadow-aurora-900/20 transition-all active:scale-95 shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      )}
    </div>
  );
}
