/**
 * ⚠️ DOCUMENTATION MANDATE: Update JSDoc & README with ANY change.
 * Keep documentation synchronized with code at all times.
 */
import { generateText } from '@/utils/llm';
import { getPrompt, formatPrompt } from '@/utils/prompt';
import { uploadBase64Image } from '@/utils/upload';
import { createCharacterSnapshot, formatDmInstruction, EntityDeriver } from '@/api/game/src/engine';
import type { WorldSettings, Player, EntitySheet, Language } from '@/api/game/src/engine';
import { documentId, gameError, PLAYER_BLUEPRINT_TYPES, requireLobby, requireRoom } from './room-access';
import { playerData } from './room-lifecycle';

// Helper to format DM style

interface StrapiClass {
  documentId: string;
  name: string;
  hit_die?: number;
}

interface StrapiRace {
  documentId: string;
  name: string;
  speed?: number;
}

interface StrapiItem {
  id: string | number;
  documentId?: string;
  name: string;
  [key: string]: unknown;
}

interface StrapiEquipmentEntry {
  isEquipped: boolean;
  item: StrapiItem;
  quantity?: number;
  slot?: string;
}

interface StrapiCharacter {
  documentId: string;
  name: string;
  classes?: { class: StrapiClass; level: number }[];
  race?: string | StrapiRace;
  stats: unknown;
  appearance?: unknown;
  backstory?: string;
  background?: string;
  equipment?: StrapiEquipmentEntry[];
  inventory?: StrapiEquipmentEntry[];
  actions?: { documentId: string }[];
}

interface OnboardPlayerData {
  name?: string;
  documentId?: string;
  race?: string;
  class?: string;
  characterClass?: string;
  baseStats?: Record<string, number>;
  attributes?: Record<string, number>;
  backstory?: string;
  background?: string;
  equipment?: unknown[];
  avatarPreview?: Record<string, { id?: string | number; url?: string; data?: string; mimeType?: string }>;
  _raceSpeed?: number;
}

interface PopulatedEntitySheet extends Omit<
  EntitySheet,
  'race' | 'class' | 'classes' | 'characterClass' | 'personality'
> {
  documentId: string;
  race?: string | { name: string };
  class?: string | { name: string };
  classes?: { class: string | { name: string }; level: number }[];
  characterClass?: string;
  personality?: { traits: string; ideals: string; bonds: string; flaws: string };
}

