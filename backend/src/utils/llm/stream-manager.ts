/**
 * Stream Manager Service
 * Centralized handling of LLM streaming events across the application
 */

import { Server } from 'socket.io';

export interface StreamEvent {
  streamId: string;
  roomId: string;
  type: 'text' | 'tool_start' | 'tool_end' | 'reasoning' | 'error' | 'done';
  content?: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

class StreamManager {
  private static instance: StreamManager;
  private io: Server | null = null;
  private activeStreams = new Map<string, { roomId: string; userId: string }>();

  private constructor() {}

  public static getInstance(): StreamManager {
    if (!StreamManager.instance) {
      StreamManager.instance = new StreamManager();
    }
    return StreamManager.instance;
  }

  public setSocketServer(io: Server) {
    this.io = io;
  }

  public broadcast(roomId: string, event: string, payload: unknown) {
    if (this.io) {
      this.io.to(roomId).emit(event, payload);
    }
  }

  public broadcastPrivate(userId: string, event: string, payload: unknown) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, payload);
    }
  }

  public startStream(streamId: string, roomId: string, userId: string) {
    this.activeStreams.set(streamId, { roomId, userId });
    this.emitEvent({
      streamId,
      roomId,
      type: 'text', // Initial event
      content: '',
      timestamp: Date.now(),
      metadata: { status: 'started' },
    });
  }

  public endStream(streamId: string) {
    const stream = this.activeStreams.get(streamId);
    if (stream) {
      this.emitEvent({
        streamId,
        roomId: stream.roomId,
        type: 'done',
        timestamp: Date.now(),
      });
      this.activeStreams.delete(streamId);
    }
  }

  public emitText(streamId: string, text: string, userId?: string) {
    const stream = this.activeStreams.get(streamId);
    if (stream) {
      // If userId provided, verify match or just use it?
      // Actually `activeStreams` has userId stored at startStream!
      // So checks:
      const targetUserId = userId || stream.userId;

      this.emitEvent(
        {
          streamId,
          roomId: stream.roomId,
          type: 'text',
          content: text,
          timestamp: Date.now(),
        },
        targetUserId
      );
    }
  }

  public emitToolStart(streamId: string, toolName: string, input: unknown) {
    const stream = this.activeStreams.get(streamId);
    if (stream) {
      this.emitEvent({
        streamId,
        roomId: stream.roomId,
        type: 'tool_start',
        metadata: { toolName, input },
        timestamp: Date.now(),
      });
    }
  }

  public emitToolEnd(streamId: string, toolName: string, output: unknown) {
    const stream = this.activeStreams.get(streamId);
    if (stream) {
      this.emitEvent({
        streamId,
        roomId: stream.roomId,
        type: 'tool_end',
        metadata: { toolName, output },
        timestamp: Date.now(),
      });
    }
  }

  public emitReasoning(streamId: string, reasoning: string) {
    const stream = this.activeStreams.get(streamId);
    if (stream) {
      this.emitEvent({
        streamId,
        roomId: stream.roomId,
        type: 'reasoning',
        content: reasoning,
        timestamp: Date.now(),
      });
    }
  }

  public emitError(streamId: string, error: string) {
    const stream = this.activeStreams.get(streamId);
    if (stream) {
      this.emitEvent({
        streamId,
        roomId: stream.roomId,
        type: 'error',
        content: error,
        timestamp: Date.now(),
      });
      this.activeStreams.delete(streamId);
    }
  }

  private emitEvent(event: StreamEvent, targetUserId?: string) {
    if (!this.io) {
      //   console.warn('[StreamManager] Socket.IO server not initialized');
      return;
    }

    if (targetUserId) {
      this.io.to(`user:${targetUserId}`).emit('llm:stream:event', event);
    } else {
      this.io.to(event.roomId).emit('llm:stream:event', event);
    }
  }
}

export const streamManager = StreamManager.getInstance();
