import { generateText } from '../../../utils/llm';
import { getPrompt, formatPrompt } from '../../../utils/prompt';
import { uploadBase64Image } from '../../../utils/upload';
import { createCharacterSnapshot, formatDmInstruction } from '@daicer/engine';
import type { WorldSettings, Player, CharacterSheet, Language } from '@daicer/engine';

// Helper to format DM style

export default ({ strapi }) => ({
  createSnapshot(characterSheets: unknown[]) {
    const snapshot: Record<string, any> = {};
    for (const sheet of characterSheets) {
      const s = sheet as { documentId: string; [key: string]: any };
      if (s && s.documentId) {
        const snap = createCharacterSnapshot(s);
        if (snap) {
          snapshot[s.documentId] = snap;
        }
      }
    }
    return snapshot;
  },

  async addCharacter(roomId: string, characterData: any, user: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // 1. Fetch Room with populated players
    const filters: any[] = [{ documentId: roomId }, { roomId: roomId }];
    if (!isNaN(Number(roomId))) {
      filters.push({ id: Number(roomId) });
    }

    const rooms = await strapi.documents('api::room.room').findMany({
      filters: { $or: filters },
      populate: ['players', 'players.user', 'players.character'],
    });

    if (!rooms || rooms.length === 0) {
      throw new Error('Room not found');
    }
    const room = rooms[0] as unknown as {
      players: Player[];
      documentId: string;
    };
    const players = room.players || [];

    // 2. Process Avatar Uploads
    const avatarSlots = ['portrait', 'upperBody', 'fullBody'];
    const processedAvatarPreview = { ...characterData.avatarPreview };

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

    // 3. Create Character Entity
    let raceId = null;
    if (characterData.race) {
      const races = await strapi.documents('api::race.race').findMany({
        filters: { name: characterData.race },
      });
      if (races && races.length > 0) {
        raceId = races[0].documentId;
      }
    }

    let classId = null;
    const className = characterData.characterClass || characterData.class;
    if (className) {
      const classes = await strapi.documents('api::class.class').findMany({
        filters: { name: className },
      });
      if (classes && classes.length > 0) {
        classId = classes[0].documentId;
      }
    }

    const rawStats = characterData.baseStats || characterData.attributes || {};
    const baseStats = {
      strength: Number(rawStats.Strength || rawStats.strength || 10),
      dexterity: Number(rawStats.Dexterity || rawStats.dexterity || 10),
      constitution: Number(rawStats.Constitution || rawStats.constitution || 10),
      intelligence: Number(rawStats.Intelligence || rawStats.intelligence || 10),
      wisdom: Number(rawStats.Wisdom || rawStats.wisdom || 10),
      charisma: Number(rawStats.Charisma || rawStats.charisma || 10),
    };

    const createdCharacter = await strapi.documents('api::character.character').create({
      data: {
        name: characterData.name,
        race: raceId,
        class: classId,
        backstory: characterData.backstory || characterData.background,
        appearance: characterData.appearance,
        equipment: characterData.equipment,
        user: user.documentId,
        baseStats: baseStats,
        portrait: processedAvatarPreview?.portrait?.id,
        upperBody: processedAvatarPreview?.upperBody?.id,
        fullBody: processedAvatarPreview?.fullBody?.id,
      },
      status: 'published',
    });

    // 4. Update Room Player Component
    const playerIndex = players.findIndex((p: any) => p.user?.documentId === user.documentId || p.user?.id === user.id);

    if (playerIndex === -1) {
      throw new Error('User is not a player in this room');
    }

    const updatedPlayers = [...players];
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      character: createdCharacter.documentId,
      isReady: true,
      name: characterData.name,
    };

    await strapi.documents('api::room.room').update({
      documentId: room.documentId,
      data: {
        players: updatedPlayers,
      },
    });

    return { character: createdCharacter, player: updatedPlayers[playerIndex] };
  },

  async generateCharacterOpening(
    worldDescription: string,
    character: CharacterSheet,
    mainContext: string,
    language: Language = 'en',
    settings?: WorldSettings,
    streamId?: string
  ): Promise<string> {
    let dynamicStyleInstructions = 'Standard DM Style';
    if (settings?.dmStyle) {
      const instruction = formatDmInstruction(settings.dmStyle);
      dynamicStyleInstructions = `DYNAMIC STYLE ADJUSTMENTS:\n${instruction}`;
    }

    const c = character as any;
    const charSummary = `Name: ${character.name}
Race: ${c.race?.name || character.race || 'Unknown'}
Class: ${c.class?.name || (character as any).characterClass || 'Unknown'}
Background: ${character.background || 'Unknown'}
Backstory Snippet: ${character.backstory ? character.backstory.substring(0, 300) + '...' : 'None provided'}
Personality: ${character.personality?.traits || ''} ${character.personality?.ideals || ''}
Attributes: STR ${c.baseStats?.strength || 10}, DEX ${c.baseStats?.dexterity || 10}, INT ${c.baseStats?.intelligence || 10}, WIS ${c.baseStats?.wisdom || 10}, CHA ${c.baseStats?.charisma || 10}`;

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

    const defaultUser = `Generate a personalized opening for ${character.name} (${character.race} ${character.characterClass || (character as any).class?.name || 'Unknown Class'}).
Synchronize with the Main Context.
Describe sensory details, internal state, and prepare for reaction.
Start with ### Through ${character.name}'s Eyes`;

    let userPrompt = await getPrompt('character_opening_user', language, defaultUser);
    if (userPrompt.includes('{{characterName}}')) {
      userPrompt = formatPrompt(userPrompt, {
        characterName: character.name,
        characterRace: ((character as any).race as any)?.name || character.race || 'Unknown',
        characterClass: ((character as any).class as any)?.name || (character.characterClass as string) || 'Unknown',
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
              const c = p.character as any;
              if (!c) return `- ${p.name}: (No Character)`;
              return `- ${c.name} (${c.race?.name || c.race} ${c.class?.name || c.characterClass}): ${c.description || 'A brave adventurer'}`;
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
