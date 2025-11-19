/**
 * React hooks for fetching D&D 5e game data
 * Includes caching to prevent unnecessary API calls
 */

import { useState, useEffect } from 'react';
import {
  getAlignments,
  getRaces,
  getClasses,
  getBackgrounds,
  getSkills,
  getAbilities,
  getLanguages,
  getMagicSchools,
  getConditions,
  getDamageTypes,
  getEquipment,
  getWeaponProperties,
  getMonsters,
  type Alignment,
  type Race,
  type CharacterClass,
  type Background,
  type Skill,
  type Ability,
  type Language,
  type MagicSchool,
  type Condition,
  type DamageType,
  type EquipmentItem,
  type WeaponProperty,
  type Monster,
} from '../services/game-data';

interface UseGameDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Generic hook for fetching game data
 */
function useGameData<T>(fetchFn: () => Promise<T>, cacheKey: string): UseGameDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await fetchFn();
        if (mounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch data'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [cacheKey, fetchFn]);

  return { data, loading, error };
}

/**
 * Hook for fetching alignments
 */
export function useAlignments(): UseGameDataResult<Alignment[]> {
  return useGameData(getAlignments, 'alignments');
}

/**
 * Hook for fetching races
 */
export function useRaces(): UseGameDataResult<Race[]> {
  return useGameData(getRaces, 'races');
}

/**
 * Hook for fetching character classes
 */
export function useClasses(): UseGameDataResult<CharacterClass[]> {
  return useGameData(getClasses, 'classes');
}

/**
 * Hook for fetching backgrounds
 */
export function useBackgrounds(): UseGameDataResult<Background[]> {
  return useGameData(getBackgrounds, 'backgrounds');
}

/**
 * Hook for fetching skills
 */
export function useSkills(): UseGameDataResult<Skill[]> {
  return useGameData(getSkills, 'skills');
}

/**
 * Hook for fetching abilities
 */
export function useAbilities(): UseGameDataResult<Ability[]> {
  return useGameData(getAbilities, 'abilities');
}

/**
 * Hook for fetching languages
 */
export function useLanguages(): UseGameDataResult<Language[]> {
  return useGameData(getLanguages, 'languages');
}

/**
 * Hook for fetching magic schools
 */
export function useMagicSchools(): UseGameDataResult<MagicSchool[]> {
  return useGameData(getMagicSchools, 'magic-schools');
}

/**
 * Hook for fetching conditions
 */
export function useConditions(): UseGameDataResult<Condition[]> {
  return useGameData(getConditions, 'conditions');
}

/**
 * Hook for fetching damage types
 */
export function useDamageTypes(): UseGameDataResult<DamageType[]> {
  return useGameData(getDamageTypes, 'damage-types');
}

/**
 * Hook for fetching equipment
 */
export function useEquipment(): UseGameDataResult<EquipmentItem[]> {
  return useGameData(getEquipment, 'equipment');
}

/**
 * Hook for fetching weapon properties
 */
export function useWeaponProperties(): UseGameDataResult<WeaponProperty[]> {
  return useGameData(getWeaponProperties, 'weapon-properties');
}

/**
 * Hook for fetching monsters
 */
export function useMonsters(): UseGameDataResult<Monster[]> {
  return useGameData(getMonsters, 'monsters');
}
