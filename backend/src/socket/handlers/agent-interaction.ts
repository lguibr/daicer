/**
 * Socket handlers for agent interaction events
 * Real-time communication for human-in-the-loop features
 */

import type { Socket } from 'socket.io';
import { logger } from '@/utils/logger';
import { answerPendingQuestion, getPendingQuestion } from '@/combat/tools/human-interaction';

/**
 * Register agent interaction socket handlers
 */
export function registerAgentInteractionHandlers(socket: Socket) {
  /**
   * agent:question
   * Emitted by backend when agent asks a question
   * Frontend listens and shows modal
   */
  socket.on('agent:request_question', async (data: { roomId: string; questionId: string }) => {
    try {
      const { roomId, questionId } = data;

      logger.info('[Socket:AgentInteraction] Question requested', {
        socketId: socket.id,
        roomId,
        questionId,
      });

      const question = await getPendingQuestion(roomId, questionId);

      if (!question) {
        socket.emit('error', { message: 'Question not found' });
        return;
      }

      // Emit to all clients in the room
      socket.to(roomId).emit('agent:question', {
        questionId: question.id,
        question: question.question,
        context: question.context,
        askedAt: question.askedAt,
        askedBy: question.askedBy,
      });

      socket.emit('agent:question', {
        questionId: question.id,
        question: question.question,
        context: question.context,
        askedAt: question.askedAt,
        askedBy: question.askedBy,
      });
    } catch (error) {
      logger.error('[Socket:AgentInteraction] Error requesting question', error);
      socket.emit('error', { message: 'Failed to fetch question' });
    }
  });

  /**
   * agent:answer
   * User submits answer to agent question
   */
  socket.on('agent:answer', async (data: { roomId: string; questionId: string; answer: string; userId: string }) => {
    try {
      const { roomId, questionId, answer, userId } = data;

      logger.info('[Socket:AgentInteraction] Answer received', {
        socketId: socket.id,
        roomId,
        questionId,
        userId,
        answerLength: answer.length,
      });

      // Verify question exists and is unanswered
      const question = await getPendingQuestion(roomId, questionId);

      if (!question) {
        socket.emit('error', { message: 'Question not found' });
        return;
      }

      if (question.answer) {
        socket.emit('error', { message: 'Question already answered' });
        return;
      }

      // Store the answer
      await answerPendingQuestion(roomId, questionId, answer);

      // Notify all clients in room that question was answered
      socket.to(roomId).emit('agent:answer_received', {
        questionId,
        answeredAt: Date.now(),
        answeredBy: userId,
      });

      socket.emit('agent:answer_received', {
        questionId,
        answeredAt: Date.now(),
        answeredBy: userId,
      });

      // TODO: Resume graph execution
      // This will be handled by the gameplay graph listening for state changes

      logger.info('[Socket:AgentInteraction] Answer stored, graph can resume', {
        roomId,
        questionId,
      });
    } catch (error) {
      logger.error('[Socket:AgentInteraction] Error processing answer', error);
      socket.emit('error', { message: 'Failed to submit answer' });
    }
  });

  /**
   * agent:todos_request
   * Request current agent todos for debugging
   */
  socket.on('agent:todos_request', async (data: { roomId: string }) => {
    try {
      const { roomId } = data;

      const { listAgentTodos } = await import('@/services/agent-todos');
      const todos = await listAgentTodos(roomId, { limit: 20 });

      socket.emit('agent:todos', todos);
    } catch (error) {
      logger.error('[Socket:AgentInteraction] Error fetching todos', error);
      socket.emit('error', { message: 'Failed to fetch agent todos' });
    }
  });
}
