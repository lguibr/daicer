/**
 * @file frontend/src/hooks/useTacticalEncounter.ts
 * @description Hook for managing tactical encounter state
 */

import { useState, useEffect, useCallback } from 'react';
import type { TacticalEncounter, GridPosition } from '../components/tactical/types';
import * as tacticalApi from '../services/tacticalApi';

export interface UseTacticalEncounterReturn {
  encounter: TacticalEncounter | null;
  loading: boolean;
  error: string | null;
  addUnit: (type: 'character' | 'creature', id: string, position: GridPosition) => Promise<void>;
  removeUnit: (unitId: string) => Promise<void>;
  startCombat: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useTacticalEncounter(encounterId: string | null): UseTacticalEncounterReturn {
  const [encounter, setEncounter] = useState<TacticalEncounter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load encounter
  const loadEncounter = useCallback(async () => {
    if (!encounterId) {
      setEncounter(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await tacticalApi.getEncounter(encounterId);
      setEncounter(data as unknown as TacticalEncounter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load encounter');
    } finally {
      setLoading(false);
    }
  }, [encounterId]);

  // Load on mount and when encounterId changes
  useEffect(() => {
    loadEncounter();
  }, [loadEncounter]);

  // Add unit
  const addUnit = useCallback(
    async (type: 'character' | 'creature', id: string, position: GridPosition) => {
      if (!encounterId) return;

      setLoading(true);
      setError(null);

      try {
        const payload = {
          type,
          ...(type === 'character' ? { characterId: id } : { creatureId: id }),
          position,
        };

        const newUnit = await tacticalApi.addUnit(encounterId, payload);

        // Update local state
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setEncounter((prev) => (prev ? { ...prev, units: [...prev.units, newUnit as any] } : prev));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add unit');
      } finally {
        setLoading(false);
      }
    },
    [encounterId]
  );

  // Remove unit
  const removeUnit = useCallback(
    async (unitId: string) => {
      if (!encounterId) return;

      setLoading(true);
      setError(null);

      try {
        await tacticalApi.removeUnit(encounterId, unitId);

        // Update local state
        setEncounter((prev) => (prev ? { ...prev, units: prev.units.filter((u) => u.id !== unitId) } : prev));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove unit');
      } finally {
        setLoading(false);
      }
    },
    [encounterId]
  );

  // Start combat
  const startCombat = useCallback(async () => {
    if (!encounterId) return;

    setLoading(true);
    setError(null);

    try {
      const updatedEncounter = await tacticalApi.startCombat(encounterId);
      setEncounter(updatedEncounter as unknown as TacticalEncounter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start combat');
    } finally {
      setLoading(false);
    }
  }, [encounterId]);

  return {
    encounter,
    loading,
    error,
    addUnit,
    removeUnit,
    startCombat,
    refresh: loadEncounter,
  };
}
