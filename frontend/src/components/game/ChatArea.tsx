/**
 * Chat area displaying message history
 */

import React from 'react';
import type { Message } from '../../types/shared';
import { MarkdownMessage } from './MarkdownMessage';

interface ChatAreaProps {
  messages: Message[];
  worldDescription: string;
}

/**
 * Chat area component
 * @param props - Component props
 * @returns Chat UI
 */
export function ChatArea({ messages, worldDescription }: ChatAreaProps) {
  // Get current user ID for filtering private messages
  const currentUserId = sessionStorage.getItem('currentUserId');

  // Filter messages - show all public or private messages for current user
  const visibleMessages = messages.filter(
    (msg) => !msg.targetPlayer || msg.targetPlayer === currentUserId
  );

  return (
    <div className="p-4 space-y-4">
      {/* World Description */}
      {worldDescription && (
        <div className="p-4 bg-slate-800 rounded-lg border border-cyan-500/30">
          <h3 className="text-lg font-bold text-cyan-400 mb-2">The World</h3>
          <div className="text-slate-300">
            <MarkdownMessage content={worldDescription} />
          </div>
        </div>
      )}

      {/* Messages */}
      {visibleMessages.map((msg) => (
        <div
          key={msg.id}
          className={`flex flex-col ${msg.sender === 'DM' ? 'items-start' : 'items-end'}`}
        >
          <div
            className={`max-w-3xl p-4 rounded-lg ${
              msg.sender === 'DM'
                ? 'bg-slate-700 border border-slate-600'
                : 'bg-cyan-800/50 border border-cyan-600/50'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <p className="font-bold text-sm text-cyan-300">{msg.sender}</p>
              {msg.targetPlayer && (
                <span className="text-xs text-yellow-400 flex items-center gap-1">
                  🔒 Private
                </span>
              )}
            </div>
            {msg.sender === 'DM' ? (
              <div className="prose prose-invert max-w-none">
                <MarkdownMessage content={msg.text} />
              </div>
            ) : (
              <p className="text-white whitespace-pre-wrap leading-relaxed">{msg.text}</p>
            )}

            {msg.images && msg.images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {msg.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={`data:image/png;base64,${img}`}
                    className="rounded-lg shadow-lg"
                    alt="Generated scene"
                  />
                ))}
              </div>
            )}

            <p className="text-xs text-slate-400 mt-2">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      ))}

      {messages.length === 0 && (
        <div className="text-center p-12 text-slate-500">
          <p>The adventure begins...</p>
        </div>
      )}
    </div>
  );
}

