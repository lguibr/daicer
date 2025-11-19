/**
 * Graph Progress Hook
 * Manages real-time graph progress state
 * Phase 5: SSE event listener implemented
 */

import { useState, useEffect } from 'react';
import { auth } from '../services/firebase';

// Simple logger for SSE events
const logger = {
  debug: (message: string, data?: Record<string, unknown>) => console.log(`[DEBUG] ${message}`, data || ''),
  info: (message: string, data?: Record<string, unknown>) => console.info(`[INFO] ${message}`, data || ''),
  error: (message: string, data?: Record<string, unknown>) => console.error(`[ERROR] ${message}`, data || ''),
};

export interface GraphProgressState {
  currentSection: 1 | 2 | 3 | null;
  currentNode: string | null;
  progress: { current: number; total: number } | null;
  error: string | null;
}

export interface GraphProgressActions {
  setCurrentSection: (section: 1 | 2 | 3 | null) => void;
  setCurrentNode: (node: string | null) => void;
  setProgress: (progress: { current: number; total: number } | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

/**
 * Hook for managing graph progress state with SSE streaming
 *
 * @param roomId - Room ID for SSE connection
 * @param playerId - Player ID for Section 3 streaming (optional)
 * @returns Progress state and actions
 *
 * @example
 * ```tsx
 * const { currentSection, setCurrentSection, setProgress, error } = useGraphProgress(roomId);
 *
 * // Before API call
 * setCurrentSection(1);
 *
 * // Hook automatically connects to SSE endpoint
 * // Events update currentNode, progress, error automatically
 *
 * // After success
 * setCurrentSection(null);
 * ```
 */
export function useGraphProgress(roomId: string, playerId?: string): GraphProgressState & GraphProgressActions {
  const [currentSection, setCurrentSection] = useState<1 | 2 | 3 | null>(null);
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // SSE event listener
  useEffect(() => {
    if (!roomId || !currentSection) return;

    let eventSource: EventSource | null = null;

    const connectToSSE = async () => {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      // Get auth token for SSE (EventSource doesn't support custom headers)
      const user = auth.currentUser;
      if (!user) {
        logger.error('[useGraphProgress] No authenticated user');
        setError('Authentication required');
        return;
      }

      const token = await user.getIdToken();

      // Determine endpoint based on section (include token as query param)
      const endpoint =
        currentSection === 1
          ? `${API_URL}/api/graph/dm-story/stream?roomId=${roomId}&token=${encodeURIComponent(token)}`
          : currentSection === 2
            ? `${API_URL}/api/graph/world-config/stream?roomId=${roomId}&token=${encodeURIComponent(token)}`
            : `${API_URL}/api/graph/character/${playerId}/stream?roomId=${roomId}&token=${encodeURIComponent(token)}`;

      logger.debug('[useGraphProgress] Connecting to SSE:', {
        endpoint: endpoint.replace(/token=[^&]+/, 'token=REDACTED'),
        section: currentSection,
      });

      eventSource = new EventSource(endpoint, {
        withCredentials: true,
      });

      // Connected event
      eventSource.addEventListener('connected', (event) => {
        const data = JSON.parse(event.data);
        logger.info('[SSE] Connected to stream', data);
      });

      // Node start event
      eventSource.addEventListener('node_start', (event) => {
        const data = JSON.parse(event.data);
        setCurrentNode(data.node);
        logger.debug('[SSE] Node started:', data.node);
      });

      // Node complete event
      eventSource.addEventListener('node_complete', (event) => {
        const data = JSON.parse(event.data);
        logger.debug('[SSE] Node completed:', data.node);
      });

      // Period progress (Section 1 specific)
      eventSource.addEventListener('period_start', (event) => {
        const data = JSON.parse(event.data);
        setProgress({ current: data.periodNumber, total: data.totalPeriods });
        logger.debug('[SSE] Period progress:', data);
      });

      eventSource.addEventListener('period_complete', (event) => {
        const data = JSON.parse(event.data);
        setProgress({ current: data.periodNumber, total: data.totalPeriods });
      });

      // Error event
      eventSource.addEventListener('node_error', (event) => {
        const data = JSON.parse(event.data);
        setError(data.error || 'Graph execution error');
        logger.error('[SSE] Node error:', data);
      });

      // Generic error handler
      eventSource.onerror = (err) => {
        logger.error('[SSE] EventSource error:', err);
        if (eventSource) {
          eventSource.close();
        }
        // Don't set error state here - might be normal disconnection
      };
    };

    connectToSSE();

    // Cleanup on unmount or section change
    return () => {
      if (eventSource) {
        logger.debug('[SSE] Closing connection');
        eventSource.close();
      }
    };
  }, [roomId, currentSection, playerId]);

  const reset = () => {
    setCurrentSection(null);
    setCurrentNode(null);
    setProgress(null);
    setError(null);
  };

  return {
    currentSection,
    currentNode,
    progress,
    error,
    setCurrentSection,
    setCurrentNode,
    setProgress,
    setError,
    reset,
  };
}
