/**
 * Graph Stream Channel Utility
 * Provides reusable streaming abstraction for LangGraph execution
 */

import type { CharacterCreationState } from '@/graph/state';
import type { StreamEvent } from '@/types/stream-events';
import { createStreamEvent } from '@/types/stream-events';
import { logger } from './logger';

/**
 * Graph Stream Channel
 * Manages stream event emission and state updates
 */
export class GraphStreamChannel {
  private events: StreamEvent[] = [];
  private writer?: (event: any) => void;

  constructor(writer?: (event: any) => void) {
    this.writer = writer;
  }

  /**
   * Emit a stream event
   * Adds timestamp automatically and forwards to writer if available
   */
  emit<T extends StreamEvent>(event: Omit<T, 'timestamp'>): void {
    const fullEvent = createStreamEvent(event);
    this.events.push(fullEvent as StreamEvent);

    // Forward to writer (e.g., Socket.IO or SSE)
    if (this.writer) {
      try {
        this.writer(fullEvent);
      } catch (error) {
        logger.error('Error in stream writer:', error);
      }
    }

    // Log for debugging
    logger.debug(`[StreamChannel] Emitted ${event.type}`, {
      phase: 'phase' in event ? event.phase : undefined,
    });
  }

  /**
   * Get all events emitted so far
   */
  getEvents(): StreamEvent[] {
    return [...this.events];
  }

  /**
   * Get latest event
   */
  getLatest(): StreamEvent | undefined {
    return this.events[this.events.length - 1];
  }

  /**
   * Get events by type
   */
  getEventsByType(type: string): StreamEvent[] {
    return this.events.filter((e) => e.type === type);
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
  }
}

/**
 * Create a stream channel from state
 * Extracts writer from LangGraph config if available
 */
export function createStreamChannel(config?: { configurable?: { writer?: (event: any) => void } }): GraphStreamChannel {
  const writer = config?.configurable?.writer;
  return new GraphStreamChannel(writer);
}

/**
 * Helper to append stream event to state
 * Returns partial state update with new event appended
 */
export function appendStreamEvent<T extends StreamEvent>(event: Omit<T, 'timestamp'>): { streamEvents: StreamEvent[] } {
  const fullEvent = createStreamEvent(event);
  return {
    streamEvents: [fullEvent as StreamEvent],
  };
}

/**
 * Helper to update world gen progress in state
 */
export function updateWorldGenProgress(
  phase: NonNullable<CharacterCreationState['worldGenProgress']>['phase'],
  updates?: Partial<NonNullable<CharacterCreationState['worldGenProgress']>>
): Pick<CharacterCreationState, 'worldGenProgress'> {
  return {
    worldGenProgress: {
      phase,
      currentPeriod: updates?.currentPeriod,
      totalPeriods: updates?.totalPeriods,
      error: updates?.error ?? null,
      retryCount: updates?.retryCount ?? 0,
    },
  };
}
