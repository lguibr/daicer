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
import { streamManager } from '../../../utils/llm/stream-manager';

// Helper to create character snapshots
const createSnapshot = (characterSheets: any[]) => {
  const snapshot: Record<string, any> = {};
  for (const sheet of characterSheets) {
    if (sheet && sheet.documentId) {
      snapshot[sheet.documentId] = {
        hp: sheet.currentHp,
        maxHp: sheet.maxHp,
        stats: sheet.stats,
        inventory: sheet.inventory,
        level: sheet.level,
        experience: sheet.experience,
        position: sheet.position,
        // Add other volatile fields
      };
    }
  }
  return snapshot;
};

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
    roomId: string,
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

    // Broadcast Processing Start
    const { streamManager } = await import('../../../utils/llm/stream-manager');
    // Using roomId (typically Code in Strapi 5 fallback logic, but let's be safe and try to conform to room doc/code)
    // We passed roomId. The service assumes it's valid.
    streamManager.broadcast(roomId, 'turn:processing', { roomId });

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

    // --- PERSISTENCE & BROADCASTING ---

    // 1. Fetch Room with Character Sheets for Snapshot
    const roomWithSheets = await strapi.documents('api::room.room').findOne({
      documentId: roomId, // Assuming roomId passed to function IS the documentId, based on usage
      populate: ['character_sheets'],
    });

    if (!roomWithSheets) throw new Error('Room not found for persistence');

    // 2. Determine Turn Number
    // Count existing turns
    const turnCount = await strapi.documents('api::turn.turn').count({
      filters: { room: { documentId: roomWithSheets.documentId } },
    });
    const newTurnNumber = turnCount; // 0-indexed or 1-indexed? If count is 1 (Start), next is 1. Start is 0.

    // 3. Create Turn Entity (Processing -> Complete)
    // We do it in one go for now, or we could create 'processing' at start of func.
    // Let's create it as Complete since generation is done.

    const snapshot = createSnapshot(roomWithSheets.character_sheets || []);

    const newTurn = await strapi.documents('api::turn.turn').create({
      data: {
        turnNumber: newTurnNumber,
        room: roomWithSheets.documentId,
        narrative: response.overall_summary,
        status: 'complete',
        type: 'group', // Default to group for now, can be passed in args later
        actions: players.filter((p) => p.action).map((p) => ({ user: p.userId, action: p.action })), // Persist actions
        characterSnapshots: snapshot,
        metadata: {
          model: 'llm',
          ragUsed: !!relevantRules,
        },
      },
      status: 'published',
    });

    // 4. Create Response Message
    const newMessage = await strapi.documents('api::message.message').create({
      data: {
        content: response.overall_summary,
        senderName: 'DM',
        senderType: 'dm',
        room: roomWithSheets.documentId,
        turn: newTurn.documentId,
        timestamp: Date.now(), // Store as BigInt compatible? Schema said BigInt.
      },
      status: 'published',
    });

    // 5. Clear Player Actions in Room
    const updatedPlayers = players.map((p) => ({
      ...p,
      action: null,
      isReady: false,
    }));

    await strapi.documents('api::room.room').update({
      documentId: roomWithSheets.documentId,
      data: {
        players: updatedPlayers,
      } as any,
    });

    // 6. Broadcast
    // Emit message (frontend expects Message object structure)
    // We map backend entity to frontend interface if needed, or send raw
    const socketMessage = {
      id: newMessage.documentId,
      sender: 'DM',
      text: newMessage.content,
      timestamp: Number(newMessage.timestamp), // Convert BigInt to number for JSON
      type: 'narration',
      metadata: {
        perspectives: response.player_perspectives,
        turnId: newTurn.documentId,
      },
    };

    streamManager.broadcast(roomWithSheets.roomId, 'message:new', socketMessage);
    if (roomWithSheets.documentId !== roomWithSheets.roomId) {
      streamManager.broadcast(roomWithSheets.documentId, 'message:new', socketMessage);
    }

    // Emit Game Update
    streamManager.broadcast(roomWithSheets.roomId, 'game:update', { players: updatedPlayers });
    if (roomWithSheets.documentId !== roomWithSheets.roomId) {
      streamManager.broadcast(roomWithSheets.documentId, 'game:update', { players: updatedPlayers });
    }

    // Emit Turn Complete
    const turnPayload = {
      roomId: roomWithSheets.roomId,
      turn: {
        id: newTurn.documentId,
        number: newTurn.turnNumber,
        narrative: newTurn.narrative,
        snapshots: snapshot,
      },
    };
    streamManager.broadcast(roomWithSheets.roomId, 'turn:complete', turnPayload);
    if (roomWithSheets.documentId !== roomWithSheets.roomId) {
      streamManager.broadcast(roomWithSheets.documentId, 'turn:complete', turnPayload);
    }

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
            console.log(`Processing avatar upload for slot: ${slot}`);
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
              console.log(`Avatar ${slot} uploaded successfully: ${uploadResult.id}`);
            }
          } catch (err) {
            console.error(`Failed to upload ${slot} avatar:`, err);
          }
        } else if (processedAvatarPreview[slot]) {
          console.warn(
            `Avatar slot ${slot} present but missing 'data' field. content:`,
            Object.keys(processedAvatarPreview[slot])
          );
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
      name: characterData.name, // Sync player display name with character name
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

    // Create initial Turn (0)
    // We need to fetch the room with character sheets to snapshot them
    // The previous populate didn't include 'character_sheets'
    const roomWithSheets = await strapi.documents('api::room.room').findOne({
      documentId: room.documentId,
      populate: ['character_sheets'],
    });

    const snapshot = createSnapshot(roomWithSheets?.character_sheets || []);

    const turn0 = await strapi.documents('api::turn.turn').create({
      data: {
        turnNumber: 0,
        room: room.documentId,
        narrative: 'Game Start',
        status: 'complete',
        type: 'group',
        characterSnapshots: snapshot,
      },
      status: 'published',
    });

    // Create Message Object (MAIN)
    const message = await strapi.documents('api::message.message').create({
      data: {
        content: mainOpening,
        senderName: 'DM',
        senderType: 'dm',
        room: room.documentId,
        turn: turn0.documentId,
        timestamp: Date.now(),
        // No recipient = Public
      },
      status: 'published',
    });

    // Generate Private Openings for each player
    const privateMessages = [];
    if (players && players.length > 0) {
      for (const p of players) {
        if (!p.character) continue;
        const charSheet = p.character; // It's populated above as Character (from Room->Players->Character relation, not Sheet yet?)
        // Wait, room populates players.character.
        // generateCharacterOpening expects CharacterSheet interface but works with Character data mostly.

        try {
          const privateOpening = await this.generateCharacterOpening(
            room.worldDescription,
            charSheet as any, // Cast to any/CharacterSheet
            mainOpening, // Main Context
            language,
            room.settings
          );

          if (privateOpening) {
            const privMsg = await strapi.documents('api::message.message').create({
              data: {
                content: privateOpening,
                senderName: 'DM (Private)',
                senderType: 'dm',
                room: room.documentId,
                turn: turn0.documentId,
                recipient: p.user?.documentId, // Target the user
                timestamp: Date.now() + 100, // Slightly after main
              },
              status: 'published',
            });
            privateMessages.push(privMsg);
          }
        } catch (e) {
          strapi.log.error(`Failed to generate private opening for ${p.name}`, e);
        }
      }
    }

    // Final Update (Phase)
    const updatedRoomData = {
      phase: 'gameplay',
      // history: ... legacy support? Maybe nice to keep a small buffer? nah.
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
    // It is imported at top now.

    const socketMessage = {
      id: message.documentId,
      sender: 'DM',
      text: mainOpening,
      timestamp: Number(message.timestamp),
      type: 'narration',
    };

    // Broadcast to both Code and Document ID to ensure frontend receives it regardless of connection method
    streamManager.broadcast(room.roomId, 'game:start', {
      room: updatedRoom,
      text: mainOpening,
      sender: 'DM',
      timestamp: socketMessage.timestamp,
      message: socketMessage,
    });
    if (room.documentId && room.documentId !== room.roomId) {
      streamManager.broadcast(room.documentId, 'game:start', {
        room: updatedRoom,
        text: mainOpening,
        sender: 'DM',
        timestamp: socketMessage.timestamp, // Use message TS
        message: socketMessage,
      });
    }

    // Broadcast Private Messages
    for (const pm of privateMessages) {
      // We iterate our locally created array. 'pm.recipient' (User ID from creation data) should be accessible
      // if we trust the object we passed to create matches the input, or we can trust the return value structure.
      // Strapi create returns { documentId, ...attributes }. Relation fields like 'recipient' might just be the ID or object if populated.
      // Since we passed `recipient: ID`, let's assume `pm.recipient` might be null in the return object if not populated.
      // However, we know the recipient from the loop context if we really needed it, but we are outside that loop now.
      // Let's assume for now we can persist it or just use a generic user room broadcast if we had the ID.

      // CRITICAL: We need the recipient ID to broadcast to `user:ID`.
      // If `pm.recipient` is missing in the return, we faill to broadcast privately.
      // Let's rely on `pm.recipient` being present or populated.
      // To be safe, let's just log if it's missing.

      // Wait, `privateMessages` contains the RESULT of `strapi.documents(...).create`.
      // In Strapi 5, this result contains the document data.

      const recipientId = pm.recipient;

      if (recipientId) {
        const pmSocketMsg = {
          id: pm.documentId,
          sender: pm.senderName,
          text: pm.content,
          timestamp: Number(pm.timestamp),
          type: 'narration',
          recipient: recipientId, // Pass ID to frontend so it can confirm ownership?
          // Frontend receiving on `user:ID` channel knows it's private.
        };

        strapi.log.info(`Broadcasting private message to user:${recipientId}`);
        streamManager.broadcast(`user:${recipientId}`, 'message:new', pmSocketMsg);
      } else {
        strapi.log.warn(`Private message ${pm.documentId} has no recipient ID to broadcast to.`);
      }
    }

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

  async submitAction(roomId: string, action: string, user: any) {
    const filters: any[] = [{ documentId: roomId }, { roomId: roomId }];
    if (!isNaN(Number(roomId))) {
      filters.push({ id: Number(roomId) });
    }

    const rooms = await strapi.documents('api::room.room').findMany({
      filters: { $or: filters },
      populate: ['players', 'players.user'],
    });

    if (!rooms || rooms.length === 0) {
      throw new Error('Room not found');
    }
    const room = rooms[0] as any;
    const players = room.players || [];

    const userIdStr = String(user.documentId || user.id);
    let playerIndex = players.findIndex((p: any) => String(p.user?.documentId || p.user?.id) === userIdStr);

    // Fallback: Check against user.uid if available
    if (playerIndex === -1 && user.uid) {
      playerIndex = players.findIndex((p: any) => String(p.user?.uid || p.userId) === String(user.uid));
    }

    // Fallback 2: Check by mapped userId (if stored as string in component, though schema suggests otherwise)
    if (playerIndex === -1) {
      playerIndex = players.findIndex((p: any) => String(p.userId) === userIdStr);
    }

    if (playerIndex === -1) {
      console.error(
        `[submitAction] Player not found. RoomId: ${roomId}, User: ${userIdStr}, Candidates:`,
        players.map((p) => ({ u: p.user?.documentId, uid: p.user?.uid, s: p.userId }))
      );
      throw new Error(`Player not found in room. User: ${userIdStr}`);
    }

    console.log(`[submitAction] Found player at index ${playerIndex}. Updating action to: "${action}"`);

    // We must provide the full list of players to update the component
    // We should flatten relations to IDs to ensure clean update
    const updatedPlayers = players.map((p, index) => {
      // Extract IDs for relations
      const userId = p.user?.documentId || p.user?.id;
      const charId = p.character?.documentId || p.character?.id;
      const sheetId = p.characterSheet?.documentId || p.characterSheet?.id;

      const playerUpdate = {
        ...p,
        user: userId,
        character: charId,
        characterSheet: sheetId,
      };

      if (index === playerIndex) {
        return {
          ...playerUpdate,
          action: action,
        };
      }
      return playerUpdate;
    });

    await strapi.documents('api::room.room').update({
      documentId: room.documentId,
      data: {
        players: updatedPlayers,
      },
    });

    return { success: true, players: updatedPlayers };
  },
});
