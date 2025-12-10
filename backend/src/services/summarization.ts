/**
 * Conversation Summarization Service
 * Condenses long message histories into compact context for LLM
 */

import { z } from 'zod';
import { logger } from '@/utils/logger';
import type { Message, Language } from '@/types/index';
import { generateStructured } from './llm/structured';

/**
 * Conversation Summary Schema
 */
export const ConversationSummarySchema = z.object({
  summary: z.string().describe('Concise summary of the conversation (2-3 paragraphs max)'),
  keyEvents: z.array(z.string()).describe('Important events that happened (combat encounters, discoveries, decisions)'),
  activeThreads: z.array(z.string()).describe('Ongoing storylines or unresolved plot points'),
  characterStates: z
    .array(
      z.object({
        name: z.string(),
        status: z.string().describe('Current state of this character (injured, cursed, inspired, etc.)'),
      })
    )
    .optional()
    .describe('Notable character states worth remembering'),
  metadata: z.object({
    messageCount: z.number(),
    timeSpan: z.string().describe('Approximate in-game time covered'),
  }),
});

export type ConversationSummary = z.infer<typeof ConversationSummarySchema>;

/**
 * Summarize conversation history
 * Reduces message array to compact summary with key information
 */
export const summarizeConversation = async (
  messages: Message[],
  language: Language = 'en'
): Promise<ConversationSummary> => {
  logger.info('[Summarization] Starting conversation summary', {
    messageCount: messages.length,
    language,
  });

  const systemPrompt = `You are an expert at summarizing D&D game sessions.
Extract the most important information from the conversation history while preserving:
- Key events and decisions
- Combat encounters and outcomes
- Character developments
- Unresolved plot threads
- Current character conditions

Be concise but comprehensive. The summary will be used to provide context to the DM.`;

  const messageText = messages
    .map((m) => {
      const timestamp = new Date(m.timestamp).toISOString();
      return `[${timestamp}] ${m.sender}: ${m.text}`;
    })
    .join('\n');

  const userPrompt = `Summarize this game session conversation:

${messageText}

Provide:
1. A concise overall summary (2-3 paragraphs)
2. Key events that happened
3. Active storylines or unresolved threads
4. Notable character states
5. Approximate in-game time covered`;

  const summary = await generateStructured(ConversationSummarySchema, systemPrompt, userPrompt, language, {
    tags: ['conversation-summarization', `message-count:${messages.length}`],
    metadata: {
      originalMessageCount: messages.length,
      language,
    },
  });

  logger.info('[Summarization] Summary generated', {
    originalMessages: messages.length,
    summaryLength: summary.summary.length,
    keyEvents: summary.keyEvents.length,
    activeThreads: summary.activeThreads.length,
  });

  return summary;
};

/**
 * Determine if summarization is needed
 * Returns true if message count exceeds threshold
 */
export function shouldSummarize(messageCount: number, threshold: number = 50): boolean {
  return messageCount >= threshold;
}

/**
 * Get recent messages for context
 * When using a summary, still include recent messages for immediate context
 */
export function getRecentMessages(messages: Message[], count: number = 10): Message[] {
  return messages.slice(-count);
}

/**
 * Build context string from summary and recent messages
 * This is used as input to turn processing when conversation is long
 */
export function buildContextFromSummary(summary: ConversationSummary, recentMessages: Message[]): string {
  const context = `# Previous Session Summary

${summary.summary}

## Key Events
${summary.keyEvents.map((event, i) => `${i + 1}. ${event}`).join('\n')}

## Active Storylines
${summary.activeThreads.map((thread, i) => `${i + 1}. ${thread}`).join('\n')}

${
  summary.characterStates
    ? `## Character States
${summary.characterStates.map((cs) => `- **${cs.name}**: ${cs.status}`).join('\n')}`
    : ''
}

---

## Recent Activity
${recentMessages.map((m) => `**${m.sender}**: ${m.text}`).join('\n\n')}`;

  return context;
}
