/**
 * Spawn Service
 * Handles instantiation of Characters and Monsters into the game world.
 */

import { CharacterDeriver } from '@daicer/engine';

export default ({ strapi }) => ({
  /**
   * Spawn a monster into a room by creating a CharacterSheet
   */
  async spawnMonster(
    roomId: string | number,
    monsterId: string | number,
    position: { x: number; y: number; z: number }
  ) {
    // 1. Fetch Monster Blueprint
    const monster = await strapi.documents('api::monster.monster').findOne({
      documentId: monsterId as string, // Try documentId first
    });

    // Fallback if not string or not found via documentId (though documents API prefers documentId uses standard findOne)
    // If monsterId is numeric ID, we might need a filter.
    // Assuming backend receives documentId from frontend.

    if (!monster) {
      // Try finding by numeric id if monsterId is number?
      // strapi.documents usually uses documentId.
      throw new Error(`Monster blueprint not found: ${monsterId}`);
    }

    // 2. Fetch Room to ensure existence
    const room = await strapi.documents('api::room.room').findOne({
      documentId: roomId as string,
    });
    if (!room) throw new Error('Room not found');

    // 3. Create Character Sheet
    // Use monster stats
    const hp = monster.hp || 10;
    const maxHp = monster.hp || 10;

    // Parse speed? Monster speed is JSON usually e.g. "30 ft" or { walk: 30 }.
    // We'll store it as is or parse if needed.
    // CharacterSheet doesn't have a specific 'speed' field, it might be in 'stats' component or we rely on 'monster' relation.

    const newSheet = await strapi.documents('api::character-sheet.character-sheet').create({
      data: {
        name: monster.name,
        type: 'monster',
        monster: monster.documentId,
        room: room.documentId,
        currentHp: hp,
        maxHp: maxHp,
        level: 1, // Default
        experience: monster.xp || 0,
        position: position,
        // Stats component can be populated from monster.stats if structures match
        stats: monster.stats,
        speed: monster.speed, // Populate speed directly from monster (which is now JSON)
        // We can add appearance/inventory stubs
      },
      status: 'published',
    });

    return newSheet;
  },

  /**
   * Spawn a character from blueprint
   */
  async spawnCharacter(
    roomId: string | number,
    characterId: string | number,
    position: { x: number; y: number; z: number }
  ) {
    const character = await strapi.documents('api::character.character').findOne({
      documentId: characterId as string,
      populate: ['baseStats', 'race', 'class', 'equipment'],
    });

    if (!character) throw new Error('Character blueprint not found');

    const room = await strapi.documents('api::room.room').findOne({
      documentId: roomId as string,
    });
    if (!room) throw new Error('Room not found');

    // Parse Hit Die from Class (e.g., "1d8" -> 8)
    let hitDie = 8;
    if (character.class?.hit_die) {
      const parts = character.class.hit_die.split('d');
      if (parts.length === 2) {
        hitDie = parseInt(parts[1], 10);
      }
    }

    // Prepare Derivation Context
    const attributes = character.baseStats; // Assuming structure matches { str: 10, ... }

    // Calculate Stats
    const derived = CharacterDeriver.derive({
      attributes: attributes,
      level: 1,
      proficiencyBonus: 2, // Level 1 default
      equipment: character.equipment || [],
      hitDie: hitDie,
      race: {
        speed: character.race?.speed,
      },
    });

    const newSheet = await strapi.documents('api::character-sheet.character-sheet').create({
      data: {
        name: character.name,
        type: 'player', // or 'npc' if spawned by DM
        character: character.documentId,
        room: room.documentId,
        currentHp: derived.hp,
        maxHp: derived.maxHp,
        level: 1,
        experience: 0,
        position: position,
        stats: character.baseStats,
        race: character.race?.documentId,
        class: character.class?.documentId,
        speed: derived.speed,
        appearance: character.appearance,
        backstory: character.backstory,
        inventory: character.equipment || [],
      },
      status: 'published',
    });

    return newSheet;
  },
});
