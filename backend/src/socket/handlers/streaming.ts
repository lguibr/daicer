/**
 * Streaming socket handlers for real-time text generation
 * Manages concurrent streams, chunk emission, and error recovery
 */

import type { Server, Socket } from 'socket.io';
import { logger } from '@/utils/logger';
import { streamText, streamWithHistory, batchStreamChunks } from '@/services/llm';
import { GeminiModel } from '@/services/llm/types';
import type { Language } from '@/types/index';

/**
 * Active stream tracking per room
 */
interface ActiveStream {
  streamId: string;
  roomId: string;
  userId: string;
  messageId: string;
  startTime: number;
  aborted: boolean;
}

const activeStreams = new Map<string, ActiveStream>();

/**
 * Generate unique stream ID
 */
function generateStreamId(): string {
  return `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Register a new active stream
 */
function registerStream(streamId: string, roomId: string, userId: string, messageId: string): void {
  activeStreams.set(streamId, {
    streamId,
    roomId,
    userId,
    messageId,
    startTime: Date.now(),
    aborted: false,
  });

  logger.info('[Streaming] Registered stream', { streamId, roomId, userId, messageId });
}

/**
 * Unregister stream
 */
function unregisterStream(streamId: string): void {
  const stream = activeStreams.get(streamId);
  if (stream) {
    const duration = Date.now() - stream.startTime;
    logger.info('[Streaming] Unregistered stream', {
      streamId,
      duration,
      aborted: stream.aborted,
    });
    activeStreams.delete(streamId);
  }
}

/**
 * Abort a stream
 */
export function abortStream(streamId: string): void {
  const stream = activeStreams.get(streamId);
  if (stream) {
    stream.aborted = true;
    logger.info('[Streaming] Aborted stream', { streamId });
  }
}

/**
 * Check if stream is aborted
 */
function isStreamAborted(streamId: string): boolean {
  const stream = activeStreams.get(streamId);
  return stream?.aborted ?? false;
}

/**
 * Clean up streams for disconnected user
 */
export function cleanupUserStreams(userId: string): void {
  const userStreams = Array.from(activeStreams.values()).filter((s) => s.userId === userId);

  userStreams.forEach((userStream) => {
    // eslint-disable-next-line no-param-reassign
    userStream.aborted = true;
    unregisterStream(userStream.streamId);
  });

  if (userStreams.length > 0) {
    logger.info('[Streaming] Cleaned up streams for disconnected user', {
      userId,
      count: userStreams.length,
    });
  }
}

/**
 * Handle streaming text generation request
 * @param io - Socket.IO server
 * @param socket - Client socket
 * @param userId - Authenticated user ID
 * @param data - Request payload
 */
export async function handleStreamRequest(
  io: Server,
  socket: Socket,
  userId: string,
  data: {
    roomId: string;
    messageId: string;
    systemPrompt: string;
    userPrompt: string;
    language?: Language;
    model?: string;
  }
): Promise<void> {
  const { roomId, messageId, systemPrompt, userPrompt, language = 'en', model: modelString } = data;

  if (!roomId || !messageId || !systemPrompt || !userPrompt) {
    socket.emit('message:stream:error', {
      messageId,
      error: 'Missing required fields',
    });
    return;
  }

  const streamId = generateStreamId();
  registerStream(streamId, roomId, userId, messageId);

  try {
    // Validate model enum
    const model: GeminiModel.FLASH | GeminiModel.PRO | undefined =
      modelString === GeminiModel.FLASH || modelString === GeminiModel.PRO ? modelString : undefined;

    // Emit stream start event
    io.to(roomId).emit('message:stream:start', {
      streamId,
      messageId,
      sender: 'DM',
      timestamp: Date.now(),
    });

    // Create streaming generator
    const stream = streamText(systemPrompt, userPrompt, language as Language, {
      model,
      userId,
      tags: ['streaming', `room:${roomId}`],
      metadata: { roomId, streamId, messageId },
    });

    // Batch chunks to reduce socket traffic
    const batchedStream = batchStreamChunks(stream, 10, 200);

    let accumulated = '';

    // Stream chunks to room
    for await (const chunk of batchedStream) {
      // Check if stream was aborted
      if (isStreamAborted(streamId)) {
        logger.info('[Streaming] Stream aborted by client', { streamId, messageId });
        io.to(roomId).emit('message:stream:aborted', {
          streamId,
          messageId,
        });
        return;
      }

      if (chunk.done) {
        // Stream complete
        io.to(roomId).emit('message:stream:end', {
          streamId,
          messageId,
          fullText: accumulated,
          timestamp: Date.now(),
        });

        logger.info('[Streaming] Stream completed', {
          streamId,
          messageId,
          length: accumulated.length,
        });
        break;
      }

      // Emit chunk
      accumulated += chunk.content;
      io.to(roomId).emit('message:stream:chunk', {
        streamId,
        messageId,
        content: chunk.content,
        accumulated,
      });
    }
  } catch (error) {
    logger.error('[Streaming] Stream error', {
      streamId,
      messageId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    io.to(roomId).emit('message:stream:error', {
      streamId,
      messageId,
      error: error instanceof Error ? error.message : 'Streaming failed',
    });
  } finally {
    unregisterStream(streamId);
  }
}

/**
 * Handle streaming with conversation history
 */
export async function handleStreamWithHistory(
  io: Server,
  socket: Socket,
  userId: string,
  data: {
    roomId: string;
    messageId: string;
    systemPrompt: string;
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
    userMessage: string;
    language?: Language;
    model?: string;
  }
): Promise<void> {
  const { roomId, messageId, systemPrompt, history, userMessage, language = 'en', model: modelString } = data;

  if (!roomId || !messageId || !systemPrompt || !history || !userMessage) {
    socket.emit('message:stream:error', {
      messageId,
      error: 'Missing required fields',
    });
    return;
  }

  const streamId = generateStreamId();
  registerStream(streamId, roomId, userId, messageId);

  try {
    // Validate model enum
    const model: GeminiModel.FLASH | GeminiModel.PRO | undefined =
      modelString === GeminiModel.FLASH || modelString === GeminiModel.PRO ? modelString : undefined;

    // Emit stream start event
    io.to(roomId).emit('message:stream:start', {
      streamId,
      messageId,
      sender: 'DM',
      timestamp: Date.now(),
    });

    // Create streaming generator with history
    const stream = streamWithHistory(systemPrompt, history, userMessage, language as Language, {
      model,
      userId,
      tags: ['streaming', 'history', `room:${roomId}`],
      metadata: { roomId, streamId, messageId },
    });

    // Batch chunks
    const batchedStream = batchStreamChunks(stream, 10, 200);

    let accumulated = '';

    // Stream chunks to room
    for await (const chunk of batchedStream) {
      // Check if stream was aborted
      if (isStreamAborted(streamId)) {
        logger.info('[Streaming] History stream aborted', { streamId, messageId });
        io.to(roomId).emit('message:stream:aborted', {
          streamId,
          messageId,
        });
        return;
      }

      if (chunk.done) {
        // Stream complete
        io.to(roomId).emit('message:stream:end', {
          streamId,
          messageId,
          fullText: accumulated,
          timestamp: Date.now(),
        });

        logger.info('[Streaming] History stream completed', {
          streamId,
          messageId,
          length: accumulated.length,
        });
        break;
      }

      // Emit chunk
      accumulated += chunk.content;
      io.to(roomId).emit('message:stream:chunk', {
        streamId,
        messageId,
        content: chunk.content,
        accumulated,
      });
    }
  } catch (error) {
    logger.error('[Streaming] History stream error', {
      streamId,
      messageId,
      error: error instanceof Error ? error.message : String(error),
    });

    io.to(roomId).emit('message:stream:error', {
      streamId,
      messageId,
      error: error instanceof Error ? error.message : 'Streaming failed',
    });
  } finally {
    unregisterStream(streamId);
  }
}

/**
 * Handle stream abort request from client
 */
export function handleStreamAbort(socket: Socket, userId: string, data: { streamId: string }): void {
  const { streamId } = data;

  if (!streamId) {
    socket.emit('error', { message: 'Stream ID required' });
    return;
  }

  const stream = activeStreams.get(streamId);

  if (!stream) {
    logger.warn('[Streaming] Attempted to abort non-existent stream', {
      streamId,
      userId,
    });
    return;
  }

  // Verify user owns the stream (security check)
  if (stream.userId !== userId) {
    logger.warn('[Streaming] Unauthorized abort attempt', {
      streamId,
      userId,
      streamUserId: stream.userId,
    });
    socket.emit('error', { message: 'Unauthorized' });
    return;
  }

  abortStream(streamId);
  logger.info('[Streaming] Stream abort requested', { streamId, userId });
}

/**
 * Register streaming event handlers
 */
export function registerStreamingHandlers(io: Server, socket: Socket, userId: string): void {
  socket.on('stream:text', (data) => handleStreamRequest(io, socket, userId, data));
  socket.on('stream:history', (data) => handleStreamWithHistory(io, socket, userId, data));
  socket.on('stream:abort', (data) => handleStreamAbort(socket, userId, data));

  logger.debug('[Streaming] Registered handlers for user', { userId, socketId: socket.id });
}
