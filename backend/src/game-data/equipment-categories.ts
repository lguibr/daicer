/**
 * D&D 5e Equipment Categories
 */

export type EquipmentCategoryId =
  | 'weapon'
  | 'armor'
  | 'adventuring-gear'
  | 'tools'
  | 'mounts-and-vehicles'
  | 'ammunition';

export interface EquipmentCategory {
  id: EquipmentCategoryId;
  index: string;
  name: string;
  description: string;
}

export const EQUIPMENT_CATEGORIES: readonly EquipmentCategory[] = [
  {
    id: 'weapon',
    index: 'weapon',
    name: 'Weapon',
    description: 'Melee and ranged weapons',
  },
  {
    id: 'armor',
    index: 'armor',
    name: 'Armor',
    description: 'Light, medium, and heavy armor plus shields',
  },
  {
    id: 'adventuring-gear',
    index: 'adventuring-gear',
    name: 'Adventuring Gear',
    description: 'General equipment and supplies',
  },
  {
    id: 'tools',
    index: 'tools',
    name: 'Tools',
    description: 'Artisan tools, gaming sets, musical instruments',
  },
  {
    id: 'mounts-and-vehicles',
    index: 'mounts-and-vehicles',
    name: 'Mounts and Vehicles',
    description: 'Animals and transportation',
  },
  {
    id: 'ammunition',
    index: 'ammunition',
    name: 'Ammunition',
    description: 'Arrows, bolts, and other projectiles',
  },
] as const;
