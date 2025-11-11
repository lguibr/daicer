export interface CharacterSheet {
  race: string;
  class: string;
  gender: string;
  hair: string;
  eyes: string;
  clothes: string;
  height: string;
  weight: string;
  features: string;
}

export interface AvatarImage {
  prompt: string;
  imageData: string; // base64 string
}

export interface FinalAvatarImages {
  fullBody: AvatarImage;
  portrait: AvatarImage;
  upperBody: AvatarImage;
}

export interface GridCell {
  type: 'floor' | 'wall' | 'death' | 'face' | 'spawn';
  description: string;
}

export type GridData = GridCell[][];

export interface CellSelection {
  x: number;
  y: number;
}
