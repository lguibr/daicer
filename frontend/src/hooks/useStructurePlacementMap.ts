/**
 * useStructurePlacementMap Hook
 *
 * Fetches the global structure placement map from the backend on mount
 * and provides it to components that need to generate terrain chunks
 * with proper structure placement.
 */

import { useState, useEffect, useCallback } from 'react';
import type { GlobalPlacementMap } from '@daicer/shared';
import { auth } from '@/services/firebase';

interface UseStructurePlacementMapResult {
  placementMap: GlobalPlacementMap | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetch and cache the global structure placement map for a room
 *
 * @param roomId - Room identifier
 * @returns Placement map data, loading state, error, and refetch function
 */
export function useStructurePlacementMap(roomId: string | null | undefined): UseStructurePlacementMapResult {
  const [placementMap, setPlacementMap] = useState<GlobalPlacementMap | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlacementMap = useCallback(async () => {
    if (!roomId) {
      setPlacementMap(null);
      setError(null);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setError('Not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const idToken = await user.getIdToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/rooms/${roomId}/world-placement`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Failed to fetch placement map: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setPlacementMap(result.data);
        console.log(`[PlacementMap] Loaded for room ${roomId}:`, {
          structures: result.data.structures.length,
          roads: result.data.roads.length,
          worldSize: result.data.worldSize,
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[PlacementMap] Fetch failed:', errorMessage);
      setError(errorMessage);
      setPlacementMap(null);
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  // Fetch on mount and when roomId/token changes
  useEffect(() => {
    fetchPlacementMap();
  }, [fetchPlacementMap]);

  return {
    placementMap,
    isLoading,
    error,
    refetch: fetchPlacementMap,
  };
}

/**
 * Simplified hook that only returns the placement map (no loading/error states)
 * Useful when you want to handle loading at a higher level
 */
export function usePlacementMapData(roomId: string | null | undefined): GlobalPlacementMap | null {
  const { placementMap } = useStructurePlacementMap(roomId);
  return placementMap;
}
