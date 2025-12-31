import { errors } from '@strapi/utils';
const { ApplicationError } = errors;
import { ActionGenerator } from '../../../../services/mechanics/action-generator';
import { FeatureHydrator } from '../../../../services/mechanics/feature-hydrator';

// Helper to access Strapi global safely if needed or type
declare var strapi: any;

export default {
  async beforeCreate(event) {
    const { data } = event.params;
    validateInventorySlots(data);

    // In create, we might not have all relations populated in 'data', so we might skip or try best effort.
    // Usually creation sends IDs. If we want auto-hydration on create, we'd need to fetch the related entities (class, race) by ID.
    // For now, let's focus on Update, or simple hydration if possible.
    // But let's defer complex hydration to "afterCreate" or require an update flow.
    // ACTUALLY: Best pattern is handling it here if we can resolve relations.
    // Given the complexity of resolving relations from IDs in beforeCreate, we will rely on a subsequent update or the user sending correct data.
    // However, for robustness, we'll try to process if we have the data.
  },

  async beforeUpdate(event) {
    const { data, where } = event.params;
    validateInventorySlots(data);

    // Only run expensive hydration if relevant fields changed
    const relevantFields = ['inventory', 'stats', 'level', 'class', 'race', 'attributes'];
    const needsUpdate = relevantFields.some((key) => key in data);

    if (needsUpdate && where && where.documentId) {
      await updateDerivedData(event);
    }
  },
};

function validateInventorySlots(data: any) {
  if (!data.inventory || !Array.isArray(data.inventory)) {
    return;
  }

  const slots = new Set();
  const validSlots = ['mainHand', 'offHand', 'armor', 'helmet', 'boots', 'accessory']; // Expand as needed

  for (const item of data.inventory) {
    // Skip if item doesn't have a slot or is in backpack
    if (!item.slot || item.slot === 'backpack') {
      continue;
    }

    if (slots.has(item.slot)) {
      throw new ApplicationError(`You cannot have more than one item equipped in the ${item.slot} slot.`);
    }

    slots.add(item.slot);
  }
}

async function updateDerivedData(event) {
  const { where, data } = event.params;

  // 1. Fetch current full state from DB
  // We use documentId if available, v5 standard
  const current = await strapi.documents('api::character-sheet.character-sheet').findOne({
    documentId: where.documentId,
    populate: {
      class: { populate: ['features'] }, // Assuming class has features relation
      race: { populate: ['features'] }, // Assuming race has features relation
      stats: true,
      inventory: true,
      features: true,
      structuredActions: true,
    },
  });

  if (!current) return;

  // 2. Merge incoming data over current state to get "Final State"
  // Note: This is shallow merge for top level fields. deeper merge for components is trickier.
  // For relations (class, race), data usually contains Document ID string, so we might need to re-fetch if changed.
  // If Class/Race CHANGED in this update, 'current' has old class. We must fetch NEW class.

  let classData = current.class;
  if (data.class && data.class !== current.class?.documentId) {
    // User changed class, fetch new one directly
    classData = await strapi.documents('api::class.class').findOne({ documentId: data.class, populate: ['features'] });
  }

  let raceData = current.race;
  if (data.race && data.race !== current.race?.documentId) {
    raceData = await strapi.documents('api::race.race').findOne({ documentId: data.race, populate: ['features'] });
  }

  const level = data.level ?? current.level ?? 1;
  // Stats is a component. If data.stats is present, use it. Else current.stats.
  const stats = data.stats ||
    current.stats || { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 };
  const inventory = data.inventory || current.inventory || [];

  // 3. Hydrate Features
  // We need to map classData/raceData features to our simpler interface
  // Assuming classData has 'features' which is a collection of some entity
  const featuresInput = {
    characterLevel: level,
    classFeatures: (classData?.features || []).map((f: any) => ({
      name: f.name,
      description: f.description || '',
      level: f.level || 1,
    })),
    raceFeatures: (raceData?.features || []).map((f: any) => ({
      name: f.name,
      description: f.description || '',
    })),
  };

  const hydratedFeatures = FeatureHydrator.hydrateFeatures(featuresInput);

  // 4. Hydrate Actions
  // Look for equipped weapons in inventory
  const generatedActions: any[] = [];

  // We assume inventory item has 'isEquipped' logic or we check slot
  // The 'inventory' component schema tracks: item (string name?), quantity, slot, isEquipped
  // To generate actions we need WEAPON STATS (damage dice etc).
  // Problem: The inventory component only stores "item name". The STATS are in 'api::equipment.equipment'.
  // We must fetch the actual Equipment Definition for each equipped item.

  // Optimized: Collect IDs/Names of equipped items
  // If 'item' field stores the Name (string), we query Equipment by name.
  // If 'item' is a Relation (unlikely in simple component design usually string?), check schema. It says "item: string".

  const equippedItems = inventory.filter((i: any) => i.slot && i.slot !== 'backpack' && i.isEquipped !== false);

  for (const invItem of equippedItems) {
    // Fetch equipment definition
    // We assume 'invItem.item' holds the name or ID. Preferably Name based on schema description?
    // Schema: "item": { "type": "string" }
    const equipmentDef = await strapi.documents('api::equipment.equipment').findFirst({
      filters: { name: invItem.item },
    });

    if (equipmentDef && equipmentDef.type === 'weapon') {
      // Generate Action
      const action = ActionGenerator.generateWeaponAction({
        weapon: {
          name: equipmentDef.name,
          damageDice: equipmentDef.damageDice || '1d4', // Safe default
          damageType: equipmentDef.damageType || 'bludgeoning',
          properties: equipmentDef.properties || [],
          range: equipmentDef.range,
        },
        stats: stats,
        proficiencyBonus: Math.ceil(1 + level / 4), // Approximation of PB
        isProficient: true, // Assume proficient if equipped for now, or check Class Proficiencies
      });
      generatedActions.push(action);
    }
  }

  // 5. Mutate Event Data
  event.params.data.features = hydratedFeatures;
  event.params.data.structuredActions = generatedActions;

  // console.log(`[Lifecycle] Hydrated ${generatedActions.length} actions and ${hydratedFeatures.length} features for ${where.documentId}`);
}
