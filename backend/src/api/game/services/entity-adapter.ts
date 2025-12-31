import { Entity, EntityAction, EntityFeature } from '@daicer/engine';

/*
export interface EngineEntity {
  ... removed local definitions ...
}
*/

export default ({ strapi }) => ({
  /**
   * Adapts a CharacterSheet (populated with character/monster) to a unified EngineEntity.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapt(sheet: any): Entity {
    if (!sheet) throw new Error('Cannot adapt null sheet');

    const type = sheet.type || 'player';
    const name = sheet.name || 'Unknown Entity';
    const hp = sheet.currentHp || 0;
    const maxHp = sheet.maxHp || 1;

    // AC is tricky.
    // For Monsters: usually on the Monster blueprint (sheet.monster.ac).
    // For Players: usually calculated from Dex + Armor (Inventory).
    // For now, we'll look for 'ac' on blueprint or default to 10 + DexMod.

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let blueprint: any = null;
    if (type === 'monster' || type === 'npc') {
      blueprint = sheet.monster;
    } else {
      blueprint = sheet.character;
    }

    // fallback stats
    const stats = blueprint?.stats || blueprint?.baseStats || sheet.stats || {};

    const strength = stats.strength || 10;
    const dexterity = stats.dexterity || 10;
    const constitution = stats.constitution || 10;
    const intelligence = stats.intelligence || 10;
    const wisdom = stats.wisdom || 10;
    const charisma = stats.charisma || 10;

    const passivePerception = stats.passivePerception || 10 + Math.floor((wisdom - 10) / 2);
    const initiativeBonus = Math.floor((dexterity - 10) / 2); // Simple Dex mod for now

    // AC Resolution
    let ac = 10 + initiativeBonus; // Default unarmored
    if (blueprint?.ac) {
      ac = blueprint.ac;
    }
    // TODO: Check inventory for armor if player

    // Actions Resolution
    const actions: EntityAction[] = [];
    if (blueprint?.structuredActions) {
      // Monster actions
      actions.push(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...blueprint.structuredActions.map((a: any) => ({
          name: a.name,
          type: a.type || 'utility',
          toHit: a.toHit,
          reach: a.reach,
          range: a.range,
          damage: a.damage, // Check schema of component
          save: a.save,
          description: a.description,
        }))
      );
    }
    // TODO: Player weapons -> Actions
    if (!blueprint?.structuredActions && sheet.inventory) {
      // Assuming inventory is populated component list or relation
      // Check if inventory has items that are weapons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inventory = sheet.inventory as any[];
      if (Array.isArray(inventory)) {
        inventory.forEach((item) => {
          // Check if item is weapon (needs check on item schema or custom field)
          // For now, assume if it has 'damage' it is a weapon?
          // Or check if 'type' is weapon.
          // Schema for inventory-item has 'item' relation usually?
          // Let's assume we populate inventory.item

          // Simplistic mapping for now:
          // We need to look at the 'equipment' or 'item' relation details
          // STUB: If name contains "Sword" or "Bow", treat as weapon

          // Better: look for damage field on the item itself if we store properties there
          // OR assume we fetch the full Item entity in `populate`.

          // Let's just create a generic "Unarmed Strike" if no weapons found?
          // Or map anything that looks like a weapon.

          if (item.name) {
            actions.push({
              name: item.name,
              type: 'melee', // Default to melee
              toHit: strength > dexterity ? Math.floor((strength - 10) / 2) + 2 : Math.floor((dexterity - 10) / 2) + 2, // Simple logic
              damage: [{ dice: '1d8', bonus: Math.floor((strength - 10) / 2), type: 'slashing' }], // Stub
              description: `Attack with ${item.name}`,
            });
          }
        });
      }
    }

    // Always add Unarmed Strike if no actions
    if (actions.length === 0) {
      actions.push({
        name: 'Unarmed Strike',
        type: 'melee',
        toHit: Math.floor((strength - 10) / 2) + 2, // prof bonus 2
        damage: [{ dice: '1', bonus: Math.floor((strength - 10) / 2), type: 'bludgeoning' }],
        description: 'Punch or Kick',
      });
    }

    // Features Resolution
    const features: EntityFeature[] = [];
    if (blueprint?.features) {
      features.push(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...blueprint.features.map((f: any) => ({
          name: f.name,
          description: f.description,
          usage: f.usage_max ? { max: f.usage_max, per: f.usage_per } : undefined,
        }))
      );
    }

    return {
      id: sheet.documentId,
      name,
      type,
      hp,
      maxHp,
      ac,
      stats: {
        strength,
        dexterity,
        constitution,
        intelligence,
        wisdom,
        charisma,
        passivePerception,
        initiativeBonus,
      },
      actions,
      features,
      color: '#ffffff', // Stub
      visionRadius: 30, // Stub
      speed: 30,
      position: sheet.position || { x: 0, y: 0, z: 0 },
    };
  },
});
