import type { CharacterFormState } from './types';
import type { AvatarPreviewResponse } from '../../../types/assets';

export interface CharacterSheetAssetSummary {
  name: string;
  race: string;
  characterClass: string;
  level: number;
  alignment: string;
}

export interface CharacterSheetAssetMetadata {
  demo: boolean;
  createdAt: string;
  originRoomId?: string;
}

export interface CharacterSheetAsset {
  kind: 'character-sheet';
  summary: CharacterSheetAssetSummary;
  form: CharacterFormState;
  avatarPreview?: Partial<AvatarPreviewResponse>;
  metadata: CharacterSheetAssetMetadata;
}

interface BuildCharacterSheetAssetParams {
  form: CharacterFormState;
  level: number;
  avatarPreview?: Partial<AvatarPreviewResponse>;
  demo: boolean;
  originRoomId?: string;
}

export function buildCharacterSheetAsset({
  form,
  level,
  avatarPreview,
  demo,
  originRoomId,
}: BuildCharacterSheetAssetParams): CharacterSheetAsset {
  return {
    kind: 'character-sheet',
    summary: {
      name: form.name,
      race: form.race,
      characterClass: form.characterClass,
      level,
      alignment: form.alignment,
    },
    form,
    avatarPreview,
    metadata: {
      demo,
      createdAt: new Date().toISOString(),
      originRoomId,
    },
  };
}
