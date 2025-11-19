/**
 * Graph Stream Hook
 * Provides type-safe consumption of LangGraph stream events
 */

import { useState, useCallback, useMemo } from 'react';

/**
 * Stream event types (mirrored from backend)
 */
export type WorldGenPhase =
  | 'init'
  | 'conditions'
  | 'history'
  | 'structures'
  | 'roads'
  | 'terrain'
  | 'chunks'
  | 'lore'
  | 'complete';

export interface BaseStreamEvent {
  type: string;
  timestamp: number;
  phase?: WorldGenPhase;
}

export interface PhaseStartEvent extends BaseStreamEvent {
  type: 'phase_start';
  phase: WorldGenPhase;
  message?: string;
}

export interface PhaseCompleteEvent extends BaseStreamEvent {
  type: 'phase_complete';
  phase: WorldGenPhase;
  message?: string;
}

export interface PeriodProgressEvent extends BaseStreamEvent {
  type: 'period_progress';
  periodNumber: number;
  totalPeriods: number;
  periodName?: string;
  structuresAdded?: number;
}

export interface ErrorEvent extends BaseStreamEvent {
  type: 'error';
  error: string;
  retryCount: number;
  phase: WorldGenPhase;
}

export interface RetryEvent extends BaseStreamEvent {
  type: 'retry';
  phase: WorldGenPhase;
  attempt: number;
  maxAttempts: number;
}

export interface ProgressEvent extends BaseStreamEvent {
  type: 'progress';
  message: string;
  percentage?: number;
}

export type StreamEvent =
  | PhaseStartEvent
  | PhaseCompleteEvent
  | PeriodProgressEvent
  | ErrorEvent
  | RetryEvent
  | ProgressEvent
  | BaseStreamEvent;

/**
 * Hook for managing graph stream events
 */
export function useGraphStream() {
  const [events, setEvents] = useState<StreamEvent[]>([]);

  /**
   * Add a new event to the stream
   */
  const addEvent = useCallback((event: StreamEvent) => {
    setEvents((prev) => [...prev, event]);
  }, []);

  /**
   * Add multiple events at once
   */
  const addEvents = useCallback((newEvents: StreamEvent[]) => {
    setEvents((prev) => [...prev, ...newEvents]);
  }, []);

  /**
   * Clear all events
   */
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  /**
   * Get latest event
   */
  const latestEvent = useMemo(() => (events.length > 0 ? events[events.length - 1] : undefined), [events]);

  /**
   * Get events by type
   */
  const eventsByType = useCallback((type: string) => events.filter((e) => e.type === type), [events]);

  /**
   * Get events by phase
   */
  const eventsByPhase = useCallback((phase: WorldGenPhase) => events.filter((e) => e.phase === phase), [events]);

  /**
   * Get latest event of a specific type
   */
  const latestEventOfType = useCallback(
    (type: string): StreamEvent | undefined => {
      const filtered = events.filter((e) => e.type === type);
      return filtered.length > 0 ? filtered[filtered.length - 1] : undefined;
    },
    [events]
  );

  /**
   * Get current phase based on latest phase_start event
   */
  const currentPhase = useMemo(() => {
    const phaseEvents = events.filter((e) => e.type === 'phase_start').reverse();
    return phaseEvents.length > 0 ? (phaseEvents[0] as PhaseStartEvent).phase : undefined;
  }, [events]);

  /**
   * Get error state
   */
  const errorState = useMemo(() => {
    const errorEvents = events.filter((e) => e.type === 'error');
    if (errorEvents.length === 0) return undefined;
    return errorEvents[errorEvents.length - 1] as ErrorEvent;
  }, [events]);

  /**
   * Check if currently retrying
   */
  const isRetrying = useMemo(() => {
    const retryEvents = events.filter((e) => e.type === 'retry');
    if (retryEvents.length === 0) return false;
    const lastRetry = retryEvents[retryEvents.length - 1] as RetryEvent;
    // Check if there's been a phase_complete after the last retry
    const lastComplete = events.filter((e) => e.type === 'phase_complete').reverse()[0];
    if (!lastComplete) return true;
    return lastRetry.timestamp > lastComplete.timestamp;
  }, [events]);

  /**
   * Get progress percentage (0-100) based on phases
   */
  const progressPercentage = useMemo(() => {
    if (!currentPhase) return 0;

    const phaseProgress: Record<WorldGenPhase, number> = {
      init: 5,
      conditions: 10,
      history: 40,
      structures: 60,
      roads: 70,
      terrain: 80,
      chunks: 90,
      lore: 95,
      complete: 100,
    };

    return phaseProgress[currentPhase] || 0;
  }, [currentPhase]);

  return {
    events,
    addEvent,
    addEvents,
    clearEvents,
    latestEvent,
    eventsByType,
    eventsByPhase,
    latestEventOfType,
    currentPhase,
    errorState,
    isRetrying,
    progressPercentage,
  };
}

/**
 * Phase display names for UI
 */
export const PHASE_DISPLAY_NAMES: Record<WorldGenPhase, string> = {
  init: 'Initializing world generation',
  conditions: 'Generating world conditions',
  history: 'Creating world history',
  structures: 'Placing structures',
  roads: 'Building roads',
  terrain: 'Shaping terrain',
  chunks: 'Pre-generating map chunks',
  lore: 'Crafting world lore',
  complete: 'World generation complete',
};

/**
 * Get human-readable phase name
 */
export function getPhaseDisplayName(phase: WorldGenPhase): string {
  return PHASE_DISPLAY_NAMES[phase] || phase;
}