export default ({ strapi }) => ({
  /**
   * Creates a simplified snapshot of entity states for frontend consumption.
   *
   * @param entitySheets - Raw entity sheet data.
   * @returns Record of snapshots keyed by ID.
   */
  createSnapshot(entitySheets: unknown[]) {
    const snapshot: Record<string, unknown> = {};
    for (const sheet of entitySheets) {
      if (!sheet || typeof sheet !== 'object') continue;

      const s = sheet as { documentId: string; [key: string]: unknown };
      if (s.documentId) {
        // Renaming to generic createEntitySnapshot if possible, or keeping utility name but passing sheet
        // Assuming createCharacterSnapshot can handle entity sheets since it takes the sheet structure
        const snap = createCharacterSnapshot(s);
        if (snap) {
          snapshot[s.documentId] = snap;
        }
      }
    }
    return snapshot;
  },

  /**
   * Onboards a player into a specific Room, creating their EntitySheet and linking it.
   * Handles avatar processing, stat derivation, and initial placement.
   *
   * @param roomId - The room to join.
   * @param entityData - The character creation payload (race, class, stats, etc).
   * @param user - The authenticated user.
   * @returns The created entity context.
   */
  async onboardPlayer(
    roomId: string,
    entityData: OnboardPlayerData,
    user: { documentId: string; id: string; username: string }
  ) {
    // Authorize before uploads, blueprint creation, or sheet writes.
    const { room, player, userId } = await requireRoom(strapi, roomId, user);
    requireLobby(room);
    const players = room.players || [];
    const playerIndex = players.findIndex((entry) => documentId(entry.user) === userId);
    const previousSheet = player.characterSheet;
    if (previousSheet && (documentId(previousSheet.owner) !== userId || documentId(previousSheet.room) !== roomId)) {
      gameError('FORBIDDEN', 'Character ownership is inconsistent.');
    }

    // 2. Process Avatar Uploads
    const avatarSlots = ['portrait', 'upperBody', 'fullBody'];
    const processedAvatarPreview: Record<
      string,
      { id?: string | number; url?: string; data?: string; mimeType?: string }
    > = {
      ...((entityData.avatarPreview as Record<
        string,
        { id?: string | number; url?: string; data?: string; mimeType?: string }
      >) || {}),
    };

    if (processedAvatarPreview) {
      for (const slot of avatarSlots) {
        if (processedAvatarPreview[slot] && processedAvatarPreview[slot].data) {
          try {
            strapi.log.info(`Processing avatar upload for slot: ${slot}`);
            const base64 = `data:${processedAvatarPreview[slot].mimeType};base64,${processedAvatarPreview[slot].data}`;
            const filename = `avatar-${user.id}-${slot}-${Date.now()}`;
            const uploadResult = await uploadBase64Image(base64, filename);
            if (uploadResult) {
              processedAvatarPreview[slot] = {
                id: uploadResult.id,
                url: uploadResult.url,
              };
              strapi.log.info(`Avatar ${slot} uploaded successfully: ${uploadResult.id}`);
            }
          } catch (err) {
            strapi.log.error(`Failed to upload ${slot} avatar:`, err);
          }
        }
      }
    }

    // 3. Create OR Link Entity (Blueprint)
    let createdEntity: StrapiCharacter | null = null; // Reusing interface for now, effectively Entity

    // Check if we are linking an existing entity
    if (entityData.documentId) {
      // Validate it exists
      const existing = await strapi.documents('api::entity.entity').findOne({
        documentId: entityData.documentId,
        populate: { stats: true, race: true, actions: true, classes: { populate: ['class'] }, inventory: { populate: { item: { populate: { equipment_data: { populate: ['damage_type', 'properties'] } } } } } },
      });
      if (!existing || !PLAYER_BLUEPRINT_TYPES.includes(existing.type)) gameError('INVALID_INPUT', 'Playable blueprint unavailable.');
      createdEntity = existing;
      if (documentId(previousSheet?.entity) === existing.documentId) {
        return { entity: existing, entitySheet: previousSheet, player };
      }
    }

    // If not linking or not found, create new
    if (!createdEntity) {
      let raceId = null;
      if (entityData.race) {
        const races = await strapi.documents('api::race.race').findMany({
          filters: { name: entityData.race },
        });
        if (races && races.length > 0) {
          raceId = races[0].documentId;
          const race = races[0] as unknown as StrapiRace;
          if (race.speed) {
            entityData._raceSpeed = race.speed;
          }
        }
      }

      let classId = null;
      const className = entityData.characterClass || entityData.class;
      if (className) {
        const classes = await strapi.documents('api::class.class').findMany({
          filters: { name: className },
        });
        if (classes && classes.length > 0) {
          classId = classes[0].documentId;
        }
      }

      const rawStats = (entityData.baseStats || entityData.attributes || {}) as Record<string, unknown>;
      const baseStats = {
        strength: Number(rawStats.Strength || rawStats.strength || 10),
        dexterity: Number(rawStats.Dexterity || rawStats.dexterity || 10),
        constitution: Number(rawStats.Constitution || rawStats.constitution || 10),
        intelligence: Number(rawStats.Intelligence || rawStats.intelligence || 10),
        wisdom: Number(rawStats.Wisdom || rawStats.wisdom || 10),
        charisma: Number(rawStats.Charisma || rawStats.charisma || 10),
      };

      // Create generic Entity for this player
      // Unique slug required
      const slug = `${entityData.name}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      createdEntity = await strapi.documents('api::entity.entity').create({
        data: {
          name: entityData.name,
          slug: slug,
          type: 'Player', // Using Capitalized for Entity Type field usually
          race: raceId,
          classes: classId ? [{ class: classId, level: 1 }] : [],
          background: entityData.backstory || entityData.background, // Map backstory to background rich text?
          // appearance: entityData.appearance, // Entity has component appearance, check structure
          inventory: entityData.equipment,
          // user: user.documentId, // Entity doesn't have user usually, EntitySheet does. Or Entity might if we added it? Schema says No.
          stats: baseStats,
          image: processedAvatarPreview?.portrait?.id, // Entity has image field
        },
        status: 'published',
      });
    }

    // 4. Create Entity Sheet (The Gameplay Instance)
    const rawStats = (createdEntity.stats as Record<string, number>) || {};
    const attributes = {
      strength: rawStats.strength ?? 10,
      dexterity: rawStats.dexterity ?? 10,
      constitution: rawStats.constitution ?? 10,
      intelligence: rawStats.intelligence ?? 10,
      wisdom: rawStats.wisdom ?? 10,
      charisma: rawStats.charisma ?? 10,
    };

    const inventory = createdEntity.inventory || createdEntity.equipment || [];
    const equipmentForDeriver = inventory
      .filter((entry) => entry.isEquipped && entry.item)
      .map((entry) => ({
        ...entry.item,
        ...(entry.item.equipment_data as Record<string, unknown> ?? {}),
        name: entry.item.name,
        equipment_category: (entry.item.equipment_category as { slug: string }) ?? { slug: String(entry.item.type ?? 'loot') },
        isEquipped: true,
      }));

    const derived = EntityDeriver.derive({
      stats: attributes,
      attributes,
      proficiencyBonus: 2, // Default
      classes: createdEntity.classes?.map((c) => ({
        name: c.class.name,
        level: c.level,
        hitDie: c.class.hit_die ? `d${c.class.hit_die}` : undefined,
      })),
      level: 1,
      equipment: equipmentForDeriver,
      race: {
        speed: typeof createdEntity.race === 'object' ? createdEntity.race.speed : entityData._raceSpeed,
      },
    });

    const sheetData = {
      name: createdEntity.name,
      type: 'player',
      class: documentId(createdEntity.classes?.[0]?.class),
      race: documentId(createdEntity.race),
      level: derived.level,
      experience: 0,

      stats: attributes,
      actions: (createdEntity.actions ?? []).map((action) => action.documentId),
      currentHp: derived.hp,
      maxHp: derived.maxHp,
      ac: derived.ac,
      // appearance: createdEntity.appearance,
      backstory: typeof createdEntity.background === 'string' ? createdEntity.background : '', // Handle Rich Text conversion if needed
      inventory: inventory.filter((entry) => documentId(entry.item)).map((entry) => ({
        item: documentId(entry.item), quantity: entry.quantity ?? 1,
        slot: entry.slot, isEquipped: !!entry.isEquipped,
      })),
      position: { x: 0, y: 0, z: 0 },
      entity: createdEntity.documentId, // Link to Entity Blueprint
      owner: user.documentId, // Link Owner logic here
      room: room.documentId,
    };
    const sheets = strapi.documents('api::entity-sheet.entity-sheet');
    const createdSheet = documentId(previousSheet)
      ? await sheets.update({ documentId: documentId(previousSheet), data: sheetData })
      : await sheets.create({ data: sheetData, status: 'published' });

    strapi.log.info(`Created EntitySheet ${createdSheet.documentId} for Room ${roomId}`);

    // 5. Update Room Player Component
    const updatedPlayers = players.map(playerData);
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      character: createdEntity.documentId,
      characterSheet: createdSheet.documentId,
      isReady: false,
      name: createdEntity.name,
    };

    await strapi.documents('api::room.room').update({
      documentId: room.documentId,
      data: {
        players: updatedPlayers,
      },
    });

    return { entity: createdEntity, entitySheet: createdSheet, player: updatedPlayers[playerIndex] };
  },

  async generateEntityOpening(
    worldDescription: string,
    sheet: EntitySheet,
    mainContext: string,
    language: Language = 'en',
    settings?: WorldSettings,
    streamId?: string
  ): Promise<string> {
    // Reusing existing logic but mapped to sheet
    let dynamicStyleInstructions = 'Standard DM Style';
    if (settings?.dmStyle) {
      const instruction = formatDmInstruction(settings.dmStyle);
      dynamicStyleInstructions = `DYNAMIC STYLE ADJUSTMENTS:\n${instruction}`;
    }

    const c = sheet as PopulatedEntitySheet;

    // Safety check for race name
    let raceName = 'Unknown';
    if (typeof c.race === 'string') raceName = c.race;
    else if (c.race && typeof c.race === 'object' && 'name' in c.race)
      raceName = (c.race as { name: string }).name || 'Unknown';

    // Safety check for class name
    let className = 'Unknown Class';
    if (c.characterClass) className = c.characterClass;
    else if (c.classes && Array.isArray(c.classes) && c.classes.length > 0) {
      const cls = c.classes[0].class;
      if (typeof cls === 'string') className = cls;
      else if (cls && typeof cls === 'object' && 'name' in cls)
        className = (cls as { name: string }).name || 'Unknown Class';
    } else if (typeof c.class === 'string') className = c.class;
    else if (c.class && typeof c.class === 'object' && 'name' in c.class)
      className = (c.class as { name: string }).name || 'Unknown Class';

    if (className === 'Unknown Class' && c.characterClass) className = c.characterClass;

    const charSummary = `Name: ${sheet.name}
Race: ${raceName}
Class: ${className}
Background: ${sheet.backstory || 'Unknown'} // Backstory was mapped from background
Snippet: ${sheet.backstory ? sheet.backstory.substring(0, 300) + '...' : 'None provided'}
Personality: ${c.personality?.traits || ''} ${c.personality?.ideals || ''}
Attributes: STR ${c.attributes?.Strength || 10}, DEX ${c.attributes?.Dexterity || 10}, INT ${c.attributes?.Intelligence || 10}, WIS ${c.attributes?.Wisdom || 10}, CHA ${c.attributes?.Charisma || 10}`;

    const defaultSystem = `You are the Dungeon Master (DM) writing a private opening vignette for a specific character.

${dynamicStyleInstructions}

WORLD CONTEXT:
${worldDescription}

MAIN ADVENTURE HOOK:
${mainContext}

TARGET CHARACTER:
${charSummary}

GOAL:
Write a deeply personal, sensory-rich opening that bridges their backstory to the current moment.
Focus on their internal state, their unique perception, and their immediate surroundings.`;

    let systemPrompt = await getPrompt('character_opening_system', language, defaultSystem);

    if (systemPrompt.includes('{{worldContext}}')) {
      systemPrompt = formatPrompt(systemPrompt, {
        dmStyle: dynamicStyleInstructions,
        worldContext: worldDescription,
        mainContext: mainContext,
        characterSummary: charSummary,
      });
    } else if (systemPrompt.includes('{{worldDescription}}')) {
      systemPrompt = formatPrompt(systemPrompt, { worldDescription, mainContext });
    }

    const defaultUser = `Generate a personalized opening for ${sheet.name} (${raceName} ${className}).
Synchronize with the Main Context.
Describe sensory details, internal state, and prepare for reaction.
Start with ### Through ${sheet.name}'s Eyes`;

    let userPrompt = await getPrompt('character_opening_user', language, defaultUser);
    if (userPrompt.includes('{{characterName}}')) {
      userPrompt = formatPrompt(userPrompt, {
        characterName: sheet.name,
        characterRace: raceName,
        characterClass: className,
      });
    }

    return generateText(systemPrompt, userPrompt, language, { metadata: { streamId } });
  },

  async generateMainOpening(
    worldDescription: string,
    players: Player[],
    language: Language = 'en',
    settings?: WorldSettings,
    streamId?: string
  ): Promise<string> {
    let dynamicStyleInstructions = 'Standard DM Style';
    if (settings?.dmStyle) {
      const instruction = formatDmInstruction(settings.dmStyle);
      dynamicStyleInstructions = `DYNAMIC STYLE ADJUSTMENTS:\n${instruction}`;
    }

    const partyContext =
      players.length > 0
        ? players
            .map((p) => {
              // Note: Refactoring to check p.characterSheet instead of p.character if possible, or assume p.character was removed
              const c = p.characterSheet as unknown as PopulatedEntitySheet | undefined;
              if (!c) return `- ${p.name}: (No Character Sheet)`;

              const rName =
                c.race && typeof c.race === 'object' && 'name' in c.race
                  ? (c.race as { name: string }).name
                  : (c.race as string) || 'Unknown';
              const cName =
                c.classes && Array.isArray(c.classes) && c.classes.length > 0
                  ? (() => {
                      const cls = c.classes[0].class;
                      return cls && typeof cls === 'object' && 'name' in cls
                        ? (cls as { name: string }).name
                        : (cls as string) || 'Unknown';
                    })()
                  : c.characterClass || (c.class as string) || 'Unknown';

              // Description from EntitySheet or Entity?
              const desc = (c as unknown as { description?: string }).description || 'A brave adventurer';

              return `- ${c.name} (${rName} ${cName}): ${desc}`;
            })
            .join('\n')
        : 'A group of adventurers form.';

    const defaultSystem = `You are the Dungeon Master (DM) starting a new D&D 5e campaign.

${dynamicStyleInstructions}

WORLD CONTEXT:
${worldDescription}

THE PARTY:
${partyContext}

GOAL:
Write a compelling, public opening narration that welcomes the players to the world.
Establish the atmosphere, the immediate setting, and why they are here.`;

    let systemPrompt = await getPrompt('main_opening_system', language, defaultSystem);

    if (systemPrompt.includes('{{worldContext}}')) {
      systemPrompt = formatPrompt(systemPrompt, {
        dmStyle: dynamicStyleInstructions,
        worldContext: worldDescription,
        partyContext: partyContext,
      });
    }

    const defaultUser = `Based on: ${worldDescription}
Write a 2-3 paragraph opening.
1. Grounded Start
2. Party Unity
3. Inciting Incident
4. Call to Action
5. DO NOT ask questions.`;

    let userPrompt = await getPrompt('main_opening_user', language, defaultUser);
    if (userPrompt.includes('{{worldDescription}}')) {
      userPrompt = formatPrompt(userPrompt, { worldDescription });
    }

    return generateText(systemPrompt, userPrompt, language, { metadata: { streamId } });
  },
});
