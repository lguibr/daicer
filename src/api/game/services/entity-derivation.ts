/**
 * ⚠️ DOCUMENTATION MANDATE: Update JSDoc & README with ANY change.
 * Keep documentation synchronized with code at all times.
 */
import { Core } from '@strapi/strapi';
import { EntityDeriver } from '@daicer/engine/derivation';
import { Entity, EntityStats, EntityFeature, InventoryItem } from '@daicer/engine/types';

const SKILLS = [
  'acrobatics',
  'animal_handling',
  'arcana',
  'athletics',
  'deception',
  'history',
  'insight',
  'intimidation',
  'investigation',
  'medicine',
  'nature',
  'perception',
  'performance',
  'persuasion',
  'religion',
  'sleight_of_hand',
  'stealth',
  'survival',
] as const;

const ATTRIBUTES: (keyof EntityStats & string)[] = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
];

interface ResolvedAction {
  documentId?: string;
  id?: string;
  name: string;
  type?: string;
  attack?: { bonus: number };
  toHit?: number;
  range_config?: { type: string; distance?: number };
  damage_instances?: Array<{ effect_type: string; dice_count: number; dice_value: number; flat_bonus?: number; damage_type?: string }>;
  effects?: Array<{ type: string; dice?: string; subtype?: string }>;
  save?: { attribute?: string; stat?: string; dc: number };
  range?: string | { value: number; type?: string };
  cost?: string | { type: string };
  description?: string;
}

// Define the shape of the Populated Sheet to satisfy TypeScript
interface PopulatedSheet {
  documentId: string;
  name: string;
  type?: string;
  level?: number;
  currentHp?: number;
  maxHp?: number;
  ac?: number;
  position?: { x: number; y: number; z: number };

  stats?: EntityStats; // Strongly typed
  actions?: ResolvedAction[]; // Component structure (different from EntityAction)
  features?: EntityFeature[];
  inventory?: { item?: InventoryItem; quantity?: number }[];

  conditions?: { name: string; [key: string]: unknown }[];
  proficiencies?: Array<{ slug?: string; name: string }>;

