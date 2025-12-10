/**
 * Historical Generator Service
 * Generates world history through sequential LLM calls for each 50-year period
 * Uses LangGraph task() wrappers for deterministic replay
 */

import { v4 as uuidv4 } from 'uuid';
import { task } from '@langchain/langgraph';
import type { LangGraphRunnableConfig } from '@langchain/langgraph';
import { HistoricalPeriodResponseSchema } from '@/schemas/agent-responses';
import type { HistoricalPeriodResponse } from '@/schemas/agent-responses';
import type { WorldSettings } from '@/types';
import type { HistoricalPeriod } from '@daicer/shared/world/history-schema';
import type { Structure } from '@daicer/shared/world/structure-schema';
import { logger } from '@/utils/logger';
import type { WorldCondition } from '../entropy/types';
import { generateStructuredTask } from '../llm/structured';
import type { HistoricalPeriodEntropy } from '../entropy/historical-entropy';
import { generateHistoricalPeriod } from '../entropy/historical-entropy';

interface GenerationContext {
  settings: WorldSettings;
  roomSeed: string;
  periods: HistoricalPeriod[];
  allStructures: Structure[];
  previousNarrative?: string;
  previousConditions: WorldCondition[] | null;
  periodCount?: number; // Total number of periods to generate
}

/**
 * Build prompt for a single period
 */
function buildPeriodPrompt(periodNumber: number, entropy: HistoricalPeriodEntropy, context: GenerationContext): string {
  const { settings, previousNarrative } = context;
  const { startYear, endYear } = entropy;

  let prompt = `You are a master world-builder creating the history of a ${settings.theme} campaign set in a ${settings.setting} world with a ${settings.tone} tone.\n\n`;

  if (periodNumber === 0) {
    prompt += `Years ${startYear}-${endYear}: Foundation era.\n\n`;
    prompt += `2-3 bullets: civilization begins, first structures.\n\n`;
  } else {
    prompt += `Years ${startYear}-${endYear}.\nPrevious: ${previousNarrative?.slice(0, 200)}...\n\n`;
    prompt += `2-3 bullets: what changed.\n\n`;
  }

  // Add entropy events context
  if (entropy.events.length > 0) {
    prompt += `**Significant Events/Changes This Period:**\n`;
    entropy.events.forEach((event) => {
      if (event.mutation) {
        prompt += `- ${event.mutation.key} changed to ${event.mutation.newValue}\n`;
      }
      if (event.newEvent) {
        prompt += `- ${event.newEvent.name}: ${event.newEvent.description}\n`;
      }
    });
    prompt += `\n`;
  }

  // Structure guidance
  prompt += `Structures: 0-2 new. Relative position (e.g. northeast-far). Significance 1-10.\n\n`;

  prompt += `Write a concise but evocative historical summary. Focus on events that shape the world's current state.`;

  return prompt;
}

/**
 * Task: Generate a single 50-year historical period
 * Wrapped in task() for deterministic replay and checkpointing
 * EXPORTED for use by history_period_node
 */
