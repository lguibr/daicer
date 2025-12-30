/**
 * Interface representing a Character Sheet Asset within the creation flow.
 * Used for previewing existing character sheets to import/copy.
 */
export interface CharacterSheetAsset {
  id: string;
  summary: {
    name: string;
    race: string;
    characterClass: string;
    level: number;
    // Add other summary fields as needed
    background?: string;
  };
  // Metadata about the asset
  createdAt?: string;
  source?: 'user_created' | 'system_preset';
}
