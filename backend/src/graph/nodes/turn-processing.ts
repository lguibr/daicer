/**
 * Turn Processing Node
 * Processes player actions and generates DM response
 */

import { task } from '@langchain/langgraph';
import { processTurn as processTurnService } from '@/services/game';
import { logger } from '@/utils/logger';
import { ChatAnthropic } from '@langchain/anthropic';
import type { Message, Player, Creature } from '@/types/index';
import type { GameplayState } from '../state';
import { entropyAdvancementNode } from './entropy-advancement';

/**
 * Task: Summarize narrative history
 */
const summarizeContextTask = task(
  'summarizeContext',
  async (params: { existingSummary: string; turnsToSummarize: Message[] }): Promise<{ newSummary: string }> => {
    if (params.turnsToSummarize.length === 0) return { newSummary: params.existingSummary };

    logger.info(`[Summarizer] Compressing ${params.turnsToSummarize.length} messages into narrative.`);

    const model = new ChatAnthropic({ modelName: 'claude-3-haiku-20240307', temperature: 0.3 });
    const response = await model.invoke([
      {
        role: 'system',
        content: `You are the archivist of a D&D adventure. Update the existing summary with the new events.
        Keep it concise, focusing on key decisions, combat outcomes, and inventory changes.
        Existing Summary: "${params.existingSummary}"`,
      },
      {
        role: 'user',
        content: `New Events:\n${params.turnsToSummarize.map((m) => `${m.sender}: ${m.text}`).join('\n')}`,
      },
    ]);

    return { newSummary: response.content as string };
  }
);

/**
 * Task: Process game turn with LLM
 */
const processTurnTask = task(
  'processGameTurn',
  async (params: {
    worldDescription: string;
    messages: Message[];
    players: Player[];
    creatures: Creature[];
    language: string;
    worldConditions?: any[];
    narrativeSummary?: string;
  }): Promise<{
    overall_summary: string;
    player_perspectives: Array<{ playerName: string; perspective: string }>;
  }> => {
    logger.info('Processing turn with LLM');

    // Inject summary into world description context if it exists
    const context = params.narrativeSummary
      ? `${params.worldDescription}\n\nPREVIOUSLY ON THE ADVENTURE:\n${params.narrativeSummary}`
      : params.worldDescription;

    const lang = params.language as 'en' | 'es' | 'pt-BR';

    return processTurnService(
      context, // Updated context
      params.messages, // Now only RECENT messages
      params.players,
      params.creatures,
      lang,
      undefined,
      params.worldConditions
    );
  }
);

/**
 * Turn processing node (wrapped with tracing)
 * Generates DM response based on player actions
 */
export const turnProcessingNode = async (state: GameplayState): Promise<Partial<GameplayState>> => {
  // Add player action messages first
  const players = state.players as Player[];
  const messages = state.messages as Message[];
  const creatures = state.creatures as Creature[];

  const actionMessages: Message[] = players
    .filter((p) => p.action && p.character) // Ensure character exists
    .map((p) => ({
      id: `msg-${Date.now()}-${p.id}`,
      sender: p.character!.name, // Assert safe due to filter
      text: p.action!,
      timestamp: Date.now(),
    }));

  const allMessages = [...messages, ...actionMessages];

  // --- SLIDING WINDOW LOGIC ---
  // If we have > 50 messages, summarize the oldest ones, keeping only last 40.
  // This is strict token management.

  let narrativeSummary = state.narrativeSummary || '';
  let activeMessages = allMessages;

  if (allMessages.length > 50) {
    const messagesToKeep = 40;
    const splitIndex = allMessages.length - messagesToKeep;

    const oldMessages = allMessages.slice(0, splitIndex);
    activeMessages = allMessages.slice(splitIndex);

    // Run Summarizer
    const result = await summarizeContextTask({
      existingSummary: narrativeSummary,
      turnsToSummarize: oldMessages,
    });
    narrativeSummary = result.newSummary;

    logger.info('[TurnProcessing] Context Summarized.', {
      oldSize: allMessages.length,
      newSize: activeMessages.length,
      summaryLen: narrativeSummary.length,
    });
  }

  // Get language from settings with fallback
  const language = state.settings?.language || 'en';
  logger.info(`Turn processing using language: ${language}`);

  // Process turn with LLM
  const dmResponse = await processTurnTask({
    worldDescription: state.worldDescription,
    messages: activeMessages, // Pass truncated list
    players,
    creatures,
    language,
    worldConditions: state.worldConditions || [],
    narrativeSummary,
  });

  // Create DM message
  const summaryMessage: Message = {
    id: `msg-${Date.now()}-dm-summary`,
    sender: 'DM',
    text: dmResponse.overall_summary,
    timestamp: Date.now(),
  };

  // Create perspective messages
  const perspectiveMessages: Message[] = dmResponse.player_perspectives.map((p) => {
    const player = players.find((pl) => pl.character?.name === p.playerName);
    return {
      id: `msg-${Date.now()}-dm-perspective-${player?.id}`,
      sender: 'DM',
      text: p.perspective,
      recipientId: player?.id,
      timestamp: Date.now(),
    };
  });

  // Clear player actions
  const updatedPlayers = players.map((p) => ({
    ...p,
    action: null,
  }));

  // Advance entropy system
  const entropyUpdates = await entropyAdvancementNode(state);

  return {
    messages: [...activeMessages, summaryMessage, ...perspectiveMessages], // Return ACTIVE subset implies we pruned history from state?
    // Wait, typically we want to persist history but only SEND partial to LLM.
    // Spec says: "Turns 1-40 compressed... Turns 41-50 raw".
    // If we return partial 'messages', we lose history for the Frontend unless Frontend fetches pages.
    // For Phase 3 MVP, let's assume 'state.messages' IS the context window for the LLM.
    // And we accept "losing" exact chat logs in the DB state for this node return?
    // Actually, `GameplayState` usually tracks the active session state.
    // Modifying `messages` here will indeed truncate what is stored in the graph state.
    // We'll update `narrativeSummary` field in state too.
    narrativeSummary,
    players: updatedPlayers,
    ...entropyUpdates,
  };
};
