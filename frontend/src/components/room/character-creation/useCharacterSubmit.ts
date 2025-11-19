/**
 * Character Submission Hook
 * Handles character creation and avatar generation
 */

import { buildCharacterSheetAsset, type CharacterSheetAsset } from './characterSheetAsset';
import {
  addCharacter,
  generateAvatarPortrait,
  generateAvatarUpperBody,
  generateAvatarFullBody,
} from '../../../services/api';
import { buildAvatarPayload } from './avatarHelpers';
import type { CharacterFormState } from './types';
import type { ReferenceImagePayload } from '../../../types/assets';

interface UseCharacterSubmitParams {
  assetMode: boolean;
  formData: CharacterFormState;
  placeholderRefs: Partial<Record<'portrait' | 'upperBody' | 'fullBody', ReferenceImagePayload>>;
  effectiveLevel: number;
  inventory: Array<{ itemIndex: string; quantity: number }>;
  equippedItems: Record<string, string | null>;
  equipmentItems: any[];
  roomId?: string;
  onAssetCreated?: (asset: CharacterSheetAsset) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export function createCharacterSubmitHandler(params: UseCharacterSubmitParams) {
  return async () => {
    const {
      assetMode,
      formData,
      placeholderRefs,
      effectiveLevel,
      inventory,
      equippedItems,
      equipmentItems,
      roomId,
      onAssetCreated,
      setError,
      setLoading,
    } = params;

    try {
      setLoading(true);
      setError(null);

      // Validation
      if (!formData.name || formData.name.trim().length === 0) {
        setError('Character name is required');
        setLoading(false);
        return;
      }

      if (!formData.race || formData.race.trim().length === 0) {
        setError('Race selection is required');
        setLoading(false);
        return;
      }

      if (!formData.characterClass || formData.characterClass.trim().length === 0) {
        setError('Class selection is required');
        setLoading(false);
        return;
      }

      // Build equipped items map
      const equippedItemsMap: Record<string, string> = {};
      Object.entries(equippedItems).forEach(([slot, itemIndex]) => {
        if (itemIndex) {
          equippedItemsMap[slot] = itemIndex;
        }
      });

      // Build inventory items with names
      const inventoryWithNames = inventory.map((inv) => {
        const item = equipmentItems.find((ei) => ei.index === inv.itemIndex);
        return {
          index: inv.itemIndex,
          name: item?.name || 'Unknown Item',
          quantity: inv.quantity,
        };
      });

      // Asset mode: create asset
      if (assetMode && onAssetCreated) {
        const asset = buildCharacterSheetAsset({
          name: formData.name,
          race: formData.race,
          characterClass: formData.characterClass,
          level: effectiveLevel,
          alignment: formData.alignment,
          background: formData.background || '',
          attributes: formData.attributes,
          appearance: formData.appearance,
          personality: formData.personality,
          backstory: formData.backstory,
          inventory: inventoryWithNames,
          equippedItems: equippedItemsMap,
        });

        onAssetCreated(asset);
        setLoading(false);
        return;
      }

      // Game mode: submit to room
      if (!roomId) {
        setError('Room ID is required');
        setLoading(false);
        return;
      }

      // Generate avatars
      let avatarAssets = null;

      if (Object.keys(placeholderRefs).length > 0) {
        try {
          const payload = buildAvatarPayload(formData, placeholderRefs);

          const [portrait, upperBody, fullBody] = await Promise.all([
            payload.portrait ? generateAvatarPortrait(payload.portrait) : null,
            payload.upperBody ? generateAvatarUpperBody(payload.upperBody) : null,
            payload.fullBody ? generateAvatarFullBody(payload.fullBody) : null,
          ]);

          avatarAssets = { portrait, upperBody, fullBody };
        } catch (err) {
          console.error('Avatar generation failed:', err);
        }
      }

      // Submit character
      await addCharacter(roomId, {
        name: formData.name,
        race: formData.race,
        characterClass: formData.characterClass,
        level: effectiveLevel,
        xp: 0,
        attributes: formData.attributes,
        alignment: formData.alignment,
        background: formData.background || '',
        appearance: formData.appearance,
        personality: formData.personality,
        backstory: formData.backstory,
        avatarAssets,
        equipment: {
          inventory: inventoryWithNames,
          equippedItems: equippedItemsMap,
        },
      });

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create character');
      setLoading(false);
    }
  };
}
