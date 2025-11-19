/**
 * Character Form State Hook
 * Manages all character creation form state
 */

import { useState } from 'react';
import type { AvatarPreviewResponse, ReferenceImagePayload } from '../../../types/assets';
import type { CharacterFormState } from './types';
import type { EquipmentItemData } from '../../equipment/EquipmentItemCard';

export function useCharacterFormState(startingLevel: number, attributeBudget: number, assetMode: boolean) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState<Partial<AvatarPreviewResponse>>({});
  const [placeholderRefs, setPlaceholderRefs] = useState<
    Partial<Record<keyof AvatarPreviewResponse, ReferenceImagePayload>>
  >({});
  const [placeholderDimensions, setPlaceholderDimensions] = useState<
    Partial<Record<keyof AvatarPreviewResponse, { width: number; height: number }>>
  >({});
  const [previewLoadState, setPreviewLoadState] = useState<Record<keyof AvatarPreviewResponse, boolean>>({
    portrait: false,
    upperBody: false,
    fullBody: false,
  });
  const [placeholderLoading, setPlaceholderLoading] = useState(false);

  const [customLevel, setCustomLevel] = useState(startingLevel);
  const effectiveLevel = assetMode ? customLevel : startingLevel;

  const [formData, setFormData] = useState<CharacterFormState>({
    name: '',
    race: 'Human',
    characterClass: 'Fighter',
    background: '',
    alignment: 'Neutral Good',
    attributes: {
      Strength: 10,
      Dexterity: 10,
      Constitution: 10,
      Intelligence: 10,
      Wisdom: 10,
      Charisma: 10,
    },
    appearance: { age: '', height: '', weight: '', eyes: '', skin: '', hair: '', description: '' },
    personality: { traits: '', ideals: '', bonds: '', flaws: '' },
    backstory: '',
  });

  const [equipmentItems, setEquipmentItems] = useState<EquipmentItemData[]>([]);
  const [equipmentGold, setEquipmentGold] = useState(0);
  const [inventory, setInventory] = useState<Array<{ itemIndex: string; quantity: number }>>([]);
  const [equippedItems] = useState<Record<string, string | null>>({
    mainHand: null,
    offHand: null,
    armor: null,
    accessory1: null,
    accessory2: null,
  });

  return {
    loading,
    setLoading,
    error,
    setError,
    previewError,
    setPreviewError,
    previewLoading,
    setPreviewLoading,
    avatarPreview,
    setAvatarPreview,
    placeholderRefs,
    setPlaceholderRefs,
    placeholderDimensions,
    setPlaceholderDimensions,
    previewLoadState,
    setPreviewLoadState,
    placeholderLoading,
    setPlaceholderLoading,
    customLevel,
    setCustomLevel,
    effectiveLevel,
    formData,
    setFormData,
    equipmentItems,
    setEquipmentItems,
    equipmentGold,
    setEquipmentGold,
    inventory,
    setInventory,
    equippedItems,
  };
}
