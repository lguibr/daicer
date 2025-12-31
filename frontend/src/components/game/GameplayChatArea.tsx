import { useMemo } from 'react';
import type { Message } from '@daicer/engine';
import type { PresenceData, ToolCall as SocketToolCall } from '../../services/socket';
import useAuth from '../../hooks/useAuth';
// import { useI18n } from '../../i18n';
import { UnifiedChatArea } from '../chat/UnifiedChatArea';

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentUserCharacter?: any; // To be typed properly if Character definition is shared
}

/**
 * Enhanced chat area combining AI Elements with game-specific features
 * Now wraps UnifiedChatArea for shared logic.
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
  // const { t } = useI18n();

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

  // Get DM presence
  const dmPresence = presence.find((p) => p.type === 'generating' || p.type === 'tool_executing');

  return (
    <UnifiedChatArea
      messages={visibleMessages}
      currentUser={{
        id: currentUserId,
        name: currentUserCharacter?.name,
        avatar: currentUserCharacter?.portraitUrl,
      }}
      onSendMessage={async () => {}} // No-op, input is hidden
      inputValue=""
      onInputChange={() => {}}
      isProcessing={isProcessing}
      mode="game"
      worldDescription={worldDescription}
      dmPresence={dmPresence}
      hideInput
    />
  );
}
