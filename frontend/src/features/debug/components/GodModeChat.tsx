import React, { useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import clsx from 'clsx';

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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    const msg = inputValue.trim();
    onInputChange(''); // Clear input via prop
    await onSendMessage(msg);
  };

  return (
    <div className="flex flex-col h-full bg-midnight-900/50 rounded-xl border border-aurora-500/20 overflow-hidden shadow-lg backdrop-blur-sm">
      {/* Header */}
      <div className="p-3 border-b border-aurora-500/20 bg-midnight-950/80 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-aurora-400" />
        <h3 className="text-xs font-bold text-aurora-300 uppercase tracking-wider">God Mode Interface</h3>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-midnight-700 scrollbar-track-transparent bg-black/20"
      >
        {messages.length === 0 && (
          <div className="text-center mt-10 opacity-50 space-y-2">
            <Sparkles className="w-8 h-8 text-aurora-500/30 mx-auto" />
            <p className="text-xs text-aurora-200/50">Await your command, Creator.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={clsx(
              'flex flex-col gap-1 max-w-[90%]',
              msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'
            )}
          >
            <div
              className={clsx(
                'rounded-lg px-3 py-2 text-xs leading-relaxed shadow-sm',
                msg.role === 'user'
                  ? 'bg-aurora-600/20 text-aurora-100 border border-aurora-500/30 rounded-br-none'
                  : 'bg-midnight-800 text-shadow-200 border border-midnight-700 rounded-bl-none'
              )}
            >
              {msg.content}
            </div>
            <span className="text-[9px] text-shadow-500/50 px-1">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {isProcessing && (
          <div className="self-start flex items-center gap-2 text-xs text-aurora-400/70 p-2 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Divining will...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 bg-midnight-950/50 border-t border-aurora-500/20 flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Command the world (e.g., 'Spawn a dragon at 10,10')"
          className="flex-1 bg-midnight-900 border border-midnight-700 rounded-lg px-3 py-2 text-xs text-shadow-100 focus:outline-none focus:border-aurora-500/50 focus:bg-midnight-800 transition-all placeholder:text-midnight-600"
          disabled={isProcessing}
        />
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          disabled={isProcessing || !inputValue.trim()}
          className="h-8 w-8 text-aurora-400 hover:text-aurora-300 hover:bg-aurora-500/10"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
