/**
 * Tool Call Logger
 * Tracks tool calls for transparency and debugging
 */

import type { ToolCallEvent } from '@/types/index';

class ToolLogger {
  private toolCalls: Map<string, ToolCallEvent[]> = new Map();

  /**
   * Log a tool call for a specific room
   */
  logToolCall(roomId: string, toolCall: ToolCallEvent): void {
    if (!this.toolCalls.has(roomId)) {
      this.toolCalls.set(roomId, []);
    }
    this.toolCalls.get(roomId)!.push(toolCall);
  }

  /**
   * Get all tool calls for a room
   */
  getToolCalls(roomId: string): ToolCallEvent[] {
    return this.toolCalls.get(roomId) || [];
  }

  /**
   * Get and clear tool calls for a room
   */
  getAndClearToolCalls(roomId: string): ToolCallEvent[] {
    const calls = this.getToolCalls(roomId);
    this.toolCalls.delete(roomId);
    return calls;
  }

  /**
   * Clear tool calls for a room
   */
  clearToolCalls(roomId: string): void {
    this.toolCalls.delete(roomId);
  }
}

export const toolLogger = new ToolLogger();

/**
 * Create a tool call event
 */
export function createToolCallEvent(
  toolName: string,
  parameters: Record<string, unknown>,
  result?: unknown
): ToolCallEvent {
  return {
    id: `tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    toolName,
    parameters,
    result,
    timestamp: Date.now(),
  };
}
