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
    <div className="p-3 md:p-4 space-y-4">
      {/* World Description */}
      {worldDescription && (
        <div className="p-4 card border border-shadow-700/50">
          <h3 className="text-lg font-bold text-aurora-300 mb-2">The World</h3>
          <div className="text-shadow-200">
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
            className={`max-w-full md:max-w-3xl p-3 md:p-4 rounded-xl shadow-lg ${
              msg.sender === 'DM'
                ? 'bg-shadow-900/85 border border-shadow-700'
                : 'bg-midnight-500/80 border border-shadow-700/80'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <p className="font-bold text-sm text-aurora-300">{msg.sender}</p>
              {msg.targetPlayer && (
                <span className="text-xs text-yellow-400 flex items-center gap-1">
                  🔒 Private
                </span>
              )}
            </div>
            <div className="prose prose-invert max-w-none text-shadow-50">
              {msg.sender === 'DM' ? (
                <MarkdownMessage content={msg.text} />
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              )}
            </div>

            {msg.images && msg.images.length > 0 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {msg.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={`data:image/png;base64,${img}`}
                    className="rounded-lg shadow-lg w-full"
                    alt="Generated scene"
                  />
                ))}
              </div>
            )}

            <p className="text-xs text-shadow-400 mt-2">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      ))}

      {messages.length === 0 && (
        <div className="text-center p-8 md:p-12 text-shadow-500">
          <p>The adventure begins...</p>
        </div>
      )}
    </div>
  );
}

