/**
 * DM Chat Panel Component
 * Chat interface for commanding the tactical DM
 * Rule 27: All text via i18n
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { getSocket } from '@/services/socket';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface DmMessage {
  id: string;
  sender: 'user' | 'dm';
  content: string;
  timestamp: number;
  updates?: any[];
}

interface DmChatPanelProps {
  sessionId: string;
  onUpdate: (update: any) => void;
}

export function DmChatPanel({ sessionId, onUpdate }: DmChatPanelProps) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('tactical:dm:response', (data: any) => {
      if (data.sessionId === sessionId) {
        setMessages((prev) => [
          ...prev,
          {
            id: `dm-${Date.now()}`,
            sender: 'dm',
            content: data.response,
            timestamp: Date.now(),
            updates: data.updates,
          },
        ]);
        setIsProcessing(false);
      }
    });

    socket.on('tactical:dm:update', (data: any) => {
      if (data.sessionId === sessionId) {
        onUpdate(data.update);
      }
    });

    socket.on('tactical:dm:error', (data: any) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'dm',
          content: `Error: ${data.error}`,
          timestamp: Date.now(),
        },
      ]);
      setIsProcessing(false);
    });

    return () => {
      socket.off('tactical:dm:response');
      socket.off('tactical:dm:update');
      socket.off('tactical:dm:error');
    };
  }, [sessionId, onUpdate]);

  const handleSend = () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: DmMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);

    // Send to backend
    const socket = getSocket();
    if (socket) {
      socket.emit('tactical:dm:command', {
        sessionId,
        command: input,
        characters: [], // TODO: Pass actual characters
      });
    }

    setInput('');
  };

  const suggestions = [
    'Roll initiative',
    'Fighter moves to (5,3)',
    'Goblin attacks Fighter',
    'Wizard casts Fireball at (8,8)',
  ];

  return (
    <Card className="h-full flex flex-col border-accent/30 bg-midnight-900/95">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-white">{t('tactical.dmChat')}</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden p-4">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {messages.length === 0 && (
            <div className="text-center text-shadow-400 text-xs py-8">
              <p className="mb-2">{t('tactical.dmChatEmpty')}</p>
              <p className="text-shadow-500">{t('tactical.dmChatHint')}</p>
              <div className="mt-4 space-y-1">
                {suggestions.map((sugg) => (
                  <button
                    key={sugg}
                    type="button"
                    onClick={() => setInput(sugg)}
                    className="block w-full text-left px-3 py-2 rounded bg-accent/10 hover:bg-accent/20 text-accent text-xs transition-colors"
                  >
                    {sugg}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-lg p-3 ${msg.sender === 'user' ? 'bg-aurora-900/30 ml-8' : 'bg-accent/10 mr-8'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-white">
                  {msg.sender === 'user' ? t('common.you') : t('tactical.dm')}
                </span>
                <span className="text-[10px] text-shadow-400">{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="text-sm text-shadow-100">{msg.content}</p>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('tactical.dmChatPlaceholder')}
            disabled={isProcessing}
            className="flex-1 px-3 py-2 bg-shadow-900 border border-accent/30 rounded text-white text-sm placeholder:text-shadow-500 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
            data-testid="dm-chat-input"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            size="sm"
            className="bg-accent hover:bg-accent/90"
            data-testid="dm-chat-send"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
