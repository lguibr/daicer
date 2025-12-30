import { useState } from 'react';
import { GamePhase, type Room } from '@daicer/engine';
import { generateAvatarPortrait, generateAvatarUpperBody, generateAvatarFullBody } from '../../../../services/api';
import { buildAvatarPayload, appendReference, downscalePreviewImage } from '../avatarHelpers';
import type { CharacterFormState } from '../types';
import type { EquipmentItemData } from "../../../equipment/EquipmentItemCard";
import type { AvatarPreviewImage } from '../../../../types/assets';

export function useAvatarGeneration(
  formData: CharacterFormState,
  room: Room | null | undefined,
  startingLevel: number,
  equippedItems: Record<string, string | null>,
  equipmentItems: EquipmentItemData[],
  assetMode: boolean
) {
  const [avatarPreview, setAvatarPreview] = useState<any>({});
  const [previewLoadState, setPreviewLoadState] = useState({ portrait: false, upperBody: false, fullBody: false });
  const [error, setError] = useState<string | null>(null);

  const handleGenerateAll = async (ensurePlaceholdersFn: () => Promise<any>) => {
    setError(null);
    try {
      const refs = await ensurePlaceholdersFn();

      const roomForPayload =
        assetMode || !room
          ? {
              documentId: 'room-char-creation',
              roomId: 'CHAR-CREATION',
              id: 'room-char-creation',
              code: 'CHAR-CREATION',
              phase: GamePhase.CHARACTER_CREATION,
              worldDescription: 'Character sheet asset creation',
              settings: null,
              ownerId: '',
              createdAt: Date.now(),
              updatedAt: Date.now(),
            }
          : room;

      const payload = buildAvatarPayload(formData, roomForPayload, startingLevel, equippedItems, equipmentItems);

      // Step 1: Portrait
      setPreviewLoadState((prev) => ({ ...prev, portrait: true }));
      let portrait: AvatarPreviewImage | null = null;
      try {
        const userPortrait = avatarPreview.portrait
          ? `data:${avatarPreview.portrait.mimeType};base64,${avatarPreview.portrait.data}`
          : null;
        const portraitPayload = userPortrait ? payload : appendReference(payload, refs?.portrait);
        const portraitRaw = await generateAvatarPortrait(portraitPayload, userPortrait);
        const tempPortrait = portraitRaw; // Keep raw or process?
        // generateAvatarPortrait likely returns AvatarPreviewImage (object) or string?
        // Assuming it matches downscale input.
        try {
          portrait = await downscalePreviewImage(tempPortrait);
        } catch (e) {
          console.warn(e);
          portrait = typeof tempPortrait === 'string' ? null : tempPortrait;
        }
        setAvatarPreview((prev: any) => ({ ...prev, portrait }));
      } finally {
        setPreviewLoadState((prev) => ({ ...prev, portrait: false }));
      }

      if (!portrait) return; // Stop if failed

      // Step 2: Upper Body
      setPreviewLoadState((prev) => ({ ...prev, upperBody: true }));
      let upperBody: AvatarPreviewImage | null = null;
      try {
        const userUpper = avatarPreview.upperBody
          ? `data:${avatarPreview.upperBody.mimeType};base64,${avatarPreview.upperBody.data}`
          : null;
        const upperPayload = userUpper ? payload : appendReference(payload, refs?.upperBody);
        const upperRaw = await generateAvatarUpperBody(upperPayload, portrait, userUpper);

        try {
          upperBody = await downscalePreviewImage(upperRaw);
        } catch (e) {
          console.warn(e);
          upperBody = typeof upperRaw === 'string' ? null : upperRaw;
        }
        setAvatarPreview((prev: any) => ({ ...prev, upperBody }));
      } finally {
        setPreviewLoadState((prev) => ({ ...prev, upperBody: false }));
      }

      if (!upperBody) return;

      // Step 3: Full Body
      setPreviewLoadState((prev) => ({ ...prev, fullBody: true }));
      try {
        const userFull = avatarPreview.fullBody
          ? `data:${avatarPreview.fullBody.mimeType};base64,${avatarPreview.fullBody.data}`
          : null;
        const fullPayload = userFull ? payload : appendReference(payload, refs?.fullBody);
        const fullRaw = await generateAvatarFullBody(fullPayload, portrait, upperBody, userFull);

        // let fullBody = fullRaw;
        let finalFullBody: AvatarPreviewImage | null = null;
        try {
          finalFullBody = await downscalePreviewImage(fullRaw);
        } catch (e) {
          console.warn(e);
          finalFullBody = typeof fullRaw === 'string' ? null : fullRaw;
        }
        setAvatarPreview((prev: any) => ({ ...prev, fullBody: finalFullBody }));
      } finally {
        setPreviewLoadState((prev) => ({ ...prev, fullBody: false }));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate portraits');
      setPreviewLoadState({ portrait: false, upperBody: false, fullBody: false });
    }
  };

  const handleAvatarUpdate = (slot: 'portrait' | 'upperBody' | 'fullBody', base64Data: string) => {
    const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      const data = matches[2];
      setAvatarPreview((prev: any) => ({
        ...prev,
        [slot]: {
          mimeType,
          data,
          prompt: 'User Upload',
          width: 512,
          height: 512,
        },
      }));
    }
  };

  const handleAvatarUpload = (slot: 'portrait' | 'upperBody' | 'fullBody', file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      handleAvatarUpdate(slot, base64String);
    };
    reader.readAsDataURL(file);
  };

  return {
    avatarPreview,
    setAvatarPreview,
    previewLoadState,
    setPreviewLoadState,
    handleGenerateAll,
    handleAvatarUpdate,
    handleAvatarUpload,
    genError: error,
  };
}
