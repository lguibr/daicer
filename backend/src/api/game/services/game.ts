/**
 * Game logic service - world generation and turn processing
 * Ported to Strapi
 */

import { factories } from '@strapi/strapi';
import { getLLMModel } from '../../../config/langchain';
import { uploadBase64Image } from '../../../utils/upload';
import type {
  WorldSettings,
  Player,
  Creature,
  Message,
  Language,
  CharacterSheet,
  DMStyle,
  ScaleLevel,
} from '../../../types/index';
import { z } from 'zod';
import { generateText } from '../../../utils/llm';
import { generateStructured } from '../../../utils/llm/structured';
import { getPrompt, formatPrompt } from '../../../utils/prompt';
// import { getRuleContext } from '../../../utils/rag'; // TODO: precise path if implemented

// Stub for RAG
async function getRuleContext(query: string, limit: number): Promise<string> {
  return '';
}

const VERBOSITY_DESCRIPTORS: Record<ScaleLevel, string> = {
  0: 'Deliver crisp headline summaries; keep narration to essential beats.',
  1: 'Speak in short bursts that hit key sensory notes while staying brisk.',
  2: 'Balance concise narration with a handful of atmospheric details.',
  3: 'Weave story-driven paragraphs with recurring hooks and callbacks.',
  4: 'Lean into rich language, metaphor, and evocative cadence.',
  5: 'Craft epic narration with layered description and dramatic pacing.',
  6: 'Unleash operatic storytelling fit for bardic sagas and legendary chronicles.',
};

const DETAIL_DESCRIPTORS: Record<ScaleLevel, string> = {
  0: 'Prioritise mechanical clarity; pare down to tactical essentials.',
  1: 'Highlight only the props, hazards, and clues the party must see.',
  2: 'Blend mechanical stakes with a handful of sensory anchors.',
  3: 'Balance environmental description with rule-focused insight.',
  4: 'Layer textures, sounds, and histories into every scene.',
  5: 'Immerse players with nuanced lore, mood, and symbolism.',
  6: 'Paint cinematic tableaux dense with cultural and emotional context.',
};

const ENGAGEMENT_DESCRIPTORS: Record<ScaleLevel, string> = {
  0: 'Stay observational; deliver outcomes with minimal prompting.',
  1: 'Invite player decisions at inflection points but keep a light touch.',
  2: 'Check in routinely for intentions, reactions, and table talk.',
  3: 'Co-author moments; spotlight teamwork and shared discovery.',
  4: 'Seed dilemmas, rivalries, and cliff-hangers that demand responses.',
  5: 'Escalate dramatic tension and rotate the spotlight deliberately.',
  6: 'Fully immerse the party with in-character dialogue and emotive beats.',
};

const NARRATIVE_DESCRIPTORS: Record<ScaleLevel, string> = {
  0: 'Let the party define the arc; you react swiftly to their initiatives.',
  1: 'Offer scattered threads and let players braid them together.',
  2: 'Blend branching choices with gentle narrative nudges.',
  3: 'Maintain balanced arcs with equal agency and plotted beats.',
  4: 'Guide scenes with clear stakes and recurring NPC agendas.',
  5: 'Engineer planned twists and episodic crescendos.',
  6: 'Author a sweeping saga with foreshadowed climaxes and mythic structure.',
};

