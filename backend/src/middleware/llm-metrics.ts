/**
 * LLM Performance Metrics Middleware
 * Tracks token usage, duration, retries, and success rates for all LLM calls
 */

import { logger } from '@/utils/logger';

export interface LLMMetrics {
  taskName: string;
  model: string;
  durationMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  retries: number;
  success: boolean;
  error?: string;
  tags?: string[];
  userId?: string;
}

/**
 * Log LLM call metrics with structured fields
 */
export function logLLMMetrics(metrics: LLMMetrics): void {
  const logData = {
    taskName: metrics.taskName,
    model: metrics.model,
    durationMs: metrics.durationMs,
    promptTokens: metrics.promptTokens,
    completionTokens: metrics.completionTokens,
    totalTokens: metrics.totalTokens,
    retries: metrics.retries,
    success: metrics.success,
    tags: metrics.tags,
    userId: metrics.userId,
  };

  if (metrics.success) {
    logger.info('[LLM Metrics]', logData);
  } else {
    logger.error('[LLM Metrics] Failed', {
      ...logData,
      error: metrics.error,
    });
  }

  // Warn on slow calls (>30s)
  if (metrics.durationMs > 30000) {
    logger.warn('[LLM Metrics] Slow call detected', {
      model: metrics.model,
      durationMs: metrics.durationMs,
      taskName: metrics.taskName,
    });
  }

  // Warn on high token usage (>3000 total)
  if (metrics.totalTokens && metrics.totalTokens > 3000) {
    logger.warn('[LLM Metrics] High token usage', {
      model: metrics.model,
      totalTokens: metrics.totalTokens,
      taskName: metrics.taskName,
    });
  }
}

/**
 * Extract token usage from LangChain response
 * LangChain responses include usage_metadata for token counts
 */
export function extractTokenUsage(response: any): {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
} {
  // LangChain v0.2+ uses response_metadata.usage or usage_metadata
  const usage = response?.usage_metadata || response?.response_metadata?.usage;

  if (!usage) {
    return {};
  }

  return {
    promptTokens: usage.input_tokens || usage.prompt_tokens,
    completionTokens: usage.output_tokens || usage.completion_tokens,
    totalTokens: usage.total_tokens,
  };
}

/**
 * Create a metrics tracker for an LLM call
 * Returns start/stop functions for timing
 */
export function createMetricsTracker(taskName: string, model: string, tags?: string[], userId?: string) {
  const startTime = Date.now();
  let retries = 0;

  return {
    incrementRetry: () => {
      retries += 1;
    },
    logSuccess: (response: any) => {
      const durationMs = Date.now() - startTime;
      const tokenUsage = extractTokenUsage(response);

      logLLMMetrics({
        taskName,
        model,
        durationMs,
        ...tokenUsage,
        retries,
        success: true,
        tags,
        userId,
      });
    },
    logFailure: (error: Error) => {
      const durationMs = Date.now() - startTime;

      logLLMMetrics({
        taskName,
        model,
        durationMs,
        retries,
        success: false,
        error: error.message,
        tags,
        userId,
      });
    },
  };
}
