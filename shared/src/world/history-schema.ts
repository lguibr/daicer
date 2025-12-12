import { z } from 'zod';
import { StructureSchema } from './structure-schema';

export const HistoricalPeriodSchema = z.object({
  periodNumber: z.number().int(),
  startYear: z.number().int(),
  endYear: z.number().int(),
  narrative: z.string(),
  structures: z.array(StructureSchema),
  entropyEvents: z.array(z.unknown()),
  conditions: z.array(z.unknown()),
});

export const WorldHistorySchema = z.object({
  totalYears: z.number().int(),
  periods: z.array(HistoricalPeriodSchema),
  overallSummary: z.string(),
});

export type HistoricalPeriod = z.infer<typeof HistoricalPeriodSchema>;
export type WorldHistory = z.infer<typeof WorldHistorySchema>;
