import type { Attribute, CharacterSheet, ResourcePool, Talent } from '../../../types/models';

export interface CharacterCreationProps {
  room?: import('../../../types/models').Room;
  players?: import('../../../types/models').Player[];
  assetMode?: boolean;
  settings?: {
    startingLevel: number;
    attributeBudget: number;
  };
  onAssetCreated?: (asset: any) => void;
  onCharacterCreated?: (player?: import('../../../types/models').Player) => void;
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
    gender?: string;
  };
  personality: {
    traits: string;
    ideals: string;
    bonds: string;
    flaws: string;
  };
  backstory?: string;
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
