/**
 * Human-in-the-Loop Interaction Tools
 * Allow agents to ask clarifying questions and wait for human responses
 */

import { tool } from '@langchain/core/tools';
import { Command } from '@langchain/langgraph';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import type { GameplayState } from '@/graph/state';
import { getFirestore } from '@/config/firebase';
import { logger } from '@/utils/logger';

/**
 * Pending Question Schema
 */
export const PendingQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  context: z.string().optional(),
  askedAt: z.number(),
  answeredAt: z.number().optional(),
  answer: z.string().optional(),
  askedBy: z.enum(['dm', 'system', 'combat']),
});

export type PendingQuestion = z.infer<typeof PendingQuestionSchema>;

/**
 * Store a pending question in Firestore
 */
export async function storePendingQuestion(
  roomId: string,
  question: string,
  context?: string,
  askedBy: 'dm' | 'system' | 'combat' = 'dm'
): Promise<string> {
  const questionId = uuidv4();
  const pendingQuestion: PendingQuestion = {
    id: questionId,
    question,
    context,
    askedAt: Date.now(),
    askedBy,
  };

  await getFirestore()
    .collection('rooms')
    .doc(roomId)
    .collection('pendingQuestions')
    .doc(questionId)
    .set(pendingQuestion);

  logger.info('[HumanInteraction] Question stored', {
    roomId,
    questionId,
    question: question.slice(0, 100),
  });

  return questionId;
}

/**
 * Get a pending question by ID
 */
export async function getPendingQuestion(roomId: string, questionId: string): Promise<PendingQuestion | null> {
  const doc = await getFirestore().collection('rooms').doc(roomId).collection('pendingQuestions').doc(questionId).get();

  if (!doc.exists) {
    return null;
  }

  return doc.data() as PendingQuestion;
}

/**
 * Store answer to a pending question
 */
export async function answerPendingQuestion(roomId: string, questionId: string, answer: string): Promise<void> {
  await getFirestore().collection('rooms').doc(roomId).collection('pendingQuestions').doc(questionId).update({
    answer,
    answeredAt: Date.now(),
  });

  logger.info('[HumanInteraction] Question answered', {
    roomId,
    questionId,
    answer: answer.slice(0, 100),
  });
}

/**
 * Ask Human Tool
 * Pauses graph execution and waits for human response
 */
export const askHumanTool = tool(
  async ({ question, context }, config) => {
    const state = config?.configurable?.state as GameplayState | undefined;
    if (!state) {
      return 'Error: No game state available';
    }

    const { roomId } = state;

    try {
      // Store the question
      const questionId = await storePendingQuestion(roomId, question, context, 'dm');

      logger.info('[HumanInteraction] Agent asking human question', {
        roomId,
        questionId,
        question,
      });

      // Return a Command that interrupts the graph
      // The graph will pause here until the user responds
      return new Command({
        goto: 'human_input_node',
        update: {
          pendingQuestion: {
            id: questionId,
            question,
            context,
            askedAt: Date.now(),
          },
        },
      });
    } catch (error) {
      logger.error('[HumanInteraction] Error asking question', error);
      return `Error: Unable to ask question - ${(error as Error).message}`;
    }
  },
  {
    name: 'ask_human',
    description: `Ask the human user for clarification or additional information. Use this when you need:
- Clarification on ambiguous player intent
- Player preference on multiple valid options
- Information not available in the current game state
- Confirmation before taking a significant action

The graph will pause execution until the user responds. Only use this when truly necessary.`,
    schema: z.object({
      question: z.string().describe('Clear, specific question to ask the user'),
      context: z.string().optional().describe('Optional context explaining why you need this information'),
    }),
  }
);

/**
 * Export all human interaction tools
 */
export const humanInteractionTools = [askHumanTool];
