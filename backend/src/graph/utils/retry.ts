/**
 * Retry Utility for LangGraph Nodes
 * Provides automatic retry logic with clear logging
 */

import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { logger } from '@/utils/logger';
import type { CharacterCreationState } from '../state';

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  nodeName: string;
  phase: string;
}

/**
 * Higher-order function that wraps a node with retry logic
 * @param nodeFn - The node function to wrap
 * @param config - Retry configuration
 * @returns Wrapped node function with retry logic
 */
export function withRetry<TState extends CharacterCreationState>(
  nodeFn: (state: TState, config?: LangGraphRunnableConfig) => Promise<Partial<TState>>,
  config: RetryConfig
): (state: TState, langConfig?: LangGraphRunnableConfig) => Promise<Partial<TState>> {
  return async (state: TState, langConfig?: LangGraphRunnableConfig): Promise<Partial<TState>> => {
    const { maxAttempts, nodeName, phase } = config;
    const currentRetry = state.worldGenProgress?.retryCount || 0;

    // If we've already exceeded max retries, fail immediately
    if (currentRetry >= maxAttempts) {
      logger.error(`[${nodeName}] Max retries (${maxAttempts}) exceeded, failing node`, {
        phase,
        retryCount: currentRetry,
      });

      return {
        worldGenProgress: {
          phase: state.worldGenProgress?.phase || 'init',
          error: `Failed after ${maxAttempts} attempts`,
          retryCount: currentRetry,
        },
      } as Partial<TState>;
    }

    try {
      logger.info(`[${nodeName}] Executing (attempt ${currentRetry + 1}/${maxAttempts})`, {
        phase,
        retryCount: currentRetry,
      });

      // Execute the node
      const result = await nodeFn(state, langConfig);

      // Success - reset retry count
      logger.info(`[${nodeName}] Success on attempt ${currentRetry + 1}`, { phase });

      return {
        ...result,
        worldGenProgress: {
          ...(result.worldGenProgress || {}),
          error: null,
          retryCount: 0,
        },
      } as Partial<TState>;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const nextRetryCount = currentRetry + 1;

      logger.error(`[${nodeName}] Attempt ${currentRetry + 1} failed:`, {
        error: errorMessage,
        phase,
        retryCount: currentRetry,
        willRetry: nextRetryCount < maxAttempts,
      });

      // If we haven't exceeded max retries, return state that will trigger retry
      if (nextRetryCount < maxAttempts) {
        return {
          worldGenProgress: {
            phase: state.worldGenProgress?.phase || phase,
            error: errorMessage,
            retryCount: nextRetryCount,
          },
        } as Partial<TState>;
      }

      // Max retries exceeded
      logger.error(`[${nodeName}] All ${maxAttempts} attempts failed`, {
        phase,
        finalError: errorMessage,
      });

      return {
        worldGenProgress: {
          phase: state.worldGenProgress?.phase || phase,
          error: `Failed after ${maxAttempts} attempts: ${errorMessage}`,
          retryCount: nextRetryCount,
        },
      } as Partial<TState>;
    }
  };
}

/**
 * Helper to check if a node should retry based on state
 */
export function shouldRetryNode(state: CharacterCreationState, maxRetries: number = 3): boolean {
  const progress = state.worldGenProgress;
  if (!progress) return false;
  return !!progress.error && progress.retryCount < maxRetries;
}

/**
 * Helper to check if node has permanently failed
 */
export function hasNodeFailed(state: CharacterCreationState, maxRetries: number = 3): boolean {
  const progress = state.worldGenProgress;
  if (!progress) return false;
  return !!progress.error && progress.retryCount >= maxRetries;
}
