import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket } from '../services/socket';

export interface StreamEvent {
  streamId: string;
  roomId: string;
  type: 'text' | 'tool_start' | 'tool_end' | 'reasoning' | 'error' | 'done';
  content?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface StreamState {
  id: string;
  roomId: string;
  content: string;
  reasoning: string;
  status: 'active' | 'completed' | 'error';
  tools: Array<{
    name: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    output?: any;
    status: 'running' | 'completed';
  }>;
  error?: string;
}

/**
 * Hook to consume unified LLM streaming events
 * @param filterStreamId - Optional stream ID to filter events
 * @param socketInstance - Optional socket instance (to trigger re-subscription on reconnect)
 * @returns Map of active streams
 */
export function useLLMStream(filterStreamId?: string, socketInstance?: Socket | null) {
  const [streams, setStreams] = useState<Record<string, StreamState>>({});

  useEffect(() => {
    const socket = socketInstance || getSocket();
    if (!socket) return;

    const handleEvent = (event: StreamEvent) => {
      if (filterStreamId && event.streamId !== filterStreamId) return;

      setStreams((prev) => {
        const current = prev[event.streamId] || {
          id: event.streamId,
          roomId: event.roomId,
          content: '',
          reasoning: '',
          status: 'active',
          tools: [],
        };

        const updated = { ...current };

        switch (event.type) {
          case 'text':
            updated.content += event.content || '';
            break;
          case 'reasoning':
            updated.reasoning += event.content || '';
            break;
          case 'tool_start':
            updated.tools = [
              ...updated.tools,
              {
                name: event.metadata?.toolName || 'unknown',
                input: event.metadata?.input,
                status: 'running',
              },
            ];
            break;
          case 'tool_end':
            updated.tools = updated.tools.map((t) =>
              t.name === event.metadata?.toolName && t.status === 'running'
                ? { ...t, output: event.metadata?.output, status: 'completed' }
                : t
            );
            break;
          case 'error':
            updated.status = 'error';
            updated.error = event.content;
            break;
          case 'done':
            updated.status = 'completed';
            break;
          default:
            break;
        }

        return { ...prev, [event.streamId]: updated };
      });
    };

    socket.on('llm:stream:event', handleEvent);

    return () => {
      socket.off('llm:stream:event', handleEvent);
    };
  }, [filterStreamId, socketInstance]);

  return streams;
}
