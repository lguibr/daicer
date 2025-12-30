import { Attributes } from './attributes';

export interface Equipment {
  name: string;
  equipment_category?: {
    slug: string;
  };
  armor_class_base?: number;
  armor_class_dex_bonus?: boolean;
  str_minimum?: number;
  stealth_disadvantage?: boolean;
  // Add other fields as needed
}

export interface DerivationContext {
  attributes: Attributes;
  level: number;
  proficiencyBonus: number;
  equipment: Equipment[];
  hitDie?: number; // e.g., 8, 10, 12
  race?: {
    speed?: number | { walkSpeed: number; [key: string]: number };
  };
}
