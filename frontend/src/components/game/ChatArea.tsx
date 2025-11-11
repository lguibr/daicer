import type { Message } from '../../types/shared';
import MarkdownMessage from './MarkdownMessage';
import useAuth from '../../hooks/useAuth';

interface ChatAreaProps {
  messages: Message[];
  worldDescription: string;
}

/**
 * Chat area component
 * @param props - Component props
 * @returns Chat UI
 */
export default function ChatArea({ messages, worldDescription }: ChatAreaProps) {
  const { user } = useAuth();

  // Filter messages to show public and user-specific private messages
  const visibleMessages = messages.filter((msg) => !msg.recipientId || msg.recipientId === user?.uid);

  return (
    <div className="p-3 md:p-4 space-y-4">
      {/* World Description */}
      {worldDescription && (
        <div className="p-4 card border border-midnight-600/70">
          <h3 className="text-lg font-bold text-aurora-300 mb-2">The World</h3>
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
          <div key={msg.id} className={`flex flex-col ${isDM ? 'items-start' : 'items-end'}`}>
            <div
              className={`max-w-full md:max-w-3xl p-3 md:p-4 rounded-xl shadow-lg border ${
                isPrivate
                  ? 'bg-nebula-900/70 border-nebula-600/50'
                  : isDM
                    ? 'bg-midnight-700/85 border-midnight-600'
                    : 'bg-aurora-900/40 border-aurora-500/30'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <p className={`font-bold text-sm ${isDM ? 'text-aurora-200' : 'text-shadow-100'}`}>{msg.sender}</p>
                {isPrivate && (
                  <span className="text-xs text-nebula-300 flex items-center gap-1 font-semibold">
                    🔒 Your Perspective
                  </span>
                )}
              </div>
              <div className="prose prose-invert max-w-none text-shadow-50">
                {isDM ? (
                  <MarkdownMessage content={msg.text} />
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                )}
              </div>

              {msg.images && msg.images.length > 0 && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {msg.images.map((img) => (
                    <img
                      key={img.slice(0, 16)}
                      src={`data:image/png;base64,${img}`}
                      className="rounded-lg shadow-lg w-full"
                      alt="Generated scene"
                    />
                  ))}
                </div>
              )}

              <p className="text-xs text-shadow-500 mt-2">{new Date(msg.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        );
      })}

      {messages.length === 0 && (
        <div className="text-center p-8 md:p-12 text-shadow-500">
          <p>The adventure begins...</p>
        </div>
      )}
    </div>
  );
}