  resistances?: string[];
  immunities?: string[];
  vulnerabilities?: string[];
  speed?: number | { walk: number };
  armorClass?: number;
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Derives cached skills, saves and action descriptions from the raw EntitySheet data and persists the updates.
   * Does not rewrite HP, temporary HP, AC, maximum HP or position from a potentially stale read.
   * The command adapter must validate supported action mechanics separately.
   *
   * @param sheetId - The documentId of the EntitySheet to update.
   */
  async deriveAndPersist(sheetId: string) {
    // 1. Fetch Sheet with DEEP population
    const sheetRaw = await strapi.documents('api::entity-sheet.entity-sheet').findOne({
      documentId: sheetId,

      populate: {
        stats: true,
        inventory: {
          populate: {
            item: {
              populate: {
                equipment_data: {
                  populate: {
                    damage_type: true,
                    properties: true,
                  },
                },
              },
            },
          },
        },
        actions: { populate: ['range_config', 'damage_instances', 'save'] },
        features: true,
        traits: true,
        conditions: true,
        race: true,
        class: true,
        proficiencies: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });

    if (!sheetRaw) {
      throw new Error(`EntitySheet ${sheetId} not found`);
    }

    const sheet = sheetRaw as unknown as PopulatedSheet;

    // Validate and cast Type
    const entityType: Entity['type'] = ['player', 'npc', 'monster', 'object'].includes(sheet.type as string)
      ? (sheet.type as Entity['type'])
      : 'npc';

    // 2. Direct Hydration (No Adapter)
    // We construct a lightweight Entity object for derivation purposes
    const entity: Entity = {
      id: sheet.documentId,
      name: sheet.name,
      type: entityType,
      level: sheet.level || 1,
      stats: sheet.stats || {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        passivePerception: 10,
        initiativeBonus: 0,
      },
      hp: sheet.currentHp ?? sheet.maxHp ?? 10,
      maxHp: sheet.maxHp ?? 10,
      armorClass: sheet.ac ?? 10, // Mapped from 'ac'
      speed:
        typeof sheet.speed === 'number'
          ? sheet.speed
          : typeof sheet.speed === 'object' && sheet.speed?.walk
            ? sheet.speed.walk
            : 30,

      // Note: mapping ResolvedAction[] to EntityAction[] matches roughly
      // but strictly speaking we map them to computedActions later.
      // For Entity interface, direct assignment might be loose.
      // But we are using this 'entity' primarily as a transient holder for stats.
      actions: [], // We compute actions later, but Entity interface requires it.
      features: sheet.features || [],

      resistances: sheet.resistances || [],
      immunities: sheet.immunities || [],
      vulnerabilities: sheet.vulnerabilities || [],

      equipment: (sheet.inventory || []).map((entry) => entry.item).filter((i): i is InventoryItem => !!i),

      // Add other required props of Entity interface with defaults
      position: sheet.position || { x: 0, y: 0, z: 0 },
      visionRadius: 60,
      color: '#fff',
      conditions: sheet.conditions || [],
    };

    // 3. Calculate Derived Values
    const stats = entity.stats;
    const proficiencyBonus = EntityDeriver.calculateProficiencyBonus(entity.level || 1);

    // Skills (Using Components)
    const computedSkills = SKILLS.map((skill) => {
      let attr: keyof EntityStats = 'wisdom';
      if (['athletics'].includes(skill)) attr = 'strength';
      if (['acrobatics', 'sleight_of_hand', 'stealth'].includes(skill)) attr = 'dexterity';
      if (['arcana', 'history', 'investigation', 'nature', 'religion'].includes(skill)) attr = 'intelligence';
      if (['animal_handling', 'insight', 'medicine', 'perception', 'survival'].includes(skill)) attr = 'wisdom';
      if (['deception', 'intimidation', 'performance', 'persuasion'].includes(skill)) attr = 'charisma';

      const val = stats[attr];
      const mod = EntityDeriver.calculateModifier(val);
      const isProficient = sheet.proficiencies?.some(
        (p) => p.slug === skill || p.name.toLowerCase() === skill.replace('_', ' ')
      );

      return {
        name: skill,
        value: mod + (isProficient ? proficiencyBonus : 0),
        proficient: !!isProficient,
      };
    });

    // Saves (Using Components)
    const computedSaves = ATTRIBUTES.map((attr) => {
      const val = stats[attr];
      const mod = EntityDeriver.calculateModifier(val);
      const isProficient = sheet.proficiencies?.some(
        (p) => p.slug === `save_${attr}` || p.name.toLowerCase() === `${attr} save`
      );

      return {
        stat: attr,
        value: mod + (isProficient ? proficiencyBonus : 0),
        proficient: !!isProficient,
      };
    });

    // Actions (Using Components)
    const computedActions =
      (sheet.actions || []).map((action: ResolvedAction) => ({
        name: action.name,
        type: determineActionType(action),
        toHit: action.toHit ?? action.attack?.bonus ?? 0,
        damageDice: damageDice(action),
        damageBonus: action.damage_instances?.find((e) => e.effect_type === 'Damage')?.flat_bonus ?? 0,
        damageType: action.damage_instances?.find((e) => e.effect_type === 'Damage')?.damage_type ?? action.effects?.find((e) => e.type === 'damage')?.subtype ?? 'physical',
        saveAbility: action.save?.attribute || action.save?.stat,
        saveDc: action.save?.dc,
        range: action.range_config?.type === 'Touch' ? 5 : action.range_config?.type === 'Ranged (Feet)' ? action.range_config.distance ?? 0 : typeof action.range === 'object' ? action.range.value ?? 0 : 0,
        description: action.description || '',
        resourceCost: typeof action.cost === 'string' ? action.cost : action.cost?.type,
      })) || [];

    // Defenses
    const defenses = [
      ...(entity.resistances || []).map((t) => ({ damageType: t, modifier: 'resistance' })),
      ...(entity.immunities || []).map((t) => ({ damageType: t, modifier: 'immunity' })),
      ...(entity.vulnerabilities || []).map((t) => ({ damageType: t, modifier: 'vulnerability' })),
    ];

    // Weight Calculation
    const computedWeight = (sheet.inventory || []).reduce((acc: number, entry) => {
      const w = entry.item?.weight || 0;
      const q = entry.quantity || 1;
      return acc + w * q;
    }, 0);

    // 4. Update EntitySheet directly
    await strapi.documents('api::entity-sheet.entity-sheet').update({
      documentId: sheetId,
      data: {
        computedWeight, // Persist calculated weight

        initiativeBonus: stats.initiativeBonus ?? EntityDeriver.calculateModifier(stats.dexterity),
        passivePerception: stats.passivePerception ?? 10 + EntityDeriver.calculateModifier(stats.wisdom),

        computedSkills,
        computedSaves,
        computedActions,
        defenses,
      } as Record<string, unknown>, // Narrower cast than unknown
    });
  },
});

function determineActionType(action: { type?: string; range?: string | { type?: string } }): string {
  if (action.type && ['melee', 'ranged', 'spell', 'utility'].includes(action.type)) return action.type;
  if (typeof action.range === 'object' && action.range?.type === 'melee') return 'melee';
  if (typeof action.range === 'object' && action.range?.type === 'ranged') return 'ranged';
  return 'utility';
}

function damageDice(action: ResolvedAction): string {
  const damage = action.damage_instances?.find((entry) => entry.effect_type === 'Damage');
  return damage ? `${damage.dice_count}d${damage.dice_value}` : action.effects?.find((entry) => entry.type === 'damage')?.dice ?? '';
}