// Helper to format DM style into a readable summary for the LLM
function formatDmStyle(style) {
  if (!style) return 'Standard DM Style';

  // We can duplicate the maps here or just use simple descriptors
  // For simplicity and decoupling, I'll use direct descriptors here.
  const verbosityMap = ['Whisper (Minimal)', 'Terse', 'Measured', 'Storied', 'Lyrical', 'Epic', 'Operatic (Grand)'];
  const detailMap = ['Minimal', 'Lean', 'Focused', 'Balanced', 'Textured', 'Immersive', 'Cinematic'];
  const engagementMap = ['Observer', 'Facilitator', 'Guide', 'Collaborator', 'Showrunner', 'Auteur', 'Oracle'];
  const narrativeMap = ['Sandbox', 'Reactive', 'Responsive', 'Structured', 'Plotted', 'Storied', 'Authored'];

  const summary = [
    `- Verbosity: ${verbosityMap[style.verbosity] || 'Normal'}`,
    `- Detail: ${detailMap[style.detail] || 'Normal'}`,
    `- Engagement: ${engagementMap[style.engagement] || 'Normal'}`,
    `- Narrative Control: ${narrativeMap[style.narrative] || 'Normal'}`,
    style.specialMode ? `- Performance Mode: ${style.specialMode}` : null,
    style.customDirectives ? `- Custom Directives: "${style.customDirectives}"` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return summary;
}

export default ({ strapi }) => ({
  async generateWorld(settings: WorldSettings, language: Language = 'en'): Promise<string> {
    const { WorldDescriptionSchema } = await import('../../../schemas/agent-responses');

    const systemPromptDefault = `You are a world-class Dungeon Master creating immersive RPG campaign backgrounds.
Create rich, detailed world descriptions with structured metadata.`;

    const userPromptDefault = `Generate a campaign world description based on these parameters:

**Campaign Scope:**
- **Players:** ${settings.playerCount}
- **Adventure Length:** ${settings.adventureLength}
- **Difficulty:** ${settings.difficulty}
- **Starting Level:** ${settings.startingLevel || 1}

**World Settings:**
- **Archetype:** ${settings.worldType || 'Generic'}
- **Size:** ${settings.worldSize || 'Medium'}
- **Theme:** ${settings.theme}
- **Setting:** ${settings.setting}
- **Tone:** ${settings.tone}

**Requirements:**
- Create a catchy campaign title
- Write a rich 2-3 paragraph description using markdown formatting
- Capture the atmosphere in one sentence
- Identify 2-4 key locations with brief descriptions
- List primary threats or antagonistic forces
- **Call to Adventure**: Explicitly state why the party is together and what their immediate goal is.
- **Risks & Stakes**: Clearly define what happens if they fail.
- Provide 2-3 adventure hooks to draw players in`;

    // Try to fetch prompts from CMS
    // Note: User prompt dynamic injection is tricky if fetched as static string.
    // We will use the fetched string as a base and replace placeholders if we had them,
    // but for now, we'll stick to the default dynamic construction for the USER prompt
    // and only fetch the SYSTEM prompt to avoid template complexity.

    const systemPrompt = await getPrompt('world_generation_system', language, systemPromptDefault);

    let userPrompt = await getPrompt('world_generation_user', language, userPromptDefault);

    // Format the User Prompt with Settings
    if (userPrompt.includes('{{theme}}')) {
      userPrompt = formatPrompt(userPrompt, {
        playerCount: String(settings.playerCount),
        adventureLength: String(settings.adventureLength),
        difficulty: String(settings.difficulty),
        startingLevel: String(settings.startingLevel || 1),
        worldType: String(settings.worldType || 'Generic'),
        worldSize: String(settings.worldSize || 'Medium'),
        theme: settings.theme,
        setting: settings.setting,
        tone: settings.tone,
        dmStyleSummary: formatDmStyle(settings.dmStyle),
      });
    }

    strapi.log.info('Generating world description');

    const worldData = await generateStructured(WorldDescriptionSchema, systemPrompt, userPromptDefault, language, {
      tags: ['world-generation', `theme:${settings.theme}`],
      metadata: { settings },
    });

    strapi.log.info('World description generated successfully');

    // Format as markdown
    const formattedDescription = `# ${worldData.title}

${worldData.description}

*${worldData.atmosphere}*

## Key Locations

${worldData.keyLocations.map((loc: any) => `**${loc.name}**: ${loc.description}`).join('\n\n')}

## Threats

${worldData.threats.map((threat: any) => `- ${threat}`).join('\n')}

## Call to Adventure & Stakes

**Why you are here:** ${worldData.hooks[0] || 'Fate has brought you together.'}

**The Risks:** The world is in peril, and failure could mean doom.

## Adventure Hooks

${worldData.hooks.map((hook: any, i: number) => `${i + 1}. ${hook}`).join('\n')}`;

    return formattedDescription;
  },

  async processTurn(
    worldDescription: string,
    messages: Message[],
    players: Player[],
    creatures: Creature[],
    language: Language = 'en',
    settings?: WorldSettings,
    worldConditions?: any[], // Typed as any for now
    mapContext?: string,
    streamId?: string
  ) {
    const { TurnResponseSchema } = await import('../../../schemas/agent-responses');

    const languageMap: Record<Language, string> = {
      en: 'English',
      es: 'Spanish',
      'pt-BR': 'Brazilian Portuguese',
    };
    const languageName = languageMap[language] || 'English';

    // Build DM instruction
    const dmStyle = settings?.dmStyle;

    const playerSummaries = players
      .map((p) => {
        const char = p.character as any; // Cast to any to avoid partial type mismatch
        if (!char) return `- ${p.name} (No character sheet)`;
        return `- ${char.name} (${char.race?.name || 'Unknown Race'} ${char.class?.name || 'Unknown Class'}) | HP: ${char.baseStats?.hp || 10}/${char.baseStats?.maxHp || 10}`;
      })
      .join('\n');

    const creatureSummaries = creatures.map((c) => `- ${c.name}, HP: ${c.hp}/${c.maxHp}`).join('\n');
    let worldConditionsText = ''; // stub

    // Style Instructions
    let dynamicStyleInstructions = 'Standard DM Style';
    if (dmStyle) {
      dynamicStyleInstructions = `DYNAMIC STYLE ADJUSTMENTS:\n${formatDmStyle(dmStyle)}`;
    }

    const systemPromptDefault = `You are the Dungeon Master (DM) for a D&D 5e adventure.
Your goal is to run a thrilling, immersive, and fair game.

{{dmStyle}}

WORLD CONTEXT:
{{worldContext}}

CURRENT PARTY:
{{partyContext}}

ACTIVE CREATURES/NPCs:
{{creaturesContext}}

CRITICAL: TEAMWORK & PARTY COHESION:
- This is a TEAM adventure - the party works TOGETHER
- Create situations that require cooperation and reward working as a group

FORMATTING RULES - EXTREMELY IMPORTANT:
You MUST use rich markdown formatting in your narrative.`;

    const basePrompt = await getPrompt('dm_system_instruction', language, systemPromptDefault);

    // Format the System Prompt
    const worldLore = [settings?.worldBackground?.trim(), worldDescription, worldConditionsText]
      .filter(Boolean)
      .join('\n\n');

    let systemPrompt = basePrompt;
    if (systemPrompt.includes('{{dmStyle}}')) {
      systemPrompt = formatPrompt(systemPrompt, {
        dmStyle: dynamicStyleInstructions,
        worldContext: worldLore,
        partyContext: playerSummaries,
        creaturesContext: creatureSummaries || 'None currently active.',
      });
    } else {
      // Fallback for old prompt structure or if template vars missing (append logic)
      systemPrompt = `${systemPrompt}\n\n${dynamicStyleInstructions}\n\nWORLD CONTEXT:\n${worldLore}\n\nCURRENT PARTY:\n${playerSummaries}\n\nACTIVE CREATURES:\n${creatureSummaries || 'None'}`;
    }

    // Build conversation
    const conversationHistory = messages.map((msg) => `${msg.sender}: ${msg.text}`).join('\n\n');
    const currentActions = players
      .filter((p) => p.action && p.character)
      .map((p) => `${p.character!.name}: ${p.action}`)
      .join('\n');

    // RAG
    let relevantRules = '';
    try {
      relevantRules = await getRuleContext(currentActions || 'general gameplay', 3);
    } catch (e) {
      strapi.log.warn('RAG failed', e);
    }

    const fullPrompt = `${systemPrompt}

${relevantRules ? `RELEVANT D&D 5E RULES:\n${relevantRules}\n\n` : ''}You MUST respond with a structured JSON object containing:
- overall_summary (string): An overall summary
- player_perspectives (array): Personalized perspectives

PREVIOUS STORY:
${conversationHistory}

${mapContext ? `MAP CONTEXT:\n${mapContext}\n` : ''}
CURRENT TURN ACTIONS:
${currentActions}

As the Dungeon Master, narrate what happens. First, provide an 'overall_summary'. Then, provide 'player_perspectives'.
Respond entirely in ${languageName}.`;

    strapi.log.info('Processing turn with LLM');

    // We use dynamic import for schema to avoid circular deps if any, though here it's fine
    const response = await generateStructured(TurnResponseSchema, systemPrompt, fullPrompt, language, {
      metadata: { streamId },
    });

    return {
      ...response,
      metadata: {
        ragContext: relevantRules,
      },
    };
  },

  async generateCharacterOpening(
    worldDescription: string,
    character: CharacterSheet,
    mainContext: string,
    language: Language = 'en',
    settings?: WorldSettings, // Added settings for DM Style
    streamId?: string
  ): Promise<string> {
    // Format DM Style
    let dynamicStyleInstructions = 'Standard DM Style';
    if (settings?.dmStyle) {
      dynamicStyleInstructions = `DYNAMIC STYLE ADJUSTMENTS:\n${formatDmStyle(settings.dmStyle)}`;
    }

    // Format Character Summary
    // Cast to any to avoid TS errors with complex/dynamic component types
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

    // Inject Variables
    if (systemPrompt.includes('{{worldContext}}')) {
      systemPrompt = formatPrompt(systemPrompt, {
        dmStyle: dynamicStyleInstructions,
        worldContext: worldDescription,
        mainContext: mainContext,
        characterSummary: charSummary,
      });
    } else if (systemPrompt.includes('{{worldDescription}}')) {
      // Legacy Fallback
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
    // Format DM Style
    let dynamicStyleInstructions = 'Standard DM Style';
    if (settings?.dmStyle) {
      dynamicStyleInstructions = `DYNAMIC STYLE ADJUSTMENTS:\n${formatDmStyle(settings.dmStyle)}`;
    }

    // Format Party Context
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

    // Inject Variables
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
  async addCharacter(roomId: string, characterData: any, user: any) {
    // 1. Fetch Room with populated players
    const filters: any[] = [{ documentId: roomId }, { roomId: roomId }];
    if (!isNaN(Number(roomId))) {
      filters.push({ id: Number(roomId) });
    }

    const rooms = await strapi.documents('api::room.room').findMany({
      filters: { $or: filters },
      populate: ['players', 'players.user', 'players.character'], // Populate Component relations
    });

    if (!rooms || rooms.length === 0) {
      throw new Error('Room not found');
    }
    const room = rooms[0] as any;
    const players = room.players || [];

    // 2. Process Avatar Uploads (keep existing logic but returns URLs)
    const avatarSlots = ['portrait', 'upperBody', 'fullBody'];
    const processedAvatarPreview = { ...characterData.avatarPreview };

    if (processedAvatarPreview) {
      for (const slot of avatarSlots) {
        if (processedAvatarPreview[slot] && processedAvatarPreview[slot].data) {
          try {
            const base64 = `data:${processedAvatarPreview[slot].mimeType};base64,${processedAvatarPreview[slot].data}`;
            const filename = `avatar-${user.id}-${slot}-${Date.now()}`;
            const uploadResult = await uploadBase64Image(base64, filename);
            if (uploadResult) {
              // Update processed data with ID/URL
              // Note: Schema expects media relations? Or JSON for preview?
              // Character schema has 'portrait', 'fullBody' as relations.
              // We need to link the ID.
              processedAvatarPreview[slot] = {
                id: uploadResult.id, // Keep ID for relation linking
                url: uploadResult.url,
              };
            }
          } catch (err) {
            console.error(`Failed to upload ${slot} avatar:`, err);
          }
        }
      }
    }

    // 3. Create Character Entity

    // Lookup Race and Class IDs
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
    // Frontend sends 'characterClass', backend schema expects 'class' relation
    const className = characterData.characterClass || characterData.class;
    if (className) {
      const classes = await strapi.documents('api::class.class').findMany({
        filters: { name: className },
      });
      if (classes && classes.length > 0) {
        classId = classes[0].documentId;
      }
    }

    // Map attributes (Capitalized) to stats (lowercase)
    const rawStats = characterData.baseStats || characterData.attributes || {};

    // DEBUG LOGGING
    console.log('-------------------------------------------');
    console.log('ADD CHARACTER DEBUG');
    console.log('Incoming characterData keys:', Object.keys(characterData));
    console.log('Incoming attributes:', characterData.attributes);
    console.log('Incoming baseStats:', characterData.baseStats);
    console.log('Derived rawStats:', rawStats);
    console.log('-------------------------------------------');

    const baseStats = {
      strength: Number(rawStats.Strength || rawStats.strength || 10),
      dexterity: Number(rawStats.Dexterity || rawStats.dexterity || 10),
      constitution: Number(rawStats.Constitution || rawStats.constitution || 10),
      intelligence: Number(rawStats.Intelligence || rawStats.intelligence || 10),
      wisdom: Number(rawStats.Wisdom || rawStats.wisdom || 10),
      charisma: Number(rawStats.Charisma || rawStats.charisma || 10),
    };
    console.log('Final baseStats:', baseStats);
    console.log('-------------------------------------------');

    const createdCharacter = await strapi.documents('api::character.character').create({
      data: {
        name: characterData.name,
        race: raceId,
        class: classId,
        backstory: characterData.backstory || characterData.background, // Frontend sends 'background', schema has 'backstory'
        appearance: characterData.appearance,
        equipment: characterData.equipment,
        user: user.documentId,
        baseStats: baseStats,
        // Media relations
        portrait: processedAvatarPreview?.portrait?.id,
        upperBody: processedAvatarPreview?.upperBody?.id,
        fullBody: processedAvatarPreview?.fullBody?.id,
      },
      status: 'published',
    });

    // 4. Update Room Player Component
    // Find the player entry for this user
    const playerIndex = players.findIndex((p: any) => p.user?.documentId === user.documentId || p.user?.id === user.id);

    if (playerIndex === -1) {
      throw new Error('User is not a player in this room');
    }

    const updatedPlayers = [...players];
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      character: createdCharacter.documentId, // Link the new character
      isReady: true,
      // name: characterData.name // Optional: update display name?
    };

    // Update room
    await strapi.documents('api::room.room').update({
      documentId: room.documentId,
      data: {
        players: updatedPlayers,
      },
    });

    return { character: createdCharacter, player: updatedPlayers[playerIndex] };
  },

  async startGame(roomId: string, language: Language = 'en') {
    const filters: any[] = [{ documentId: roomId }, { roomId: roomId }];
    if (!isNaN(Number(roomId))) {
      filters.push({ id: Number(roomId) });
    }

    const rooms = await strapi.documents('api::room.room').findMany({
      filters: {
        $or: filters,
      },
      populate: ['players', 'players.character', 'players.character.baseStats'],
    });

    if (!rooms || rooms.length === 0) {
      console.error('Room not found for identifier: ' + roomId);
      throw new Error('Room not found');
    }
    const room = rooms[0] as any;

    // Generate Opening
    const mainOpening = await this.generateMainOpening(
      room.worldDescription,
      room.players || [],
      language,
      room.settings
    );

    // Create CharacterSheets for all players
    const players = room.players || [];
    const updatedPlayers = [...players]; // Clone to update locally before save (if needed, but we update via side-effect creation?)
    // Actually we need to update the Room's player component to point to the new Sheet.
    // This requires updating the Room entity again.

    let playersUpdated = false;

    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (p.character && p.character.documentId) {
        // Check if sheet already exists? Assuming new game = new sheets or reset
        // For now, duplicate character stats to sheet
        // We need full character details. 'p.character' might be partial if not deep populated?
        // It was populated in getRoom/findMany call at start of function...

        const char = p.character as any;
        const newSheet = await strapi.documents('api::character-sheet.character-sheet').create({
          data: {
            character: char.documentId,
            room: room.documentId,
            currentHp: char.baseStats?.hp || 10,
            maxHp: char.baseStats?.maxHp || 10,
            level: 1, // Default or derived
            experience: 0,
            stats: char.baseStats, // Copy component data
            // Copy new fields
            race: char.race?.documentId,
            class: char.class?.documentId,
            appearance: char.appearance,
            backstory: char.backstory,
            // If character had equipment in recent update, copy it?
            // Character schema has 'equipment' (json). Sheet has 'inventory' (json).
            // We can init inventory from character equipment if desired.
            inventory: char.equipment || [], // Copy component list directly
          },
          status: 'published',
        });

        // Link sheet to player
        if (updatedPlayers[i]) {
          updatedPlayers[i] = {
            ...updatedPlayers[i],
            characterSheet: newSheet.documentId,
          };
          playersUpdated = true;
        }
      }
    }

    // ... (previous logic for character sheets) ...
    // Note: We need to update history AND phase.

    // Create Message Object
    const message = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      sender: 'DM',
      text: mainOpening,
      timestamp: Date.now(),
      type: 'narration',
    };

    // Get current history to append
    // We already fetched room with fields? 'history' might not be populated if it's a JSON field, but JSON fields are usually returned.
    // 'history' is not in the findMany populate list in startGame!
    // We must ensure logic handles it.

    const existingHistory = Array.isArray(room.history) ? room.history : [];
    const newHistory = [...existingHistory, message];

    // Final Update
    const updatedRoomData = {
      phase: 'gameplay',
      history: newHistory,
    };

    if (playersUpdated) {
      (updatedRoomData as any).players = updatedPlayers;
    }

    const updatedRoom = await strapi.documents('api::room.room').update({
      documentId: room.documentId,
      data: updatedRoomData,
      populate: ['players', 'players.character'], // Return populated so frontend gets fresh state if we emitted room
    });

    // Broadcast Event
    // We need streamManager. Import it at top if not present?
    // It is not imported! I need to checking imports.
    // I will use dynamic import or assume it is available if I added it?
    // Wait, I cannot add import here easily without replace_file at top.
    // I will assume `import { streamManager } from '../../../utils/llm/stream-manager';` needs to be added.

    // Emit 'game:start' which frontend listens to.
    const { streamManager } = await import('../../../utils/llm/stream-manager');
    streamManager.broadcast(roomId, 'game:start', {
      room: updatedRoom, // Send updated room with phase 'gameplay'
      text: mainOpening,
      sender: 'DM',
      timestamp: message.timestamp,
    });

    // Also emit 'gameState' to force full sync?
    // 'game:start' usually handles the transition text.
    // But sending 'message:new' ensures it's added to chat if 'game:start' is just a notification?
    // Frontend onGameStart: (data) => sets state.messages.push(...)
    // So distinct event is good.

    return {
      text: mainOpening,
      sender: 'DM',
      timestamp: message.timestamp,
    };
  },

  async getRoom(roomId: string) {
    const filters: any[] = [{ documentId: roomId }, { roomId: roomId }];
    if (!isNaN(Number(roomId))) {
      filters.push({ id: Number(roomId) });
    }

    const rooms = await strapi.documents('api::room.room').findMany({
      filters: {
        $or: filters,
      },
      // Populate necessary relations including nested character data for Sheet creation
      populate: [
        'players',
        'players.character',
        'players.character.baseStats',
        'players.character.race',
        'players.character.class',
        'players.characterSheet',
      ],
    });

    if (!rooms || rooms.length === 0) {
      return null;
    }
    return rooms[0];
  },

  async spawnCreature(roomId: string, creatureData: any) {
    const filters: any[] = [{ documentId: roomId }, { roomId: roomId }];
    if (!isNaN(Number(roomId))) {
      filters.push({ id: Number(roomId) });
    }

    const rooms = await strapi.documents('api::room.room').findMany({
      filters: {
        $or: filters,
      },
    });

    if (!rooms || rooms.length === 0) {
      throw new Error('Room not found');
    }
    const room = rooms[0] as any;
    const creatures = room.creatures || [];

    const newCreature = {
      id: `creature-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...creatureData,
      hp: creatureData.hp || creatureData.maxHp || 10,
      maxHp: creatureData.maxHp || 10,
    };

    await strapi.documents('api::room.room').update({
      documentId: room.documentId,
      data: {
        creatures: [...creatures, newCreature],
      },
    });

    return newCreature;
  },
});
