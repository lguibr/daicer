/**
 * Character Submission Hook
 * Handles character creation and avatar generation
 */

import { buildCharacterSheetAsset, type CharacterSheetAsset } from './characterSheetAsset';
import { addCharacter, generateAvatarPortrait, generateAvatarUpperBody } from '../../../services/api';
import { buildAvatarPayload } from './avatarHelpers';
import type { CharacterFormState } from './types';
import type { ReferenceImagePayload } from '../../../types/assets';

import type { Room } from '../../../types/shared'; // Added import

interface UseCharacterSubmitParams {
  assetMode: boolean;
  formData: CharacterFormState;
  placeholderRefs: Partial<Record<'portrait' | 'upperBody' | 'fullBody', ReferenceImagePayload>>;
  effectiveLevel: number;
  inventory: Array<{ itemIndex: string; quantity: number }>;
  equippedItems: Record<string, string | null>;
  equipmentItems: any[];
  roomId?: string;
  room?: Room; // Added room
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
      room, // Destructure room
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
          form: formData,
          level: effectiveLevel,
          inventory: inventoryWithNames,
          equippedItems: equippedItemsMap,
          backstory: formData.backstory,
          demo: false, // Default
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

      if (Object.keys(placeholderRefs).length > 0 && room) {
        try {
          const payload = buildAvatarPayload(formData, room, effectiveLevel, equippedItems, equipmentItems);

          // Generate portrait first (independent)
          let finalPortrait: any = null;
          if (placeholderRefs.portrait) {
            finalPortrait = await generateAvatarPortrait(payload, placeholderRefs.portrait.data);
          }

          // Generate upper body (depends on portrait if needed, or reference)
          let finalUpper: any = null;
          if (placeholderRefs.upperBody) {
            // If we have a portrait, use it as seed? API expects it.
            // If we rely purely on placeholders, we pass reference.
            // api.ts: generateAvatarUpperBody(payload, portrait, referenceImage?)
            // We need a portrait object (AvatarPreviewImage). finalPortrait matches.
            if (finalPortrait) {
              finalUpper = await generateAvatarUpperBody(payload, finalPortrait, placeholderRefs.upperBody.data);
            }
          }

          if (finalPortrait || finalUpper) {
            avatarAssets = {
              portrait: finalPortrait,
              upperBody: finalUpper,
              fullBody: undefined, // Not generated yet
            };
          }
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
        backstory: formData.backstory || '',
        avatarAssets: avatarAssets as any, // Cast if needed
        equipment: 'See inventory', // Required string field
        inventory: inventoryWithNames, // explicit field
        equippedItems: equippedItemsMap, // explicit field
      });

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create character');
      setLoading(false);
    }
  };
}
