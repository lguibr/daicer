/**
 * @file frontend/src/hooks/useTacticalActions.ts
 * @description Hook for managing tactical action preview and execution
 */

import { useState, useCallback } from 'react';
import * as tacticalApi from '../services/tacticalApi';

export interface UseTacticalActionsReturn {
  command: string;
  setCommand: (command: string) => void;
  preview: tacticalApi.ActionPreview | null;
  submitting: boolean;
  executing: boolean;
  error: string | null;
  submitCommand: () => Promise<void>;
  executeAction: (allowFriendlyFire?: boolean) => Promise<void>;
  clearPreview: () => void;
}

export function useTacticalActions(encounterId: string | null): UseTacticalActionsReturn {
  const [command, setCommand] = useState('');
  const [preview, setPreview] = useState<tacticalApi.ActionPreview | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Submit command for preview
  const submitCommand = useCallback(async () => {
    if (!encounterId || !command.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const previewData = await tacticalApi.previewAction(encounterId, command);
      setPreview(previewData as unknown as tacticalApi.ActionPreview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview action');
    } finally {
      setSubmitting(false);
    }
  }, [encounterId, command]);

  // Execute previewed action
  const executeAction = useCallback(
    async (allowFriendlyFire: boolean = false) => {
      if (!encounterId || !preview) return;

      setExecuting(true);
      setError(null);

      try {
        await tacticalApi.executeAction(encounterId, preview.planId as string, true, { allowFriendlyFire });

        // Clear preview and command after successful execution
        setPreview(null);
        setCommand('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to execute action');
      } finally {
        setExecuting(false);
      }
    },
    [encounterId, preview]
  );

  // Clear preview
  const clearPreview = useCallback(() => {
    setPreview(null);
    setError(null);
  }, []);

  return {
    command,
    setCommand,
    preview,
    submitting,
    executing,
    error,
    submitCommand,
    executeAction,
    clearPreview,
  };
}
