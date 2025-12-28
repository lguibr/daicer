import React, { useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
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
} from '@/components/ai';

export interface GodModeMessage {
  id: string;
  role: 'user' | 'system' | 'assistant';
  content: string;
  timestamp: number;
}

interface GodModeChatProps {
  messages: GodModeMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isProcessing?: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
}

export function GodModeChat({
  messages,
  onSendMessage,
  isProcessing = false,
  inputValue,
  onInputChange,
}: GodModeChatProps) {
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    const msg = inputValue.trim();
    onInputChange(''); // Clear input via prop
    await onSendMessage(msg);
  };

  return (
    <div className="flex flex-col h-full bg-midnight-950 rounded-xl overflow-hidden shadow-2xl border border-midnight-800">
      {/* Header */}
      <div className="p-3 border-b border-aurora-500/20 bg-midnight-900 flex items-center gap-2 shadow-sm z-10">
        <Sparkles className="w-4 h-4 text-aurora-400" />
        <h3 className="text-xs font-bold text-aurora-300 uppercase tracking-wider">God Mode Interface</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 relative">
        <Conversation className="h-full">
          <ConversationContent className="p-4 gap-4">
            {messages.length === 0 && (
              <div className="text-center mt-10 opacity-50 space-y-2">
                <Sparkles className="w-8 h-8 text-aurora-500/30 mx-auto" />
                <p className="text-xs text-aurora-200/50">Await your command, Creator.</p>
              </div>
            )}

            {messages.map((msg) => {
              const isSystem = msg.role === 'system';
              const isAssistant = msg.role === 'assistant';
              const isUser = msg.role === 'user';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className="bg-midnight-800/80 border border-aurora-500/20 rounded-full px-3 py-1 text-[10px] text-aurora-300 shadow-sm flex items-center gap-2">
                      <Sparkles className="w-3 h-3" />
                      {msg.content}
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={clsx('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
                  <AIMessage from={isUser ? 'user' : 'assistant'} className="max-w-[90%]">
                    <div className="flex flex-col gap-2">
                      <MessageHeader>
                        <div className="flex items-center gap-2">
                          <MessageAvatar
                            name={isUser ? 'Creator' : 'System'}
                            src={!isUser ? '/logo.png' : undefined}
                            className={isUser ? 'border-aurora-500/50' : 'border-midnight-500'}
                          />
                          <MessageSender isDM={!isUser}>{isUser ? 'Creator' : 'System'}</MessageSender>
                          <MessageTime timestamp={msg.timestamp} />
                        </div>
                      </MessageHeader>
                      <MessageContent>
                        <p className="whitespace-pre-wrap leading-relaxed text-shadow-100 text-sm">{msg.content}</p>
                      </MessageContent>
                    </div>
                  </AIMessage>
                </div>
              );
            })}

            {isProcessing && (
              <div className="flex justify-start animate-pulse">
                <div className="flex items-center gap-2 bg-midnight-800 rounded-2xl px-4 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-aurora-400" />
                  <span className="text-xs text-shadow-400">Processing command...</span>
                </div>
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 bg-midnight-900 border-t border-midnight-800 flex gap-2 z-10">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Command the world (e.g., 'Spawn a dragon at 10,10')"
          className="flex-1 bg-midnight-950 border border-midnight-700 rounded-xl px-4 py-3 text-sm text-shadow-100 focus:outline-none focus:border-aurora-500/50 focus:ring-1 focus:ring-aurora-500/20 transition-all placeholder:text-midnight-600"
          disabled={isProcessing}
        />
        <Button
          type="submit"
          size="icon"
          disabled={isProcessing || !inputValue.trim()}
          className="h-full aspect-square bg-aurora-600 hover:bg-aurora-500 text-white rounded-xl shadow-lg shadow-aurora-900/20 transition-all active:scale-95"
        >
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );
}
