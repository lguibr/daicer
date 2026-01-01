import React from 'react';
import { Skull, Sparkles, MapPin, Hand, Dice5, Zap, BedDouble, Hammer } from 'lucide-react';

export type ToolFieldType = 'text' | 'number' | 'json' | 'select' | 'entity_search' | 'position' | 'room_entity';

export interface ToolField {
  name: string;
  label: string;
  type: ToolFieldType;
  placeholder?: string;
  options?: string[]; // For static select
  searchType?: 'monster' | 'spell' | 'character'; // For entity_search defaults
  description?: string;
  required?: boolean;
  // Dynamic Dependency (e.g. searchType depends on value of another field)
  dependency?: {
    field: string;
    map: Record<string, 'monster' | 'spell' | 'character'>;
  };
}

export interface ToolDefinition {
  id: string;
  label: string;
  icon: React.ReactNode;
  actionPrefix: string;
  description?: string;
  fields: ToolField[];
}

export const TOOLS: ToolDefinition[] = [
  {
    id: 'spawn_entity',
    label: 'Spawn Entity',
    icon: <Skull className="w-4 h-4" />,
    actionPrefix: 'spawn_entity',
    description: 'Spawn a monster, NPC, or player character into the world.',
    fields: [
      {
        name: 'type',
        label: 'Type',
        type: 'select',
        options: ['monster', 'player', 'npc'],
        required: true,
      },
      {
        name: 'blueprintId',
        label: 'Blueprint / Template',
        type: 'entity_search',
        required: true,
        // If type == monster -> search monster
        // If type == player -> search character
        // If type == npc -> search character (assuming NPCs are in char DB or similar)
        dependency: {
          field: 'type',
          map: {
            monster: 'monster',
            player: 'character',
            npc: 'character',
          },
        },
      },
      {
        name: 'position',
        label: 'Position (x,y,z)',
        type: 'position',
        description: 'Target location. Click map to auto-fill.',
      },
    ],
  },
  {
    id: 'cast_spell',
    label: 'Cast Spell',
    icon: <Sparkles className="w-4 h-4" />,
    actionPrefix: 'cast_spell',
    fields: [
      { name: 'spellId', label: 'Spell', type: 'entity_search', searchType: 'spell', required: true },
      { name: 'casterId', label: 'Caster', type: 'room_entity', placeholder: 'Select active entity...' },
      { name: 'targetId', label: 'Target', type: 'room_entity', placeholder: 'Optional target...' },
      { name: 'targetPosition', label: 'Target Position', type: 'position' },
    ],
  },
  {
    id: 'perform_attack',
    label: 'Attack',
    icon: <Zap className="w-4 h-4" />,
    actionPrefix: 'perform_attack',
    fields: [
      { name: 'attackerId', label: 'Attacker', type: 'room_entity', required: true },
      { name: 'targetId', label: 'Target', type: 'room_entity', required: true },
      { name: 'actionName', label: 'Weapon/Action', type: 'text', placeholder: 'e.g. Longsword' },
    ],
  },
  {
    id: 'move_entity',
    label: 'Move',
    icon: <MapPin className="w-4 h-4" />,
    actionPrefix: 'move_entity',
    fields: [
      { name: 'entityId', label: 'Entity', type: 'room_entity', required: true },
      // Path is complicated to build manually. Maybe leave it as JSON or text for now,
      // but strictly user asked for dropdowns.
      // Move usually implies "Move TO".
      // If the tool is "Teleport", it takes position.
      // If it's "Move along path", it takes path.
      // Let's assume standard 'move' command takes destination or path.
      // For debug, let's offer 'destination' (Position) or 'path' (JSON).
      // We'll keep path as JSON for now as building a path array in UI is overkill for this step.
      { name: 'path', label: 'Path JSON', type: 'json' },
    ],
  },
  {
    id: 'interact_object',
    label: 'Interact',
    icon: <Hand className="w-4 h-4" />,
    actionPrefix: 'interact_object',
    fields: [
      { name: 'actorId', label: 'Actor', type: 'room_entity', required: true },
      // Objects aren't in 'room_entity' list usually (those are creatures).
      // Unless we include props. Assuming room_entity strictly means Creatures for now.
      { name: 'targetObjectId', label: 'Object ID', type: 'text', required: true },
      {
        name: 'interactionType',
        label: 'Interaction',
        type: 'select',
        options: ['open', 'close', 'lock', 'unlock', 'toggle', 'loot'],
        required: true,
      },
    ],
  },
  {
    id: 'roll_save',
    label: 'Roll Save',
    icon: <Dice5 className="w-4 h-4" />,
    actionPrefix: 'roll_save',
    fields: [
      { name: 'entityId', label: 'Entity', type: 'room_entity', required: true },
      {
        name: 'stat',
        label: 'Stat',
        type: 'select',
        options: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'],
        required: true,
      },
      { name: 'difficultyClass', label: 'DC', type: 'number' },
    ],
  },
  {
    id: 'modify_terrain',
    label: 'Terrain',
    icon: <Hammer className="w-4 h-4" />,
    actionPrefix: 'modify_terrain',
    fields: [{ name: 'operations', label: 'Operations JSON', type: 'json', required: true }],
  },
  {
    id: 'long_rest',
    label: 'Long Rest',
    icon: <BedDouble className="w-4 h-4" />,
    actionPrefix: 'long_rest',
    fields: [{ name: 'timeRequired', label: 'Hours', type: 'number', placeholder: '8' }],
  },
];