export const generateSinglePeriodTask = task(
  'generateHistoricalPeriod',
  async (
    params: {
      periodNumber: number;
      context: GenerationContext;
    },
    config?: LangGraphRunnableConfig
  ): Promise<HistoricalPeriod> => {
    const { periodNumber, context } = params;
    const writer = config?.configurable?.writer as ((event: any) => void) | undefined;

    logger.info(`[Period ${periodNumber + 1}] ━━━ Starting generation ━━━`, {
      yearRange: `${periodNumber * 500}-${(periodNumber + 1) * 500}`,
      previousStructures: context.allStructures.length,
      totalPeriods: context.periodCount || 0,
    });
    // Generate entropy events for this period
    const entropy: HistoricalPeriodEntropy = generateHistoricalPeriod(
      context.roomSeed,
      periodNumber,
      context.previousConditions
    );

    // Build LLM prompt
    const prompt = buildPeriodPrompt(periodNumber, entropy, context);

    // Emit text streaming start
    if (writer) {
      writer({
        type: 'period_text_start',
        periodNumber: periodNumber + 1,
      });
    }

    // Call LLM with structured output (GPT-5 models with increased token limit and timeout)
    const response = (await generateStructuredTask(
      HistoricalPeriodResponseSchema,
      'You are a master world-builder creating campaign history.',
      prompt,
      context.settings.language as 'en' | 'es' | 'pt-BR',
      {
        tags: ['world-history', `period-${periodNumber}`],
        maxTokens: 4096, // Increased for rich historical narratives
        timeout: 120000, // 2 minutes for complex world generation
      }
    )) as HistoricalPeriodResponse;

    // Emit the generated narrative text (defensive)
    if (writer && response.narrative) {
      writer({
        type: 'period_text_complete',
        periodNumber: periodNumber + 1,
        narrative: response.narrative,
      });
    } else if (writer && !response.narrative) {
      logger.error(`[Period ${periodNumber + 1}] Cannot emit narrative - LLM returned empty narrative`);
    }

    // Validate LLM response
    if (!response.narrative) {
      logger.error(`[Period ${periodNumber + 1}] LLM returned no narrative!`, {
        hasStructures: !!response.structures,
        structureCount: response.structures?.length || 0,
      });
    }

    if (!response.structures || response.structures.length === 0) {
      logger.warn(`[Period ${periodNumber + 1}] LLM returned no structures`);
    } else {
      logger.debug(`[Period ${periodNumber + 1}] Structures from LLM:`, {
        count: response.structures.length,
        names: response.structures.map((s) => s.name),
      });
    }

    // Convert structures from relative to placeholder coordinates (will be placed later)
    const structures: Structure[] = (response.structures || []).map((s) => {
      logger.debug(`[Period ${periodNumber + 1}] Structure: ${s.name} (${s.type}, sig: ${s.significance})`);
      return {
        id: uuidv4(),
        name: s.name,
        x: 0, // Placeholder - will be set by structure placer
        y: 0, // Placeholder
        size: s.size,
        description: s.description,
        era: periodNumber,
        type: s.type,
        significance: s.significance,
        relativePosition: s.relativePosition as any, // Store for later conversion
      };
    }) as Structure[];

    const period: HistoricalPeriod = {
      periodNumber,
      startYear: entropy.startYear,
      endYear: entropy.endYear,
      narrative: response.narrative || `Period ${periodNumber + 1}: No narrative generated`,
      structures,
      entropyEvents: entropy.events,
      conditions: entropy.finalConditions,
    };

    logger.info(`[Period ${periodNumber + 1}] ━━━ Complete ━━━`, {
      narrativeLength: period.narrative.length,
      structureCount: structures.length,
      structures: structures.map((s) => `${s.name} (${s.type}, sig:${s.significance})`),
    });

    return period;
  }
);

/**
 * Task: Generate overall summary synthesizing all periods
 * Wrapped in task() for deterministic replay
 * EXPORTED for use by history_summary_node
 */
export const generateOverallSummaryTask = task(
  'generateHistorySummary',
  async (params: { context: GenerationContext }, _config?: LangGraphRunnableConfig): Promise<string> => {
    const { context } = params;
    // const writer = config?.configurable?.writer as ((event: any) => void) | undefined;

    logger.info('[HistorySummary] ━━━ Generating overall summary ━━━', {
      totalPeriods: context.periods.length,
    });
    const prompt = `You are synthesizing the complete history of a ${context.settings.theme} world.\n\n`;

    const allNarratives = context.periods
      .map((p) => `**Years ${p.startYear}-${p.endYear}:**\n${p.narrative}`)
      .join('\n\n');

    const fullPrompt = `${
      prompt + allNarratives
    }\n\nCreate a concise 2-3 paragraph summary of the entire history, highlighting the most significant events, structures, and themes that define this world.`;

    // For summary, we just need a string, so we'll use a simple schema
    const SummarySchema = HistoricalPeriodResponseSchema.pick({ narrative: true });

    const summaryResponse = (await generateStructuredTask(
      SummarySchema,
      'You are a master historian synthesizing world history.',
      fullPrompt,
      context.settings.language as 'en' | 'es' | 'pt-BR',
      {
        tags: ['world-history', 'overall-summary'],
        maxTokens: 4096,
        timeout: 120000, // 2 minutes for complex world generation
      }
    )) as { narrative: string };

    const summary = summaryResponse.narrative || 'World history summary unavailable.';

    logger.info('[HistorySummary] ━━━ Complete ━━━', {
      summaryLength: summary.length,
    });

    return summary;
  }
);

/**
 * NOTE: The orchestration loop has been moved to graph nodes.
 * This file now only exports the individual tasks:
 * - generateSinglePeriodTask (used by history_period_node)
 * - generateOverallSummaryTask (used by history_summary_node)
 *
 * The graph nodes handle the sequential execution and state management.
 */
