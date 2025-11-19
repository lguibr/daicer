/**
 * Stream Progress Shared Node
 * Emit real-time progress events for frontend visualization
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';

/**
 * Emit progress event via streaming writer
 * Extracts writer from LangGraph config and forwards event
 *
 * @param eventType - Event type (e.g., 'node_start', 'period_complete')
 * @param data - Event data to emit
 * @param config - LangGraph config containing writer
 */
export function emitProgress(eventType: string, data: Record<string, any>, config?: LangGraphRunnableConfig): void {
  const writer = config?.configurable?.writer as ((event: any) => void) | undefined;

  if (writer) {
    const event = {
      type: eventType,
      timestamp: Date.now(),
      ...data,
    };

    try {
      writer(event);
    } catch (error) {
      logger.error('[emitProgress] Error in stream writer:', error);
    }
  }

  // Log for debugging
  logger.debug(`[StreamProgress] Emitted ${eventType}`, data);
}

/**
 * Create partial state update with stream event
 * Compatible with LangGraph state channel pattern
 */
export function createStreamEventUpdate(
  eventType: string,
  data: Record<string, any>
): { streamEvents: Array<{ type: string; timestamp: number; [key: string]: any }> } {
  return {
    streamEvents: [
      {
        type: eventType,
        timestamp: Date.now(),
        ...data,
      },
    ],
  };
}
