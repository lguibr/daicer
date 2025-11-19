import type { Attribute, CharacterSheet, ResourcePool, Talent } from '../../../types/shared';

export interface CharacterCreationProps {
  room?: import('../../../types/shared').Room;
  players?: import('../../../types/shared').Player[];
  assetMode?: boolean;
  settings?: {
    startingLevel: number;
    attributeBudget: number;
  };
  onAssetCreated?: (asset: any) => void;
}

export type CharacterFormState = {
  name: string;
  race: string;
  characterClass: string;
  background: string;
  alignment: string;
  attributes: Record<Attribute, number>;
  skills: Record<string, number>;
  equipment: string;
  proficienciesAndLanguages: string;
  features: string;
  treasure: string;
  currency: CharacterSheet['currency'];
  resourcePools: ResourcePool[];
  talents: Talent[];
  expertises: string[];
  appearance: {
    age: string;
    height: string;
    weight: string;
    eyes: string;
    skin: string;
    hair: string;
    description: string;
  };
  personality: {
    traits: string;
    ideals: string;
    bonds: string;
    flaws: string;
  };
};

export interface SelectionCardProps {
  label: string;
  description?: string;
  detail?: string;
  selected: boolean;
  onSelect: () => void;
}

export interface OptionPillProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
}
