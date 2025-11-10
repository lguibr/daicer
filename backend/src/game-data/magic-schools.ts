/**
 * D&D 5e Schools of Magic
 */

export type MagicSchoolId =
  | 'abjuration'
  | 'conjuration'
  | 'divination'
  | 'enchantment'
  | 'evocation'
  | 'illusion'
  | 'necromancy'
  | 'transmutation';

export interface MagicSchool {
  id: MagicSchoolId;
  index: string;
  name: string;
  description: string;
}

export const MAGIC_SCHOOLS: readonly MagicSchool[] = [
  {
    id: 'abjuration',
    index: 'abjuration',
    name: 'Abjuration',
    description: 'Prevents or reverses harmful effects',
  },
  {
    id: 'conjuration',
    index: 'conjuration',
    name: 'Conjuration',
    description: 'Transports creatures or objects',
  },
  {
    id: 'divination',
    index: 'divination',
    name: 'Divination',
    description: 'Reveals information',
  },
  {
    id: 'enchantment',
    index: 'enchantment',
    name: 'Enchantment',
    description: 'Influences minds',
  },
  {
    id: 'evocation',
    index: 'evocation',
    name: 'Evocation',
    description: 'Channels energy to create effects that are often destructive',
  },
  {
    id: 'illusion',
    index: 'illusion',
    name: 'Illusion',
    description: 'Deceives the mind or senses',
  },
  {
    id: 'necromancy',
    index: 'necromancy',
    name: 'Necromancy',
    description: 'Manipulates life and death',
  },
  {
    id: 'transmutation',
    index: 'transmutation',
    name: 'Transmutation',
    description: 'Transforms creatures or objects',
  },
] as const;
